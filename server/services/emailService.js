const axios = require('axios');

const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[character]));

const createOtpEmailHtml = ({ appName, name, otp, expiresMinutes }) => {
    const safeAppName = escapeHtml(appName);
    const safeName = escapeHtml(name || 'there');
    return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
  <div style="display:none;max-height:0;overflow:hidden">Your ${safeAppName} verification code expires in ${expiresMinutes} minutes.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
        <tr><td style="background:#4338ca;padding:26px 32px;color:#fff;font-size:22px;font-weight:bold">${safeAppName}</td></tr>
        <tr><td style="padding:32px">
          <h1 style="font-size:22px;margin:0 0 16px">Your verification code</h1>
          <p style="font-size:16px;line-height:1.6;margin:0 0 18px">Hello ${safeName}, use this one-time code to continue:</p>
          <div style="background:#eef2ff;border-radius:12px;padding:18px;text-align:center;font-size:34px;letter-spacing:10px;font-weight:bold;color:#3730a3">${otp}</div>
          <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:18px 0">This code expires in <strong>${expiresMinutes} minutes</strong> and can only be used once.</p>
          <p style="font-size:14px;line-height:1.6;color:#991b1b;background:#fef2f2;padding:14px;border-radius:8px;margin:0">Security notice: Never share this code with anyone. Our team will never ask you for it. If you did not request it, you can ignore this message.</p>
        </td></tr>
        <tr><td style="padding:0 32px 28px;color:#6b7280;font-size:12px">This is an automated security email from ${safeAppName}.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const sendOtpEmail = async ({ email, name, otp, expiresMinutes }) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    if (!apiKey || !senderEmail) {
        const error = new Error('Brevo email is not configured. Set BREVO_API_KEY and BREVO_SENDER_EMAIL.');
        error.code = 'EMAIL_NOT_CONFIGURED';
        throw error;
    }

    const appName = process.env.APP_NAME || 'Ministry Reports';
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: {
            email: senderEmail,
            name: process.env.BREVO_SENDER_NAME || appName
        },
        to: [{ email }],
        subject: `${appName} verification code`,
        htmlContent: createOtpEmailHtml({ appName, name, otp, expiresMinutes }),
        textContent: `Your ${appName} verification code is ${otp}. It expires in ${expiresMinutes} minutes. Never share this code.`
    }, {
        headers: {
            'api-key': apiKey,
            'accept': 'application/json',
            'content-type': 'application/json'
        },
        timeout: 15000
    });

    const messageId = response.data?.messageId || null;
    console.info('Brevo transactional email accepted', { messageId });
    return { messageId, deliveryStatus: 'queued' };
};

const sendReminderEmail = async ({ email, name, weekStart, weekEnd, submittedReports, missedReports }) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    if (!apiKey || !senderEmail) {
        const error = new Error('Brevo email is not configured.');
        error.code = 'EMAIL_NOT_CONFIGURED';
        throw error;
    }

    const appName = process.env.APP_NAME || 'Ministry Reports';
    const safeName = escapeHtml(name || 'Member');
    const safeWeekStart = escapeHtml(weekStart);
    const safeWeekEnd = escapeHtml(weekEnd);
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: {
            email: senderEmail,
            name: process.env.BREVO_SENDER_NAME || appName
        },
        to: [{ email, name: name || undefined }],
        subject: `Weekly report reminder: ${weekStart} to ${weekEnd}`,
        htmlContent: `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#1f2937">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:16px">
          <tr><td style="background:#4f46e5;padding:24px 32px;color:#fff;font-size:22px;font-weight:bold">${escapeHtml(appName)}</td></tr>
          <tr><td style="padding:32px"><h1 style="margin-top:0">Your weekly report is incomplete</h1>
          <p>Hello ${safeName},</p><p>The reporting week <strong>${safeWeekStart}</strong> to <strong>${safeWeekEnd}</strong> has ended. You submitted <strong>${submittedReports}</strong> report(s), with <strong>${missedReports}</strong> reporting day(s) missing.</p>
          <p>Please submit the remaining reports as soon as possible.</p></td></tr></table></td></tr></table></body></html>`,
        textContent: `Hello ${name || 'Member'}, your reporting week (${weekStart} to ${weekEnd}) is incomplete. Submitted: ${submittedReports}. Missing: ${missedReports}. Please submit the remaining reports.`
    }, {
        headers: { 'api-key': apiKey, accept: 'application/json', 'content-type': 'application/json' },
        timeout: 15000
    });
    return { messageId: response.data?.messageId || null, deliveryStatus: 'queued' };
};

module.exports = { sendOtpEmail, sendReminderEmail };
