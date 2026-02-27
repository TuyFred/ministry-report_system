<<<<<<< HEAD
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Report = require('./Report');

const Attachment = sequelize.define('attachments', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    file_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_type: {
        type: DataTypes.STRING
    }
}, {
    timestamps: true
});

// Relationships
Report.hasMany(Attachment, { foreignKey: 'report_id' });
Attachment.belongsTo(Report, { foreignKey: 'report_id' });

module.exports = Attachment;
=======
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Report = require('./Report');

const Attachment = sequelize.define('attachments', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    file_url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_type: {
        type: DataTypes.STRING
    }
}, {
    timestamps: true
});

// Relationships
Report.hasMany(Attachment, { foreignKey: 'report_id' });
Attachment.belongsTo(Report, { foreignKey: 'report_id' });

module.exports = Attachment;
>>>>>>> 04920ac493daeaada4207a3915fd87d9275d5fc8
