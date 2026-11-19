const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EmailOtp = sequelize.define('email_otps', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    purpose: {
        type: DataTypes.STRING,
        allowNull: false
    },
    codeHash: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    resendAvailableAt: {
        type: DataTypes.DATE,
        allowNull: false
    },
    attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    usedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    messageId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    deliveryStatus: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'queued'
    },
    payload: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        { fields: ['email', 'purpose', 'createdAt'] },
        { fields: ['messageId'] }
    ]
});

module.exports = EmailOtp;
