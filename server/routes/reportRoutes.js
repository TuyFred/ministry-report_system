const express = require('express');
const router = express.Router();
const { createReport, getReports, getReportById, updateReport, exportPDF, exportExcel, getAnalytics } = require('../controllers/reportController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', [auth, upload.array('attachments')], createReport);
router.get('/', auth, getReports);
router.get('/analytics', auth, getAnalytics);
router.get('/export/pdf', auth, exportPDF);
router.get('/export/excel', auth, exportExcel);
router.get('/:id', auth, getReportById);
router.put('/:id', auth, updateReport);

module.exports = router;
