const { Sequelize } = require('sequelize');

// Support both DATABASE_URL (for Render) and individual credentials (for local)
let sequelize;

if (process.env.DATABASE_URL) {
    // Production: Use DATABASE_URL from Render PostgreSQL
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false // Required for Render's PostgreSQL
            }
        },
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });
} else {
    // Local: Use individual DB credentials
    sequelize = new Sequelize(
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
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        const dbType = process.env.DATABASE_URL ? 'Production (Render)' : 'Local';
        console.log(`PostgreSQL Connected (${dbType})`);
        
        // Use alter: true to safely add new columns without dropping tables
        await sequelize.sync({ alter: true });
        console.log('Database Synced');
    } catch (err) {
        console.error('Unable to connect to database:', err.message);
        console.error('Full error:', err);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
