const { Sequelize } = require('sequelize');
require('dotenv').config();

// 1. Use only one URL: DATABASE_URL (Construct if missing)
const databaseUrl = process.env.DATABASE_URL || 
    `postgres://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASS || 'fred123'}@${process.env.DB_HOST || 'localhost'}:5432/${process.env.DB_NAME || 'ministry_db'}`;

// 2. Add SSL config inside Sequelize
const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        },
        keepAlive: true
    },
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// 3. Update database authenticate and sync
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected...');
        
        // Sync models here to ensure connection is established first
        await sequelize.sync({ alter: true });
        console.log('Database Synced...');
    } catch (err) {
        console.error('Unable to connect to the database:', err);
        if (err.original && err.original.code === 'ECONNREFUSED') {
            console.error('HINT: Check your connection string and ensure SSL is enabled.');
        }
    }
};

module.exports = { sequelize, connectDB };
