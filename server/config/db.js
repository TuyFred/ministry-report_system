const { Sequelize } = require('sequelize');
require('dotenv').config();

// 1. Use only one URL: DATABASE_URL (no localhost fallback)
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL is missing. Set it in environment variables.');
    process.exit(1);
}

// 2. Add SSL config inside Sequelize
const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

// 3. Update database authenticate and sync
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected to Render');
        await sequelize.sync();
        console.log('Database Synced');
    } catch (err) {
        console.error('Unable to connect to the database:', err);
        if (err.original && err.original.code === 'ECONNREFUSED') {
            console.error('HINT: Check your connection string and ensure SSL is enabled.');
        }
    }
};

module.exports = { sequelize, connectDB };
