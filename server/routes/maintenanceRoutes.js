<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const maintenanceController = require('../controllers/maintenanceController');

// @route   GET api/maintenance/status
// @desc    Get maintenance mode status
// @access  Private (Admin only)
router.get('/status', auth, maintenanceController.getStatus);

// @route   POST api/maintenance/toggle
// @desc    Toggle maintenance mode on/off
// @access  Private (Admin only)
router.post('/toggle', auth, maintenanceController.toggleMaintenance);

module.exports = router;
=======
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const maintenanceController = require('../controllers/maintenanceController');

// @route   GET api/maintenance/status
// @desc    Get maintenance mode status
// @access  Private (Admin only)
router.get('/status', auth, maintenanceController.getStatus);

// @route   POST api/maintenance/toggle
// @desc    Toggle maintenance mode on/off
// @access  Private (Admin only)
router.post('/toggle', auth, maintenanceController.toggleMaintenance);

module.exports = router;
>>>>>>> 04920ac493daeaada4207a3915fd87d9275d5fc8
