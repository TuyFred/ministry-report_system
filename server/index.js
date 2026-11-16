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

connectDB().then(async () => {
    const EmailOtp = require('./models/EmailOtp');
    await EmailOtp.sync();
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to DB:', err);
    process.exit(1);
});