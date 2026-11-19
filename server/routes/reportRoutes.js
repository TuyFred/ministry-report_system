const express = require('express');
const router = express.Router();
const { createReport, getReports, getReportById, updateReport, deleteReport, exportPDF, exportExcel, getAnalytics, getReportReminders, sendWeeklyReportReminders, exportPerformanceExcel } = require('../controllers/reportController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', [auth, upload.array('attachments')], createReport);
router.get('/', auth, getReports);
router.get('/analytics', auth, getAnalytics);
router.get('/reminders', auth, getReportReminders);
router.post('/reminders/send', auth, sendWeeklyReportReminders);
router.get('/export/performance/excel/:scope', auth, exportPerformanceExcel);
router.get('/export/pdf', auth, exportPDF);
router.get('/export/excel', auth, exportExcel);
router.get('/:id', auth, getReportById);
router.put('/:id', auth, updateReport);
router.delete('/:id', auth, deleteReport);

module.exports = router;