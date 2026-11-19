const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sequelize } = require('../config/db');
const User = require('../models/User');
const EmailOtp = require('../models/EmailOtp');
const { requestOtp, consumeOtp } = require('../services/otpService');

exports.register = async (req, res) => {
    try {
        const { fullname, email, password, country, contact, address } = req.body;
        if (typeof fullname !== 'string' || typeof email !== 'string' || typeof password !== 'string' || typeof country !== 'string' ||
            !fullname.trim() || !email.trim() || password.length < 6 || !country.trim()) {
            return res.status(400).json({ msg: 'Full name, email, country, and a password of at least 6 characters are required.' });
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ where: { email: normalizedEmail } });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const delivery = await requestOtp({
            email: normalizedEmail,
            name: fullname,
            purpose: 'registration',
            payload: { fullname, password: hashedPassword, country, contact, address }
        });
        return res.status(202).json({ msg: 'A verification code has been sent to your email address.', ...delivery });
    } catch (err) {
        console.error('Registration OTP error:', err.message);
        const status = err.code === 'OTP_RATE_LIMITED' ? 429 : ['EMAIL_NOT_CONFIGURED', 'OTP_NOT_CONFIGURED'].includes(err.code) ? 503 : 500;
        return res.status(status).json({
            msg: err.code === 'OTP_RATE_LIMITED' ? err.message : 'Unable to send the verification email. Please try again later.',
            ...(err.retryAfterSeconds ? { retryAfterSeconds: err.retryAfterSeconds } : {})
        });
    }
};

exports.verifyRegistrationOtp = async (req, res) => {
    const { email, otp } = req.body;
    if (typeof email !== 'string' || !email.trim() || !/^\d{6}$/.test(String(otp || ''))) {
        return res.status(400).json({ msg: 'A valid email address and six-digit code are required.' });
    }
    try {
        const user = await sequelize.transaction(async (transaction) => {
            const verification = await consumeOtp({ email, purpose: 'registration', otp: String(otp), transaction });
            if (!verification || !verification.payload) return null;
            const existing = await User.findOne({
                where: { email: email.trim().toLowerCase() },
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (existing) return null;
            return User.create({
                ...verification.payload,
                email: email.trim().toLowerCase(),
                role: 'member'
            }, { transaction });
        });
        if (!user) return res.status(400).json({ msg: 'The code is invalid, expired, or already used.' });
        return res.json({ msg: 'Your email is verified and your account has been created.' });
    } catch (err) {
        console.error('Registration verification error:', err.message);
        return res.status(500).json({ msg: 'Unable to verify the code. Please try again.' });
    }
};

exports.resendRegistrationOtp = async (req, res) => {
    const { email } = req.body;
    if (typeof email !== 'string' || !email.trim()) return res.status(400).json({ msg: 'Email is required.' });
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const pending = await EmailOtp.findOne({
            where: { email: normalizedEmail, purpose: 'registration', usedAt: null },
            order: [['createdAt', 'DESC']]
        });
        if (!pending || !pending.payload) {
            return res.status(400).json({ msg: 'No pending account verification was found.' });
        }
        const delivery = await requestOtp({
            email: normalizedEmail,
            name: pending.payload.fullname,
            purpose: 'registration',
            payload: pending.payload
        });
        return res.json({ msg: 'A new verification code has been sent.', ...delivery });
    } catch (err) {
        const status = err.code === 'OTP_RATE_LIMITED' ? 429 : ['EMAIL_NOT_CONFIGURED', 'OTP_NOT_CONFIGURED'].includes(err.code) ? 503 : 500;
        return res.status(status).json({
            msg: err.code === 'OTP_RATE_LIMITED' ? err.message : 'Unable to resend the verification code.',
            ...(err.retryAfterSeconds ? { retryAfterSeconds: err.retryAfterSeconds } : {})
        });
    }
};

// Admin registration endpoint - for Postman/API use only
exports.registerAdmin = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ msg: 'Only administrators can create administrator accounts.' });
        }
        const { fullname, email, password, country, contact, address, adminSecret } = req.body;

        // Verify admin secret key (you should set this in .env)
        if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
            return res.status(403).json({ msg: 'Unauthorized: Invalid admin secret key' });
        }
        if (!fullname || !email || !password || password.length < 6 || !country) {
            return res.status(400).json({ msg: 'Full name, email, country, and a password of at least 6 characters are required.' });
        }
        const normalizedEmail = email.trim().toLowerCase();

        // Check if user exists
        let user = await User.findOne({ where: { email: normalizedEmail } });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user
        user = await User.create({
            fullname,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'admin',
            country,
            contact,
            address
        });

        // Create token
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                country: user.country
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' }, (err, token) => {
            if (err) throw err;
            res.json({ 
                msg: 'Admin account created successfully',
                token, 
                user: { id: user.id, fullname: user.fullname, email: user.email, role: user.role, country: user.country, profile_image: user.profile_image } 
            });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Unable to complete the request. Please try again.' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please provide email and password' });
        }

        // Check user
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ where: { email: normalizedEmail } });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Check password
        if (typeof user.password !== 'string' || !user.password) {
            console.error('Login error: user account has no valid password hash.');
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }
        const isMatch = await bcrypt.compare(String(password), user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Check if system is in maintenance mode
        const fs = require('fs');
        const path = require('path');
        const maintenanceFilePath = path.join(__dirname, '../maintenance.json');
        
        if (fs.existsSync(maintenanceFilePath)) {
            let maintenanceData = { isMaintenanceMode: false };
            try {
                maintenanceData = JSON.parse(fs.readFileSync(maintenanceFilePath, 'utf8'));
            } catch (maintenanceError) {
                console.error('Unable to read maintenance mode configuration:', maintenanceError.message);
            }
            
            // If maintenance is on and user is not admin, block login
            if (maintenanceData.isMaintenanceMode && user.role !== 'admin') {
                return res.status(503).json({ 
                    msg: 'System is under maintenance. Only administrators can access.',
                    maintenanceMode: true 
                });
            }
        }

        // Create token
        const payload = {
            user: {
                id: user.id,
                role: user.role,
                country: user.country
            }
        };

        let token;
        try {
            token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
        } catch (tokenError) {
            console.error('Login token error:', tokenError.message);
            return res.status(500).json({ msg: 'Unable to start your session. Please try again.' });
        }
        return res.json({
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                country: user.country,
                profile_image: user.profile_image,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ msg: 'Unable to sign in right now. Please try again.' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Unable to load your account. Please try again.' });
    }
};

// Forgot Password - Send reset token
exports.forgotPassword = async (req, res) => {
    return exports.requestPasswordResetOtp(req, res);
};

exports.requestPasswordResetOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required.' });
    try {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ where: { email: normalizedEmail } });
        if (user) {
            const delivery = await requestOtp({
                email: normalizedEmail,
                name: user.fullname,
                userId: user.id,
                purpose: 'password-reset'
            });
            return res.json({ msg: 'If an account exists for this address, a verification code has been sent.', ...delivery });
        }
        return res.json({ msg: 'If an account exists for this address, a verification code has been sent.' });
    } catch (err) {
        console.error('Password reset OTP error:', err.message);
        const status = err.code === 'OTP_RATE_LIMITED' ? 429 : ['EMAIL_NOT_CONFIGURED', 'OTP_NOT_CONFIGURED'].includes(err.code) ? 503 : 500;
        return res.status(status).json({
            msg: err.code === 'OTP_RATE_LIMITED' ? err.message : 'Unable to send the verification email. Please try again later.',
            ...(err.retryAfterSeconds ? { retryAfterSeconds: err.retryAfterSeconds } : {})
        });
    }
};

exports.resendPasswordResetOtp = async (req, res) => exports.requestPasswordResetOtp(req, res);

exports.resetPasswordWithOtp = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    if (typeof email !== 'string' || !email.trim() || !/^\d{6}$/.test(String(otp || '')) ||
        typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({ msg: 'Email, a six-digit code, and a password of at least 6 characters are required.' });
    }
    try {
        const updated = await sequelize.transaction(async (transaction) => {
            const verification = await consumeOtp({ email, purpose: 'password-reset', otp: String(otp), transaction });
            if (!verification) return false;
            const user = await User.findOne({
                where: { email: email.trim().toLowerCase() },
                transaction,
                lock: transaction.LOCK.UPDATE
            });
            if (!user || (verification.userId && verification.userId !== user.id)) return false;
            user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
            user.resetPasswordToken = null;
            user.resetPasswordExpire = null;
            await user.save({ transaction });
            return true;
        });
        if (!updated) return res.status(400).json({ msg: 'The code is invalid, expired, or already used.' });
        return res.json({ msg: 'Password has been reset successfully.' });
    } catch (err) {
        console.error('OTP password reset error:', err.message);
        return res.status(500).json({ msg: 'Unable to reset the password. Please try again.' });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({ where: { resetPasswordToken: token } });

        if (!user || new Date() > user.resetPasswordExpire) {
            return res.status(400).json({ msg: 'Invalid or expired reset token' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();

        res.json({ msg: 'Password has been reset successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Unable to reset the password. Please try again.' });
    }
};

// Change Password (for logged-in users)
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get user
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: 'Password changed successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Unable to change the password. Please try again.' });
    }
};

// Create Admin (Protected: Admin only)
exports.createAdmin = async (req, res) => {
    try {
        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized to create admin accounts' });
        }

        const { fullname, email, password, country } = req.body;

        // Check if user exists
        let user = await User.findOne({ where: { email } });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create admin user
        user = await User.create({
            fullname,
            email,
            password: hashedPassword,
            role: 'admin',
            country
        });

        res.json({ msg: 'Admin account created successfully', user: { id: user.id, fullname: user.fullname, email: user.email, role: user.role } });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Unable to create the administrator account. Please try again.' });
    }
};