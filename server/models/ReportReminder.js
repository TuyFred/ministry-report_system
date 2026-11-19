const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const ReportReminder = sequelize.define('report_reminders', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    week_start: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    week_end: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    expected_reports: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 7
    },
    submitted_reports: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    missed_reports: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 7
    },
    email_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'queued'
    },
    message_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    sent_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true
});

ReportReminder.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
User.hasMany(ReportReminder, { foreignKey: 'user_id' });

module.exports = ReportReminder;
