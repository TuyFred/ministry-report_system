const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
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
} else {
    sequelize = new Sequelize(process.env.DB_NAME || 'ministry_db', process.env.DB_USER || 'postgres', process.env.DB_PASS || 'password', {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'postgres',
        logging: false,
    });
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected...');
    } catch (err) {
        console.error('Unable to connect to the database:', err);
        if (err.original && err.original.code === 'ECONNREFUSED') {
            console.error('HINT: If you are running locally and trying to connect to a Render database, make sure you are using the "External Database URL" (starts with postgres://... and has a hostname like dpg-...-a.oregon-postgres.render.com but resolves publicly). Internal URLs (dpg-...) are only accessible from within Render services.');
        }
    }
};
        console.error('Unable to connect to the database:', err);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };
