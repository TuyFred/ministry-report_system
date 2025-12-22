// 1. Load environment variables FIRST
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');
const auth = require('./middleware/auth');
const checkMaintenanceMode = require('./middleware/maintenance');

const app = express();

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000', 
            'http://localhost:5173',
            'https://ministry-report-system.vercel.app',
            process.env.CLIENT_URL
        ];
        if (!origin || allowedOrigins.includes(origin) || origin?.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());

// Serve uploaded files from a stable absolute path.
// In production (e.g., Render), set UPLOAD_DIR to a persistent disk mount path.
const uploadsDir = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Routes
app.get('/', (req, res) => res.send('Ministry Reporting System API'));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Apply maintenance mode check FIRST (before auth, checks token manually)
app.use('/api', checkMaintenanceMode);

// Auth routes
app.use('/api/auth', require('./routes/authRoutes'));

// Protected routes (require auth)
app.use('/api/maintenance', auth, require('./routes/maintenanceRoutes'));
app.use('/api/reports', auth, require('./routes/reportRoutes'));
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

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to connect to DB:', err);
    process.exit(1);
});
