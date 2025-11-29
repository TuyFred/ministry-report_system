const { Sequelize } = require('sequelize');

// 1. Load env variables here is optional because index.js already loads them
// require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL is missing. Set it in environment variables.');
    process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    keepAlive: true,
    retry: {
        max: 3
    }
});

// Optional: retry wrapper (kept simple)
const connectDB = async (retries = 5, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await sequelize.authenticate();
            console.log('PostgreSQL Connected to Render');
            await sequelize.sync();
            console.log('Database Synced');
            return; // Success
        } catch (err) {
            console.error(`Database connection attempt ${i + 1}/${retries} failed:`, err.message);

            if (i === retries - 1) {
                console.error('All database connection attempts failed.');
                console.error('Error details:', err);
                process.exit(1);
            }

            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

module.exports = { sequelize, connectDB };
