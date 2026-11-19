const crypto = require('crypto');
const { Op } = require('sequelize');
const EmailOtp = require('../models/EmailOtp');
const { sendOtpEmail } = require('./emailService');

const OTP_LIFETIME_MINUTES = 10;
const RESEND_DELAY_SECONDS = 60;
const MAX_SENDS_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

const digestOtp = (email, purpose, otp) => crypto
    .createHmac('sha256', process.env.OTP_HASH_SECRET || '')
    .update(`${email.toLowerCase()}:${purpose}:${otp}`)
    .digest('hex');

const requestOtp = async ({ email, name, userId = null, purpose, payload = null }) => {
    if (!process.env.OTP_HASH_SECRET) {
        const error = new Error('OTP_HASH_SECRET must be configured.');
        error.code = 'OTP_NOT_CONFIGURED';
        throw error;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date();
    await EmailOtp.destroy({
        where: { createdAt: { [Op.lt]: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } }
    });
    const recent = await EmailOtp.findAll({
        where: {
            email: normalizedEmail,
            purpose,
            createdAt: { [Op.gte]: new Date(now.getTime() - 60 * 60 * 1000) }
        },
        order: [['createdAt', 'DESC']]
    });
    if (recent.length && recent[0].resendAvailableAt > now) {
        const error = new Error('Please wait before requesting another code.');
        error.code = 'OTP_RATE_LIMITED';
        error.retryAfterSeconds = Math.ceil((recent[0].resendAvailableAt - now) / 1000);
        throw error;
    }
    if (recent.length >= MAX_SENDS_PER_HOUR) {
        const error = new Error('Too many verification codes requested. Try again later.');
        error.code = 'OTP_RATE_LIMITED';
        error.retryAfterSeconds = Math.ceil((recent[recent.length - 1].createdAt.getTime() + 60 * 60 * 1000 - now.getTime()) / 1000);
        throw error;
    }

    await EmailOtp.update(
        { usedAt: now },
        { where: { email: normalizedEmail, purpose, usedAt: null } }
    );
    const otp = crypto.randomInt(0, 1000000).toString().padStart(6, '0');
    const expiresAt = new Date(now.getTime() + OTP_LIFETIME_MINUTES * 60 * 1000);
    const record = await EmailOtp.create({
        userId,
        email: normalizedEmail,
        purpose,
        codeHash: digestOtp(normalizedEmail, purpose, otp),
        expiresAt,
        resendAvailableAt: new Date(now.getTime() + RESEND_DELAY_SECONDS * 1000),
        payload
    });

    try {
        const emailResult = await sendOtpEmail({
            email: normalizedEmail,
            name,
            otp,
            expiresMinutes: OTP_LIFETIME_MINUTES
        });
        await record.update(emailResult);
    } catch (error) {
        await record.update({ usedAt: new Date(), deliveryStatus: 'failed' });
        throw error;
    }

    return {
        expiresInMinutes: OTP_LIFETIME_MINUTES,
        resendAfterSeconds: RESEND_DELAY_SECONDS
    };
};

const consumeOtp = async ({ email, purpose, otp, transaction }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const record = await EmailOtp.findOne({
        where: {
            email: normalizedEmail,
            purpose,
            usedAt: null
        },
        order: [['createdAt', 'DESC']],
        transaction,
        lock: transaction?.LOCK?.UPDATE
    });
    const now = new Date();
    if (!record || record.expiresAt <= now || record.attempts >= MAX_ATTEMPTS) {
        return null;
    }
    const submittedHash = Buffer.from(digestOtp(normalizedEmail, purpose, otp));
    const expectedHash = Buffer.from(record.codeHash);
    const matches = submittedHash.length === expectedHash.length && crypto.timingSafeEqual(submittedHash, expectedHash);
    if (!matches) {
        await record.increment('attempts', { transaction });
        return null;
    }
    await record.update({ usedAt: now }, { transaction });
    return record;
};

const recordDeliveryEvent = async ({ messageId, event }) => {
    if (!messageId) return false;
    const record = await EmailOtp.findOne({ where: { messageId } });
    if (record) {
        await record.update({ deliveryStatus: event });
    }
    const ReportReminder = require('../models/ReportReminder');
    const reminder = await ReportReminder.findOne({ where: { message_id: messageId } });
    if (reminder) {
        const events = Array.isArray(reminder.delivery_events) ? reminder.delivery_events : [];
        await reminder.update({
            email_status: event,
            delivery_events: [...events, { event, receivedAt: new Date().toISOString() }]
        });
    }
    if (record || reminder) {
        console.info('Brevo delivery status updated', { messageId, event });
        return true;
    }
    return false;
};

module.exports = { requestOtp, consumeOtp, recordDeliveryEvent };
