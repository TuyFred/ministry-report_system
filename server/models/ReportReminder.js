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
    },
    recipient_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'member'
    },
    recipient_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true
    },
    language: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'en'
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: true
    },
    message_html: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    message_text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    verse_reference: {
        type: DataTypes.STRING,
        allowNull: true
    },
    verse_text: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    sent_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    delivery_events: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: []
    },
    follow_up_sent_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    follow_up_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    timestamps: true
});

ReportReminder.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
User.hasMany(ReportReminder, { foreignKey: 'user_id' });

module.exports = ReportReminder;
