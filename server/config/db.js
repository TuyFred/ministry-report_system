const { Sequelize } = require('sequelize');

// Use individual DB credentials for local PostgreSQL
const sequelize = new Sequelize(
    process.env.DB_NAME || 'ministry_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASS || 'fred123',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected (Local)');
        await sequelize.sync();
        console.log('Database Synced');
    } catch (err) {
        console.error('Unable to connect to database:', err.message);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
