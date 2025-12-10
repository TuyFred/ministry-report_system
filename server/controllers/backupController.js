const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Backup directory
const backupDir = path.join(__dirname, '../backups');

// Initialize backup directory
const initBackupDirectory = () => {
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
};

// Get backup history
const getBackupHistory = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        initBackupDirectory();

        // Read all files in backup directory
        const files = fs.readdirSync(backupDir);
        const backups = files
            .filter(file => file.endsWith('.sql') || file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(backupDir, file);
                const stats = fs.statSync(filePath);
                return {
                    filename: file,
                    createdAt: stats.birthtime,
                    size: stats.size,
                    status: 'completed'
                };
            })
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by newest first

        res.json({ backups });
    } catch (error) {
        console.error('Error getting backup history:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

// Create backup
const createBackup = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        initBackupDirectory();

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `backup_${timestamp}.sql`;
        const filePath = path.join(backupDir, filename);

        // Get database configuration from environment
        const dbName = process.env.DB_NAME;
        const dbUser = process.env.DB_USER;
        const dbPassword = process.env.DB_PASSWORD;
        const dbHost = process.env.DB_HOST || 'localhost';
        const dbPort = process.env.DB_PORT || 5432;

        if (!dbName || !dbUser) {
            return res.status(500).json({ msg: 'Database configuration not found' });
        }

        // For PostgreSQL using pg_dump
        const command = `PGPASSWORD="${dbPassword}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -F c -b -v -f "${filePath}" ${dbName}`;

        try {
            // Execute backup command
            await execPromise(command);

            res.json({
                msg: 'Backup created successfully',
                filename,
                downloadUrl: `/api/backup/download/${filename}`
            });
        } catch (cmdError) {
            console.error('Error executing backup command:', cmdError);
            
            // Fallback: Create a JSON backup of Sequelize models
            const User = require('../models/User');
            const Report = require('../models/Report');
            const Attachment = require('../models/Attachment');

            const users = await User.findAll();
            const reports = await Report.findAll();
            const attachments = await Attachment.findAll();

            const backupData = {
                timestamp: new Date().toISOString(),
                users: users.map(u => u.toJSON()),
                reports: reports.map(r => r.toJSON()),
                attachments: attachments.map(a => a.toJSON())
            };

            const jsonFilename = `backup_${timestamp}.json`;
            const jsonFilePath = path.join(backupDir, jsonFilename);
            fs.writeFileSync(jsonFilePath, JSON.stringify(backupData, null, 2));

            res.json({
                msg: 'Backup created successfully (JSON format)',
                filename: jsonFilename,
                downloadUrl: `/api/backup/download/${jsonFilename}`
            });
        }
    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ msg: 'Failed to create backup', error: error.message });
    }
};

// Download backup
const downloadBackup = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        const { filename } = req.params;
        const filePath = path.join(backupDir, filename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ msg: 'Backup file not found' });
        }

        // Send file
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('Error downloading backup:', err);
                res.status(500).json({ msg: 'Error downloading backup' });
            }
        });
    } catch (error) {
        console.error('Error downloading backup:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

module.exports = {
    getBackupHistory,
    createBackup,
    downloadBackup
};
