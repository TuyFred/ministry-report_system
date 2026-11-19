const express = require('express');
const router = express.Router();
const {
    register,
    verifyRegistrationOtp,
    resendRegistrationOtp,
    registerAdmin,
    login,
    getMe,
    forgotPassword,
    resetPassword,
    requestPasswordResetOtp,
    resendPasswordResetOtp,
    resetPasswordWithOtp,
    changePassword,
    createAdmin
} = require('../controllers/authController');
const auth = require('../middleware/auth');

// Simple health check route (will be blocked by maintenance middleware)
router.get('/check', (req, res) => {
    res.json({ status: 'ok' });
});

router.post('/register', register);
router.post('/register/verify-otp', verifyRegistrationOtp);
router.post('/register/resend-otp', resendRegistrationOtp);
router.post('/register-admin', auth, registerAdmin);
router.post('/create-admin', auth, createAdmin);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/password-reset/request-otp', requestPasswordResetOtp);
router.post('/password-reset/resend-otp', resendPasswordResetOtp);
router.post('/password-reset/verify-otp', resetPasswordWithOtp);
router.post('/change-password', auth, changePassword);

module.exports = router;