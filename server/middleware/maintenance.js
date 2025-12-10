const fs = require('fs');
const path = require('path');

// Maintenance mode middleware - runs BEFORE auth
const checkMaintenanceMode = (req, res, next) => {
    try {
        // Allow login and check endpoints even during maintenance
        const allowedPaths = ['/api/auth/login', '/api/auth/check'];
        if (allowedPaths.includes(req.path)) {
            return next();
        }

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
        
        // If maintenance mode is on, check if request has admin token
        // Extract token from header
        const token = req.header('x-auth-token');
        
        if (token) {
            try {
                const jwt = require('jsonwebtoken');
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // If user is admin, allow access
                if (decoded.user && decoded.user.role === 'admin') {
                    return next();
                }
            } catch (err) {
                // Invalid token, continue to block
            }
        }
        
        // Block all other users (including non-authenticated)
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
