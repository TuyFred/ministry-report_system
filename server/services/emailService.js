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

const REMINDER_VERSES = [
    { reference: 'Colossians 3:23', text: 'Whatever you do, work at it with all your heart, as working for the Lord.' },
    { reference: '1 Thessalonians 5:11', text: 'Therefore encourage one another and build each other up.' },
    { reference: 'Matthew 28:19', text: 'Go and make disciples of all nations.' },
    { reference: 'Romans 12:11', text: 'Never be lacking in zeal, but keep your spiritual fervor, serving the Lord.' },
    { reference: 'Galatians 6:9', text: 'Let us not become weary in doing good, for at the proper time we will reap a harvest.' }
];

const REMINDER_TEXT = {
    en: {
        greeting: 'Dear',
        subject: 'Personal mission service report reminder',
        intro: 'Warm greetings! We hope you are doing well.',
        remind: 'We have not yet received your personal mission service report',
        encouragement: 'We would love to hear about your activities and experiences in God’s work this week.',
        verseTitle: 'A Word of Encouragement',
        closing: 'May God continue to strengthen you and bless your service. Every effort made in His name matters!',
        thankYou: 'Thank you for serving together with us.',
        signoff: 'With love,',
        team: 'The Administration Team'
    },
    fr: {
        greeting: 'Cher/Chère',
        subject: 'Rappel de rapport de service missionnaire',
        intro: 'Chers salutations! Nous espérons que vous allez bien.',
        remind: 'Nous n’avons pas encore reçu votre rapport personnel de service missionnaire',
        encouragement: 'Nous aimerions connaître vos activités et expériences dans l’œuvre de Dieu cette semaine.',
        verseTitle: 'Une parole d’encouragement',
        closing: 'Que Dieu continue de vous fortifier et de bénir votre service. Chaque effort fait en Son nom compte!',
        thankYou: 'Merci de servir avec nous.',
        signoff: 'Avec amour,',
        team: 'L’équipe administrative'
    },
    rw: {
        greeting: 'Muraho',
        subject: 'Kwibutsa gutanga raporo ya buri cyumweru',
        intro: 'Muraho! Twizeye ko mubaye neza.',
        remind: 'Ntabwo twakiriye raporo y’akazi ryanyu rya misiyoni',
        encouragement: 'Twifuza kumenya ibikorwa n’uburambe bwanyu mu murimo w’Imana muri iki cyumweru.',
        verseTitle: 'Ijambo ry’Inkuru y’Imbaraga',
        closing: 'Imana ikomeze kubaha imbaraga kandi ihe umugisha mu murimo wanyu.',
        thankYou: 'Murakoze gukorera hamwe natwe.',
        signoff: 'Kubw’urukundo,',
        team: 'Itsinda ry’Ubuyobozi'
    }
};

const detectPreferredLanguage = ({ preferredLanguage, country }) => {
    const configured = String(preferredLanguage || '').trim().toLower().slice(0, 2);
    if (REMINDER_TEXT[configured]) return configured;
    const normalizedCountry = String(country || '').trim().toLower();
    if (normalizedCountry.includes('rwanda')) return 'rw';
    if (normalizedCountry.includes('france') || normalizedCountry.includes('cameroon') || normalizedCountry.includes('senegal')) return 'fr';
    return 'en';
};

const chooseReminderVerse = async (userId) => {
    const { Op } = require('sequelize');
    const ReportReminder = require('../models/ReportReminder');
    const recent = await ReportReminder.findAll({
        where: { user_id: userId, verse_reference: { [Op.ne]: null } },
        attributes: ['verse_reference'],
        order: [['createdAt', 'DESC']],
        limit: 12
    });
    const recentReferences = new Set(recent.map(record => record.verse_reference));
    return REMINDER_VERSES.find(verse => !recentReferences.has(verse.reference)) || REMINDER_VERSES[0];
};

const sendReminderEmail = async ({ email, name, country, preferredLanguage, weekStart, weekEnd, submittedReports, missedReports, customSubject, customMessage, verse: selectedVerse }) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    if (!apiKey || !senderEmail) {
        const error = new Error('Brevo email is not configured.');
        error.code = 'EMAIL_NOT_CONFIGURED';
        throw error;
    }

    const appName = process.env.APP_NAME || 'Ministry Reports';
    const language = detectPreferredLanguage({ preferredLanguage, country });
    const texts = REMINDER_TEXT[language];
    const safeName = escapeHtml(name || 'Member');
    const safeWeekStart = escapeHtml(weekStart);
    const safeWeekEnd = escapeHtml(weekEnd);
    const verse = selectedVerse || REMINDER_VERSES[0];
    const subject = customSubject || `${texts.subject}: ${weekStart}–${weekEnd}`;
    const defaultMessage = `${texts.greeting} ${safeName},<br><br>${texts.intro}<br><br>${texts.remind} for <strong>${safeWeekStart}–${safeWeekEnd}</strong>.<br><br>${texts.encouragement}`;
    const htmlBody = customMessage || defaultMessage;
    const htmlContent = `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#1f2937">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
      <tr><td style="background:#4f46e5;padding:24px 32px;color:#fff;font-size:22px;font-weight:bold">${escapeHtml(appName)}</td></tr>
      <tr><td style="padding:32px"><p style="line-height:1.7">${htmlBody}</p>
      <div style="border-left:4px solid #6366f1;background:#eef2ff;padding:16px;margin:20px 0"><strong>${texts.verseTitle}</strong><br><em>“${escapeHtml(verse.text)}” — ${verse.reference}</em></div>
      <p>${texts.closing}</p><p>${texts.thankYou}</p><p>${texts.signoff}<br><strong>${texts.team}</strong></p></td></tr></table></td></tr></table></body></html>`;
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: {
            email: senderEmail,
            name: process.env.BREVO_SENDER_NAME || appName
        },
        to: [{ email, name: name || undefined }],
        subject,
        htmlContent,
        textContent: `${texts.greeting} ${name || 'Member'}, ${texts.remind} ${weekStart}–${weekEnd}. Submitted: ${submittedReports}. Missing: ${missedReports}. ${texts.closing}`
    }, {
        headers: { 'api-key': apiKey, accept: 'application/json', 'content-type': 'application/json' },
        timeout: 15000
    });
    return { messageId: response.data?.messageId || null, deliveryStatus: 'queued', language, verse, subject, htmlContent };
};

const sendLeaderSummaryEmail = async ({ email, name, country, weekStart, weekEnd, expectedMembers, submittedReports, missingMembers, customSubject, customMessage }) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    if (!apiKey || !senderEmail) {
        const error = new Error('Brevo email is not configured.');
        error.code = 'EMAIL_NOT_CONFIGURED';
        throw error;
    }
    const missedCount = missingMembers.length;
    const completionRate = expectedMembers > 0 ? Math.round((submittedReports / expectedMembers) * 100) : 0;
    const verse = REMINDER_VERSES[1];
    const subject = customSubject || `Weekly reporting update for ${country}`;
    const rows = missingMembers.map((member, index) =>
        `<tr><td style="padding:8px;border:1px solid #e5e7eb">${index + 1}</td><td style="padding:8px;border:1px solid #e5e7eb">${escapeHtml(member.fullname)}</td><td style="padding:8px;border:1px solid #e5e7eb"><a href="mailto:${escapeHtml(member.email)}">${escapeHtml(member.email)}</a></td></tr>`
    ).join('');
    const summaryMessage = customMessage || `Dear ${escapeHtml(name || 'Country Leader')},<br><br>Here is the weekly reporting update for <strong>${escapeHtml(country)}</strong>.`;
    const htmlContent = `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#1f2937">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px"><tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#fff;border-radius:16px;overflow:hidden">
      <tr><td style="background:#4f46e5;padding:24px 32px;color:#fff;font-size:22px;font-weight:bold">Ministry Report System</td></tr>
      <tr><td style="padding:32px"><p style="line-height:1.7">${summaryMessage}</p><p><strong>Reporting period:</strong> ${escapeHtml(weekStart)}–${escapeHtml(weekEnd)}</p>
      <h3>Reporting Summary</h3><ul><li>Expected members: ${expectedMembers}</li><li>Submitted reports: ${submittedReports}</li><li>Missing reports: ${missedCount}</li><li>Completion rate: ${completionRate}%</li></ul>
      ${missedCount > 0 ? `<h3>Members Who Have Not Reported</h3><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse"><thead><tr><th style="padding:8px;border:1px solid #e5e7eb;text-align:left">No.</th><th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Member</th><th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Email</th></tr></thead><tbody>${rows}</tbody></table>` : '<p>All expected members submitted a report.</p>'}
      <div style="border-left:4px solid #6366f1;background:#eef2ff;padding:16px;margin:20px 0"><strong>Word of God:</strong><br><em>“${escapeHtml(verse.text)}” — ${verse.reference}</em></div>
      <p>With appreciation,<br><strong>The Administration Team</strong></p></td></tr></table></td></tr></table></body></html>`;
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME || 'Ministry Reports' },
        to: [{ email, name: name || undefined }],
        subject,
        htmlContent,
        textContent: `Reporting update for ${country}, ${weekStart}–${weekEnd}. Expected: ${expectedMembers}. Submitted: ${submittedReports}. Missing: ${missedCount}. Completion: ${completionRate}%`
    }, {
        headers: { 'api-key': apiKey, accept: 'application/json', 'content-type': 'application/json' },
        timeout: 15000
    });
    return { messageId: response.data?.messageId || null, deliveryStatus: 'queued', language: 'en', subject, htmlContent };
};

module.exports = { sendOtpEmail, sendReminderEmail, sendLeaderSummaryEmail, detectPreferredLanguage, chooseReminderVerse, REMINDER_VERSES };
