const { Sequelize } = require('sequelize');
require('dotenv').config();

// 1. Use only one URL: DATABASE_URL (no localhost fallback)
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL is missing. Set it in environment variables.');
    process.exit(1);
}

// 2. Add SSL config inside Sequelize with connection pooling
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
    // Connection pool settings for Render
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    // Keep connections alive
    keepAlive: true,
    retry: {
        max: 3
    }
});

// 3. Update database authenticate and sync with retry logic
const connectDB = async (retries = 5, delay = 2000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await sequelize.authenticate();
            console.log('PostgreSQL Connected to Render');
            await sequelize.sync();
            console.log('Database Synced');
            return; // Success, exit the function
        } catch (err) {
            console.error(`Database connection attempt ${i + 1}/${retries} failed:`, err.message);

            if (i === retries - 1) {
                // Last attempt failed
                console.error('All database connection attempts failed. The database might be sleeping or there might be a configuration issue.');
                console.error('Error details:', err);
                process.exit(1); // Exit the process if we can't connect
            }

            // Wait before retrying
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

module.exports = { sequelize, connectDB };
