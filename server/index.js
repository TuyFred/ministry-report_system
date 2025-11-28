const express = require('express');
const cors = require('cors');
const { connectDB, sequelize } = require('./config/db');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Connect Database
connectDB();

// Sync Models
const syncDb = async () => {
    try {
        await sequelize.sync({ alter: true }); // Use { force: true } only for development reset
        console.log('Database Synced...');
    } catch (err) {
        console.error('Error syncing database:', err);
    }
};
syncDb();

// Routes
app.get('/', (req, res) => {
    res.send('Ministry Reporting System API');
});

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
