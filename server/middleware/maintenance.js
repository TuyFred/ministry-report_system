const fs = require('fs');
const path = require('path');

// Maintenance mode middleware
const checkMaintenanceMode = (req, res, next) => {
    try {
        const maintenanceFilePath = path.join(__dirname, '../maintenance.json');
        
        // If maintenance file doesn't exist, allow access
        if (!fs.existsSync(maintenanceFilePath)) {
            return next();
        }
        
        // Read maintenance status
        const data = fs.readFileSync(maintenanceFilePath, 'utf8');
        const maintenanceData = JSON.parse(data);
        
        // If maintenance mode is off, allow access
        if (!maintenanceData.isMaintenanceMode) {
            return next();
        }
        
        // If maintenance mode is on, only allow admin access
        // Check if user is authenticated and is admin
        if (req.user && req.user.role === 'admin') {
            return next();
        }
        
        // Block all other users
        return res.status(503).json({ 
            msg: 'System is currently under maintenance. Please try again later.',
            maintenanceMode: true
        });
    } catch (error) {
        console.error('Maintenance check error:', error);
        // On error, allow access to prevent system lockout
        next();
    }
};

module.exports = checkMaintenanceMode;
