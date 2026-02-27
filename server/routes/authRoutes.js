<<<<<<< HEAD
const express = require('express');
const router = express.Router();
const { register, registerAdmin, login, getMe, forgotPassword, resetPassword, changePassword, createAdmin } = require('../controllers/authController');
const auth = require('../middleware/auth');

// Simple health check route (will be blocked by maintenance middleware)
router.get('/check', (req, res) => {
    res.json({ status: 'ok' });
});

router.post('/register', register);
router.post('/register-admin', registerAdmin);
router.post('/create-admin', auth, createAdmin);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', auth, changePassword);

module.exports = router;
=======
const express = require('express');
const router = express.Router();
const { register, registerAdmin, login, getMe, forgotPassword, resetPassword, changePassword, createAdmin } = require('../controllers/authController');
const auth = require('../middleware/auth');

// Simple health check route (will be blocked by maintenance middleware)
router.get('/check', (req, res) => {
    res.json({ status: 'ok' });
});

router.post('/register', register);
router.post('/register-admin', registerAdmin);
router.post('/create-admin', auth, createAdmin);
router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', auth, changePassword);

module.exports = router;
>>>>>>> 04920ac493daeaada4207a3915fd87d9275d5fc8
