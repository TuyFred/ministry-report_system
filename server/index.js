// 1. Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { connectDB } = require('./config/db');
const crypto = require('crypto');
const { recordDeliveryEvent } = require('./services/otpService');
const auth = require('./middleware/auth');
const checkMaintenanceMode = require('./middleware/maintenance');

const app = express();
const frontendDir = path.join(__dirname, 'public');
const frontendIndex = path.join(frontendDir, 'index.html');

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://ministry-report-system.vercel.app',
            'https://gnitafrica.com',
            'https://www.gnitafrica.com',
            'https://report.gnitafrica.com',
            'http://report.gnitafrica.com',
            process.env.CLIENT_URL
        ];
        if (!origin || allowedOrigins.includes(origin) || origin?.endsWith('.vercel.app') || origin?.includes('gnitafrica.com')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());

// Override stale/static manifests when older frontend files are still deployed.
app.get('/manifest.json', (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.json({
        short_name: 'Olivet Assembly Africa',
        name: 'Olivet Assembly Africa',
        icons: [
            { src: 'favicon.ico', sizes: '64x64 32x32 24x24 16x16', type: 'image/x-icon' },
            { src: 'logo192.png', type: 'image/png', sizes: '192x192' },
            { src: 'logo512.png', type: 'image/png', sizes: '512x512' }
        ],
        start_url: '.',
        display: 'standalone',
        theme_color: '#000000',
        background_color: '#ffffff'
    });
});

app.use(express.static(frontendDir));

// Serve uploaded files from a stable absolute path.
// In production (e.g., Render), set UPLOAD_DIR to a persistent disk mount path.
const uploadsDir = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Routes
app.get('/', (req, res) => res.send('Ministry Reporting System API'));
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.post('/api/email/brevo-webhook', async (req, res) => {
    const secret = process.env.BREVO_WEBHOOK_SECRET;
    const suppliedSecret = req.get('x-brevo-webhook-secret') || req.query.secret || '';
    if (!secret) return res.status(503).json({ msg: 'Email delivery tracking is not configured.' });
    const expected = Buffer.from(secret);
    const supplied = Buffer.from(String(suppliedSecret));
    if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
        return res.status(401).json({ msg: 'Unauthorized.' });
    }

    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const item of events) {
        if (!item || typeof item !== 'object') continue;
        const messageId = item['message-id'] || item.messageId || item.message_id;
        const event = item.event || item.type;
        if (messageId && event) {
            await recordDeliveryEvent({ messageId, event });
        }
    }
    return res.status(200).json({ received: true });
});

// Apply maintenance mode check FIRST (before auth, checks token manually)
app.use('/api', checkMaintenanceMode);

// Auth routes
app.use('/api/auth', require('./routes/authRoutes'));

// Protected routes (require auth)
app.use('/api/maintenance', auth, require('./routes/maintenanceRoutes'));
app.use('/api/reports', auth, require('./routes/reportRoutes'));
app.use('/api/report-forms', require('./routes/reportFormRoutes'));
app.use('/api/users', auth, require('./routes/userRoutes'));
app.use('/api/backup', auth, require('./routes/backupRoutes'));

// 2. Connect to DB THEN start server
const PORT = process.env.PORT || 5000;

// Health check route to verify DB connectivity
app.get('/api/health', async (req, res) => {
    const { sequelize } = require('./config/db');
    try {
        await sequelize.authenticate();
        return res.status(200).json({ status: 'ok', db: 'connected' });
    } catch (err) {
        return res.status(500).json({ status: 'error', db: 'disconnected', message: err.message });
    }
});

app.use((req, res, next) => {
    if (
        req.method !== 'GET' ||
        req.path.startsWith('/api') ||
        req.path.startsWith('/uploads') ||
        req.path.startsWith('/assets') ||
        !req.accepts('html') ||
        !fs.existsSync(frontendIndex)
    ) {
        return next();
    }

    res.sendFile(frontendIndex, (err) => {
        if (err) next(err);
    });
});

app.use((err, req, res, next) => {
    console.error('API request error:', err.message);
    if (res.headersSent) return next(err);
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ msg: 'This website is not allowed to access the system.' });
    }
    return res.status(500).json({ msg: 'The system is temporarily unavailable. Please try again.' });
});

const runOneHourReminderFollowUps = async () => {
    try {
        const { Op } = require('sequelize');
        const Report = require('./models/Report');
        const User = require('./models/User');
        const ReportReminder = require('./models/ReportReminder');
        const { sendReminderEmail, detectPreferredLanguage, chooseReminderVerse } = require('./services/emailService');
        const cutoff = new Date(Date.now() - 60 * 60 * 1000);
        const reminders = await ReportReminder.findAll({
            where: {
                recipient_type: 'member',
                sent_at: { [Op.lt]: cutoff },
                follow_up_sent_at: null
            },
            include: [{ model: User, as: 'User', attributes: ['id', 'fullname', 'email', 'country', 'preferred_language', 'reporting_exempt'] }]
        });
        for (const reminder of reminders) {
            const member = reminder.User;
            if (!member || member.reporting_exempt) continue;
            const reportCount = await Report.count({
                where: { user_id: member.id, date: { [Op.between]: [reminder.week_start, reminder.week_end] } }
            });
            if (reportCount > 0) continue;
            try {
                const language = detectPreferredLanguage({ preferredLanguage: member.preferred_language, country: member.country });
                const verse = await chooseReminderVerse(member.id);
                const delivery = await sendReminderEmail({
                    email: member.email,
                    name: member.fullname,
                    country: member.country,
                    preferredLanguage: language,
                    weekStart: reminder.week_start,
                    weekEnd: reminder.week_end,
                    submittedReports: 0,
                    missedReports: reminder.missed_reports,
                    customSubject: `Follow-up: weekly report reminder for ${reminder.week_start}–${reminder.week_end}`,
                    verse
                });
                await reminder.update({
                    follow_up_sent_at: new Date(),
                    follow_up_count: (reminder.follow_up_count || 0) + 1,
                    email_status: delivery.deliveryStatus,
                    message_id: delivery.messageId
                });
            } catch (error) {
                await reminder.update({ email_status: 'failed' });
                console.error(`One-hour reminder follow-up failed for ${member.email}:`, error.message);
            }
        }
    } catch (error) {
        console.error('One-hour reminder follow-up sweep error:', error.message);
    }
};

const runAutomaticWeeklyReminders = async () => {
    try {
        await runOneHourReminderFollowUps();
        const now = new Date();
        if (now.getUTCDay() !== 0) return;
        const configuredHour = Number(process.env.WEEKLY_REMINDER_HOUR_UTC);
        if (Number.isFinite(configuredHour) && now.getUTCHours() < configuredHour) return;

        const { Op } = require('sequelize');
        const Report = require('./models/Report');
        const User = require('./models/User');
        const ReportReminder = require('./models/ReportReminder');
        const { sendReminderEmail, sendLeaderSummaryEmail, detectPreferredLanguage, chooseReminderVerse } = require('./services/emailService');
        const weekEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
        const weekStart = new Date(weekEnd);
        weekStart.setUTCDate(weekEnd.getUTCDate() - 6);
        const start = weekStart.toISOString().split('T')[0];
        const end = weekEnd.toISOString().split('T')[0];

        const users = await User.findAll({ where: { role: { [Op.ne]: 'admin' }, reporting_exempt: { [Op.ne]: true } } });
        for (const user of users) {
            const reports = await Report.findAll({
                attributes: ['date'],
                where: { user_id: user.id, date: { [Op.between]: [start, end] } }
            });
            const submitted = new Set(reports.map(report => report.date)).size;
            if (submitted >= 7) continue;

            const [reminder] = await ReportReminder.findOrCreate({
                where: { user_id: user.id, week_start: start, week_end: end },
                defaults: {
                    user_id: user.id,
                    week_start: start,
                    week_end: end,
                    expected_reports: 7,
                    submitted_reports: submitted,
                    missed_reports: 7 - submitted
                }
            });
            if (reminder.sent_at) continue;

            try {
                const language = detectPreferredLanguage({ preferredLanguage: user.preferred_language, country: user.country });
                const verse = await chooseReminderVerse(user.id);
                const delivery = await sendReminderEmail({
                    email: user.email,
                    name: user.fullname,
                    country: user.country,
                    preferredLanguage: language,
                    weekStart: start,
                    weekEnd: end,
                    submittedReports: submitted,
                    missedReports: 7 - submitted,
                    verse
                });
                await reminder.update({
                    email_status: delivery.deliveryStatus,
                    message_id: delivery.messageId,
                    sent_at: new Date(),
                    recipient_type: 'member',
                    recipient_id: user.id,
                    country: user.country,
                    language: delivery.language,
                    subject: delivery.subject,
                    message_html: delivery.htmlContent,
                    verse_reference: delivery.verse.reference,
                    verse_text: delivery.verse.text
                });
            } catch (error) {
                await reminder.update({ email_status: 'failed', sent_at: new Date() });
                console.error(`Weekly reminder failed for ${user.email}:`, error.message);
            }
        }

        const leaders = await User.findAll({ where: { role: 'leader', reporting_exempt: { [Op.ne]: true } } });
        for (const leader of leaders) {
            const countryUsers = await User.findAll({
                where: { country: leader.country, role: { [Op.ne]: 'admin' }, reporting_exempt: { [Op.ne]: true } }
            });
            const missingMembers = [];
            let submittedCount = 0;
            for (const member of countryUsers) {
                const reportCount = await Report.count({
                    where: { user_id: member.id, date: { [Op.between]: [start, end] } }
                });
                if (reportCount > 0) submittedCount++;
                else missingMembers.push({ fullname: member.fullname, email: member.email });
            }
            const existing = await ReportReminder.findOne({
                where: { recipient_type: 'leader-summary', recipient_id: leader.id, week_start: start, week_end: end }
            });
            if (existing?.sent_at) continue;
            const [summary] = await ReportReminder.findOrCreate({
                where: { recipient_type: 'leader-summary', recipient_id: leader.id, week_start: start, week_end: end },
                defaults: {
                    user_id: leader.id,
                    recipient_type: 'leader-summary',
                    recipient_id: leader.id,
                    country: leader.country,
                    language: 'en',
                    week_start: start,
                    week_end: end,
                    expected_reports: countryUsers.length,
                    submitted_reports: submittedCount,
                    missed_reports: missingMembers.length
                }
            });
            try {
                const delivery = await sendLeaderSummaryEmail({
                    email: leader.email,
                    name: leader.fullname,
                    country: leader.country,
                    weekStart: start,
                    weekEnd: end,
                    expectedMembers: countryUsers.length,
                    submittedReports: submittedCount,
                    missingMembers
                });
                await summary.update({
                    email_status: delivery.deliveryStatus,
                    message_id: delivery.messageId,
                    sent_at: new Date(),
                    subject: delivery.subject,
                    message_html: delivery.htmlContent
                });
            } catch (error) {
                await summary.update({ email_status: 'failed', sent_at: new Date() });
                console.error(`Leader summary failed for ${leader.email}:`, error.message);
            }
        }

    } catch (error) {
        console.error('Automatic weekly reminder sweep error:', error.message);
    }
};

connectDB().then(async () => {
    const EmailOtp = require('./models/EmailOtp');
    const ReportReminder = require('./models/ReportReminder');
    const User = require('./models/User');
    const { sequelize } = require('./config/db');
    const { DataTypes } = require('sequelize');
    const queryInterface = sequelize.getQueryInterface();
    const userColumns = await queryInterface.describeTable('users');
    if (!userColumns.preferred_language) {
        await queryInterface.addColumn('users', 'preferred_language', {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'en'
        });
    }
    if (!userColumns.reporting_exempt) {
        await queryInterface.addColumn('users', 'reporting_exempt', {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        });
    }
    if (!userColumns.exemption_reason) {
        await queryInterface.addColumn('users', 'exemption_reason', {
            type: DataTypes.STRING,
            allowNull: true
        });
    }
    await ReportReminder.sync();
    const reminderColumns = await queryInterface.describeTable('report_reminders');
    if (!reminderColumns.follow_up_sent_at) {
        await queryInterface.addColumn('report_reminders', 'follow_up_sent_at', {
            type: DataTypes.DATE,
            allowNull: true
        });
    }
    if (!reminderColumns.follow_up_count) {
        await queryInterface.addColumn('report_reminders', 'follow_up_count', {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        });
    }
    await User.sync();
    await EmailOtp.sync();
    await ReportReminder.sync();
    await runAutomaticWeeklyReminders();
    setInterval(runAutomaticWeeklyReminders, 15 * 60 * 1000);
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to DB:', err);
    process.exit(1);
});