const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ReportFormTemplate = sequelize.define('ReportFormTemplate', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    definition: {
        // Postgres JSONB
        type: DataTypes.JSONB,
        allowNull: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    timestamps: true
});

module.exports = ReportFormTemplate;
