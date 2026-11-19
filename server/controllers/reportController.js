const Report = require('../models/Report');
const Attachment = require('../models/Attachment');
const User = require('../models/User');
const { Op, fn, col, literal } = require('sequelize');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const ReportReminder = require('../models/ReportReminder');

const formatHoursForExport = (value) => {
    const totalMinutes = Math.round((parseFloat(value) || 0) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (!hours && !minutes) return '0 min';
    if (!hours) return `${minutes} min`;
    if (!minutes) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
};

const getUtcDayOfWeek = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const d = new Date(`${dateStr}T00:00:00Z`);
    // If invalid date, getTime() will be NaN
    if (Number.isNaN(d.getTime())) return null;
    return d.getUTCDay();
};

const countNonEmptyLines = (text) => {
    if (typeof text !== 'string') return 0;
    return text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean)
        .length;
};

const validateSaturdayWeeklyFields = (payload) => {
    const missing = [];
    const requiredTextFields = [
        'thanksgiving',
        'repentance',
        'prayer_requests',
        'reflections',
        'other_work',
        'tomorrow_tasks'
    ];

    for (const key of requiredTextFields) {
        const v = payload?.[key];
        if (typeof v !== 'string' || !v.trim()) missing.push(key);
    }

    // exercise_time is stored as hours (float) and should be provided on Saturday.
    const exerciseTime = payload?.exercise_time;
    const exerciseOk = typeof exerciseTime === 'number' ? exerciseTime >= 0 : (typeof exerciseTime === 'string' ? exerciseTime.trim() !== '' : false);
    if (!exerciseOk) missing.push('exercise_time');

    const prayerCount = countNonEmptyLines(payload?.prayer_requests);
    if (prayerCount > 3) {
        return { ok: false, msg: 'Prayer requests must be no more than three (use one line per request).' };
    }

    if (missing.length > 0) {
        return { ok: false, msg: `Missing required Saturday weekly fields: ${missing.join(', ')}` };
    }

    return { ok: true };
};

// Create Report
exports.createReport = async (req, res) => {
    try {
        const {
            date, name, country, church, evangelism_hours, people_reached, contacts_received,
            bible_study_sessions, bible_study_attendants, unique_attendants, newcomers,
            meditation_time, prayer_time, morning_service, regular_service, sermons_listened, articles_written, exercise_time,
            sermon_reflection, reflections, thanksgiving, repentance, prayer_requests, other_work, tomorrow_tasks, other_activities
        } = req.body;

        // Saturday weekly report rules
        const dayOfWeek = getUtcDayOfWeek(date);
        if (dayOfWeek === 6) {
            const validation = validateSaturdayWeeklyFields(req.body);
            if (!validation.ok) {
                return res.status(400).json({ msg: validation.msg });
            }
        }

        // Check if a report already exists for this user on this date
        const existingReport = await Report.findOne({
            where: {
                user_id: req.user.id,
                date: date
            }
        });

        if (existingReport) {
            return res.status(400).json({
                msg: 'You have already submitted a report for this date. Please edit the existing report or choose a different date.'
            });
        }

        const newReport = await Report.create({
            user_id: req.user.id,
            date, name, country, church, evangelism_hours, people_reached, contacts_received,
            bible_study_sessions, bible_study_attendants, unique_attendants, newcomers,
            meditation_time, prayer_time, morning_service, regular_service, sermons_listened, articles_written, exercise_time,
            sermon_reflection, reflections, thanksgiving, repentance, prayer_requests, other_work, tomorrow_tasks, other_activities
        });

        // Handle Attachments
        if (req.files) {
            const attachments = req.files.map(file => ({
                report_id: newReport.id,
                file_url: `uploads/${file.filename}`,
                file_type: file.mimetype
            }));
            await Attachment.bulkCreate(attachments);
        }

        res.json(newReport);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get Reports (with filters)
exports.getReports = async (req, res) => {
    try {
        const { startDate, endDate, userId, country, searchQuery } = req.query;
        let whereClause = {};

        // Date Filter
        if (startDate && endDate) {
            whereClause.date = { [Op.between]: [startDate, endDate] };
        }

        // User Filter Logic
        let userWhereClause = {};
        if (searchQuery) {
            userWhereClause = {
                [Op.or]: [
                    { fullname: { [Op.iLike]: `%${searchQuery}%` } },
                    { contact: { [Op.iLike]: `%${searchQuery}%` } }
                ]
            };
        }

        // Role-based Access
        if (req.user.role === 'member') {
            whereClause.user_id = req.user.id;
        } else if (req.user.role === 'leader') {
            // Leader sees reports from their country
            userWhereClause.country = req.user.country;

            const countryUsers = await User.findAll({ where: userWhereClause, attributes: ['id'] });
            const userIds = countryUsers.map(u => u.id);

            if (userId) {
                // Specific user requested
                if (userIds.includes(parseInt(userId))) {
                    whereClause.user_id = userId;
                } else {
                    return res.status(403).json({ msg: 'Not authorized to view this user reports' });
                }
            } else {
                whereClause.user_id = { [Op.in]: userIds };
            }
        } else if (req.user.role === 'admin') {
            if (country) {
                userWhereClause.country = country;
            }

            // If we have user search criteria or country filter, we need to find matching users first
            if (searchQuery || country) {
                 const users = await User.findAll({ where: userWhereClause, attributes: ['id'] });
                 const userIds = users.map(u => u.id);

                 if (userId) {
                     if (userIds.includes(parseInt(userId))) {
                         whereClause.user_id = userId;
                     } else {
                         whereClause.user_id = -1; // No match
                     }
                 } else {
                     whereClause.user_id = { [Op.in]: userIds };
                 }
            } else {
                if (userId) whereClause.user_id = userId;
            }
        }

        const reports = await Report.findAll({
            where: whereClause,
            include: [
                { model: User, attributes: ['id', 'fullname', 'email', 'country', 'contact'] }
            ],
            order: [['date', 'DESC']]
        });

        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update Report
exports.updateReport = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);

        if (!report) {
            return res.status(404).json({ msg: 'Report not found' });
        }

        // Check if user owns this report
        if (report.user_id !== req.user.id) {
            let authorized = false;

            if (req.user.role === 'leader') {
                const reportUser = await User.findByPk(report.user_id);
                if (reportUser && reportUser.country === req.user.country) {
                    authorized = true;
                }
            } else if (req.user.role === 'admin') {
                authorized = true;
            }

            if (!authorized) {
                return res.status(403).json({ msg: 'Not authorized to edit this report' });
            }
        }

        const {
            date, name, country, church, evangelism_hours, people_reached, contacts_received,
            bible_study_sessions, bible_study_attendants, unique_attendants, newcomers,
            meditation_time, prayer_time, morning_service, regular_service, sermons_listened,
            articles_written, exercise_time, sermon_reflection, reflections, thanksgiving,
            repentance, prayer_requests, other_work, tomorrow_tasks, other_activities
        } = req.body;

        // Saturday weekly report rules (based on the resulting date)
        const effectiveDate = date || report.date;
        const dayOfWeek = getUtcDayOfWeek(effectiveDate);
        if (dayOfWeek === 6) {
            const mergedPayload = {
                ...report.toJSON(),
                ...req.body
            };
            const validation = validateSaturdayWeeklyFields(mergedPayload);
            if (!validation.ok) {
                return res.status(400).json({ msg: validation.msg });
            }
        }

        // If changing the report date, prevent duplicates for the same report owner
        if (date && date !== report.date) {
            const existingReport = await Report.findOne({
                where: {
                    user_id: report.user_id,
                    date,
                    id: { [Op.ne]: report.id }
                }
            });

            if (existingReport) {
                return res.status(400).json({
                    msg: 'You already have a report for this date. Please choose a different date.'
                });
            }
        }

        await report.update({
            date, name, country, church, evangelism_hours, people_reached, contacts_received,
            bible_study_sessions, bible_study_attendants, unique_attendants, newcomers,
            meditation_time, prayer_time, morning_service, regular_service, sermons_listened,
            articles_written, exercise_time, sermon_reflection, reflections, thanksgiving,
            repentance, prayer_requests, other_work, tomorrow_tasks, other_activities
        });

        res.json(report);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get Single Report
exports.getReportById = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id, {
            include: [{ model: Attachment }]
        });

        if (!report) return res.status(404).json({ msg: 'Report not found' });

        // Authorization
        if (req.user.role === 'member' && report.user_id !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        // Leader check (omitted for brevity, assuming getReports logic covers list view, but strict check here is good)
        // For now, simple check:
        if (req.user.role === 'leader') {
            const reportUser = await User.findByPk(report.user_id);
            if (reportUser.country !== req.user.country) {
                return res.status(403).json({ msg: 'Not authorized' });
            }
        }

        res.json(report);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Export to PDF
exports.exportPDF = async (req, res) => {
    try {
        const { startDate, endDate, userId, country, searchQuery } = req.query;
        let whereClause = {};

        // Date Filter - REQUIRED
        if (startDate && endDate) {
            whereClause.date = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
            // Single date
            whereClause.date = startDate;
        } else {
            // Default to today if no date provided
            const today = new Date().toISOString().split('T')[0];
            whereClause.date = today;
        }

        // User Filter Logic
        let userWhereClause = {};
        if (searchQuery) {
            userWhereClause = {
                [Op.or]: [
                    { fullname: { [Op.iLike]: `%${searchQuery}%` } },
                    { contact: { [Op.iLike]: `%${searchQuery}%` } }
                ]
            };
        }

        // Role-based Access
        if (req.user.role === 'member') {
            whereClause.user_id = req.user.id;
        } else if (req.user.role === 'leader') {
            // Leader sees reports from their country
            userWhereClause.country = req.user.country;

            const countryUsers = await User.findAll({ where: userWhereClause, attributes: ['id'] });
            const userIds = countryUsers.map(u => u.id);

            if (userId) {
                // Specific user requested
                if (userIds.includes(parseInt(userId))) {
                    whereClause.user_id = userId;
                } else {
                    return res.status(403).json({ msg: 'Not authorized to view this user reports' });
                }
            } else {
                whereClause.user_id = { [Op.in]: userIds };
            }
        } else if (req.user.role === 'admin') {
            if (country) {
                userWhereClause.country = country;
            }

            // If we have user search criteria or country filter, we need to find matching users first
            if (searchQuery || country) {
                 const users = await User.findAll({ where: userWhereClause, attributes: ['id'] });
                 const userIds = users.map(u => u.id);

                 if (userId) {
                     if (userIds.includes(parseInt(userId))) {
                         whereClause.user_id = userId;
                     } else {
                         whereClause.user_id = -1; // No match
                     }
                 } else {
                     whereClause.user_id = { [Op.in]: userIds };
                 }
            } else {
                if (userId) whereClause.user_id = userId;
            }
        }

        const reports = await Report.findAll({
            where: whereClause,
            include: [{ model: User, attributes: ['id', 'fullname', 'email', 'country', 'contact'] }],
            order: [['date', 'ASC']]
        });

        // Generate unique filename
        const dateStr = startDate && endDate ? `${startDate}_to_${endDate}` : (startDate || 'report');
        const filename = `ministry_report_${dateStr}.pdf`;

        // Set headers FIRST before creating document
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        // Create PDF
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            bufferPages: true,
            autoFirstPage: true
        });

        // Pipe to response
        doc.pipe(res);

        // Header
        doc.fontSize(20).fillColor('#4F46E5').text('Ministry Report System', { align: 'center' });
        doc.fontSize(16).fillColor('#6B7280').text('Comprehensive Report Export', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).fillColor('#9CA3AF').text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown(2);

        if (reports.length === 0) {
            doc.fontSize(12).fillColor('#EF4444').text('No reports found for the selected criteria.', { align: 'center' });
        } else {
            // Summary
            doc.fontSize(14).fillColor('#111827').text(`Total Reports: ${reports.length}`, { align: 'left' });
            doc.moveDown();

            reports.forEach((report, index) => {
                if (index > 0) doc.addPage();

                // Report Header
                doc.fontSize(18).fillColor('#4F46E5').text(`Report #${index + 1}`, { underline: true });
                doc.moveDown(0.5);

                // Basic Info Grid
                const startY = doc.y;
                doc.fontSize(12).fillColor('#111827');

                doc.text(`Name: ${report.User?.fullname || 'N/A'}`, 50, startY);
                doc.text(`Country: ${report.User?.country || 'N/A'}`, 300, startY);

                const nextY = startY + 20;
                doc.text(`Church: ${report.church || 'N/A'}`, 50, nextY);
                doc.text(`Date: ${new Date(report.date).toLocaleDateString()}`, 300, nextY);
                doc.text(`Email: ${report.User?.email || 'N/A'}`, 50, nextY + 20);
                doc.text(`Contact: ${report.User?.contact || 'N/A'}`, 300, nextY + 20);
                doc.text(`Submitted: ${report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A'}`, 50, nextY + 40);

                doc.y = nextY + 70; // Move down

                // Horizontal Line
                doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).strokeColor('#E5E7EB').stroke();
                doc.moveDown(2);

                // 3-Column Metrics Layout
                const metricsTop = doc.y;
                const col1X = 50;
                const col2X = 220;
                const col3X = 390;

                // Column 1: Evangelism
                doc.fontSize(14).fillColor('#7C3AED').text('Evangelism', col1X, metricsTop);
                doc.fontSize(10).fillColor('#374151');
                doc.text(`Hours: ${formatHoursForExport(report.evangelism_hours)}`, col1X, metricsTop + 25);
                doc.text(`Reached: ${report.people_reached || 0}`, col1X, metricsTop + 40);
                doc.text(`Contacts: ${report.contacts_received || 0}`, col1X, metricsTop + 55);

                // Column 2: Bible Study
                doc.fontSize(14).fillColor('#7C3AED').text('Bible Study', col2X, metricsTop);
                doc.fontSize(10).fillColor('#374151');
                doc.text(`Sessions: ${report.bible_study_sessions || 0}`, col2X, metricsTop + 25);
                doc.text(`Attendants: ${report.bible_study_attendants || 0}`, col2X, metricsTop + 40);
                doc.text(`Unique: ${report.unique_attendants || 0}`, col2X, metricsTop + 55);
                doc.text(`Newcomers: ${report.newcomers || 0}`, col2X, metricsTop + 70);

                // Column 3: Spiritual Life
                doc.fontSize(14).fillColor('#7C3AED').text('Spiritual Life', col3X, metricsTop);
                doc.fontSize(10).fillColor('#374151');
                doc.text(`Meditation: ${formatHoursForExport(report.meditation_time)}`, col3X, metricsTop + 25);
                doc.text(`Prayer: ${formatHoursForExport(report.prayer_time)}`, col3X, metricsTop + 40);
                doc.text(`Exercise: ${formatHoursForExport(report.exercise_time)}`, col3X, metricsTop + 55);
                doc.text(`Sermons: ${report.sermons_listened || 0}`, col3X, metricsTop + 70);
                doc.text(`Articles: ${report.articles_written || 0}`, col3X, metricsTop + 85);

                // Move cursor past the tallest column
                doc.y = metricsTop + 110;
                doc.x = 50;

                // Text Areas
                const sections = [
                    { title: 'Reflections', content: report.reflections },
                    { title: 'Thanksgiving', content: report.thanksgiving },
                    { title: 'Repentance', content: report.repentance },
                    { title: 'Prayer Requests', content: report.prayer_requests },
                    { title: 'Other Work', content: report.other_work },
                    { title: 'Tomorrow Tasks', content: report.tomorrow_tasks },
                    { title: 'Sermon Reflection', content: report.sermon_reflection },
                    { title: 'Other Activities', content: report.other_activities }
                ];

                sections.forEach(section => {
                    if (section.content) {
                        doc.moveDown();
                        doc.fontSize(12).fillColor('#4F46E5').text(section.title, { underline: true });
                        doc.moveDown(0.5);
                        doc.fontSize(10).fillColor('#374151').text(section.content, { width: 500, align: 'justify' });
                    }
                });
            });
        }

        // Finalize the PDF
        doc.end();

    } catch (err) {
        console.error('PDF Export Error:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to export PDF', details: err.message });
        }
    }
};

// Export to Excel
exports.exportExcel = async (req, res) => {
    try {
        const { startDate, endDate, userId, country, searchQuery } = req.query;
        let whereClause = {};

        // Date Filter - REQUIRED
        if (startDate && endDate) {
            whereClause.date = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
            // Single date
            whereClause.date = startDate;
        } else {
            // Default to today if no date provided
            const today = new Date().toISOString().split('T')[0];
            whereClause.date = today;
        }

        // User Filter Logic
        let userWhereClause = {};
        if (searchQuery) {
            userWhereClause = {
                [Op.or]: [
                    { fullname: { [Op.iLike]: `%${searchQuery}%` } },
                    { contact: { [Op.iLike]: `%${searchQuery}%` } }
                ]
            };
        }

        // Role-based Access
        if (req.user.role === 'member') {
            whereClause.user_id = req.user.id;
        } else if (req.user.role === 'leader') {
            // Leader sees reports from their country
            userWhereClause.country = req.user.country;

            const countryUsers = await User.findAll({ where: userWhereClause, attributes: ['id'] });
            const userIds = countryUsers.map(u => u.id);

            if (userId) {
                // Specific user requested
                if (userIds.includes(parseInt(userId))) {
                    whereClause.user_id = userId;
                } else {
                    return res.status(403).json({ msg: 'Not authorized to view this user reports' });
                }
            } else {
                whereClause.user_id = { [Op.in]: userIds };
            }
        } else if (req.user.role === 'admin') {
            if (country) {
                userWhereClause.country = country;
            }

            // If we have user search criteria or country filter, we need to find matching users first
            if (searchQuery || country) {
                 const users = await User.findAll({ where: userWhereClause, attributes: ['id'] });
                 const userIds = users.map(u => u.id);

                 if (userId) {
                     if (userIds.includes(parseInt(userId))) {
                         whereClause.user_id = userId;
                     } else {
                         whereClause.user_id = -1; // No match
                     }
                 } else {
                     whereClause.user_id = { [Op.in]: userIds };
                 }
            } else {
                if (userId) whereClause.user_id = userId;
            }
        }

        const reports = await Report.findAll({
            where: whereClause,
            include: [{ model: User, attributes: ['id', 'fullname', 'email', 'country', 'contact'] }],
            order: [['date', 'ASC']]
        });

        // Generate unique filename
        const dateStr = startDate && endDate ? `${startDate}_to_${endDate}` : (startDate || 'report');
        const filename = `ministry_report_${dateStr}.xlsx`;

        // Set headers FIRST before creating workbook
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Ministry Report System';
        workbook.created = new Date();
        const worksheet = workbook.addWorksheet('Ministry Reports');

        // Add Title Row
        worksheet.mergeCells('A1:AC1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'MINISTRY REPORTS SYSTEM';
        titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 35;

        // Define Columns (Keys and Widths only)
        worksheet.columns = [
            { key: 'date', width: 15 },
            { key: 'submitted_at', width: 24 },
            { key: 'name', width: 25 },
            { key: 'email', width: 28 },
            { key: 'country', width: 15 },
            { key: 'contact', width: 18 },
            { key: 'church', width: 20 },
            { key: 'evangelism_hours', width: 18 },
            { key: 'people_reached', width: 15 },
            { key: 'contacts_received', width: 18 },
            { key: 'bible_study_sessions', width: 20 },
            { key: 'bible_study_attendants', width: 22 },
            { key: 'unique_attendants', width: 18 },
            { key: 'newcomers', width: 12 },
            { key: 'meditation_time', width: 16 },
            { key: 'prayer_time', width: 14 },
            { key: 'morning_service', width: 16 },
            { key: 'regular_service', width: 16 },
            { key: 'sermons_listened', width: 16 },
            { key: 'articles_written', width: 16 },
            { key: 'exercise_time', width: 14 },
            { key: 'reflections', width: 40 },
            { key: 'thanksgiving', width: 40 },
            { key: 'repentance', width: 40 },
            { key: 'prayer_requests', width: 40 },
            { key: 'other_work', width: 40 },
            { key: 'tomorrow_tasks', width: 40 }
            ,
            { key: 'sermon_reflection', width: 40 },
            { key: 'other_activities', width: 40 }
        ];

        // Add Header Row manually at Row 2
        const headerRow = worksheet.getRow(2);
        headerRow.values = [
            'Report Date', 'Submitted At', 'Name', 'Email', 'Country', 'Contact', 'Church',
            'Evangelism Hours', 'People Reached', 'Contacts Received',
            'Bible Study Sessions', 'Bible Study Attendants', 'Unique Attendants', 'Newcomers',
            'Meditation (min)', 'Prayer (min)', 'Morning Service', 'Regular Service',
            'Sermons Listened', 'Articles Written', 'Exercise (min)',
            'Reflections', 'Thanksgiving', 'Repentance', 'Prayer Requests', 'Other Work', 'Tomorrow Tasks', 'Sermon Reflection', 'Other Activities'
        ];

        // Style Header Row
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B7280' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 25;

        // AutoFilter
        worksheet.autoFilter = {
            from: { row: 2, column: 1 },
            to: { row: 2, column: 29 }
        };

        // Add data rows
        reports.forEach(report => {
            worksheet.addRow({
                date: new Date(report.date).toLocaleDateString(),
                submitted_at: report.createdAt ? new Date(report.createdAt).toLocaleString() : 'N/A',
                name: report.User?.fullname || 'N/A',
                email: report.User?.email || 'N/A',
                country: report.User?.country || 'N/A',
                contact: report.User?.contact || 'N/A',
                church: report.church || 'N/A',
                evangelism_hours: report.evangelism_hours || 0,
                people_reached: report.people_reached || 0,
                contacts_received: report.contacts_received || 0,
                bible_study_sessions: report.bible_study_sessions || 0,
                bible_study_attendants: report.bible_study_attendants || 0,
                unique_attendants: report.unique_attendants || 0,
                newcomers: report.newcomers || 0,
                meditation_time: report.meditation_time || 0,
                prayer_time: report.prayer_time || 0,
                morning_service: report.morning_service ? 'Yes' : 'No',
                regular_service: report.regular_service ? 'Yes' : 'No',
                sermons_listened: report.sermons_listened || 0,
                articles_written: report.articles_written || 0,
                exercise_time: report.exercise_time || 0,
                reflections: report.reflections || '',
                thanksgiving: report.thanksgiving || '',
                repentance: report.repentance || '',
                prayer_requests: report.prayer_requests || '',
                other_work: report.other_work || '',
                tomorrow_tasks: report.tomorrow_tasks || '',
                sermon_reflection: report.sermon_reflection || '',
                other_activities: report.other_activities || ''
            });
        });

        // Add alternating row colors
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 2) { // Start from data rows (row 3)
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: rowNumber % 2 === 0 ? 'FFF3F4F6' : 'FFFFFFFF' }
                };
                row.alignment = { vertical: 'top', wrapText: true };
            }
        });

        // Add borders
        worksheet.eachRow((row) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };
            });
        });

        // Write workbook to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error('Excel Export Error:', err.message);
        res.status(500).json({ error: 'Failed to export Excel file', details: err.message });
    }
};

// Get Analytics - Track daily reporting performance
exports.getAnalytics = async (req, res) => {
    try {
        const { range } = req.query; // week, month, year

        // Calculate date range
        const endDate = new Date();
        let startDate = new Date();
        let expectedDays = 0;

        switch(range) {
            case 'week':
                startDate.setDate(endDate.getDate() - 7);
                expectedDays = 7;
                break;
            case 'month':
                startDate.setMonth(endDate.getMonth() - 1);
                expectedDays = 30;
                break;
            case 'year':
                startDate.setFullYear(endDate.getFullYear() - 1);
                expectedDays = 365;
                break;
            default:
                startDate.setMonth(endDate.getMonth() - 1);
                expectedDays = 30;
        }

        // Get all users based on role
        let users;
        if (req.user.role === 'admin' || req.user.role === 'leader') {
            users = await User.findAll({ where: { role: { [Op.ne]: 'admin' }, reporting_exempt: { [Op.ne]: true } } });
        } else if (req.user.role === 'leader') {
            users = await User.findAll({ where: { country: req.user.country, role: { [Op.ne]: 'admin' }, reporting_exempt: { [Op.ne]: true } } });
        } else {
            users = [await User.findByPk(req.user.id)];
        }

        const userIds = users.map(u => u.id);

        // Get all reports in date range
        const reports = await Report.findAll({
            where: {
                user_id: { [Op.in]: userIds },
                date: { [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]] }
            },
            include: [{ model: User, attributes: ['id', 'fullname', 'email', 'country', 'contact'] }],
            order: [['date', 'DESC'], ['createdAt', 'DESC']]
        });

        // Calculate statistics for each user
        const userStats = users.map(user => {
            const userReports = reports.filter(r => r.user_id === user.id);
            const uniqueReportDates = new Set(userReports.map(report => report.date));
            const reportsSubmitted = uniqueReportDates.size;
            const memberJoinedAt = user.createdAt ? new Date(user.createdAt) : null;
            const eligibleStart = memberJoinedAt && memberJoinedAt > startDate ? memberJoinedAt : startDate;
            const eligibleDays = Math.max(1, Math.min(expectedDays, Math.floor((endDate - eligibleStart) / 86400000) + 1));
            const completionRate = Math.min(100, Math.round((reportsSubmitted / eligibleDays) * 100));

            const totalEvangelismHours = userReports.reduce((sum, r) => sum + (parseFloat(r.evangelism_hours) || 0), 0);
            const totalMeditationHours = userReports.reduce((sum, r) => sum + (parseFloat(r.meditation_time) || 0), 0);
            const totalPrayerHours = userReports.reduce((sum, r) => sum + (parseFloat(r.prayer_time) || 0), 0);
            const totalExerciseHours = userReports.reduce((sum, r) => sum + (parseFloat(r.exercise_time) || 0), 0);
            const latestReport = userReports
                .slice()
                .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))[0];

            // Calculate current streak (consecutive days)
            const sortedDates = userReports
                .map(r => new Date(r.date))
                .sort((a, b) => b - a);

            let currentStreak = 0;
            if (sortedDates.length > 0) {
                const reportDateSet = new Set(sortedDates.map(date => date.toISOString().split('T')[0]));
                let checkDate = new Date(sortedDates[0]);
                while (reportDateSet.has(checkDate.toISOString().split('T')[0])) {
                    currentStreak++;
                    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
                }
            }

            // Get last report date
            const lastReportDate = sortedDates.length > 0
                ? sortedDates[0].toLocaleDateString()
                : null;

            // Calculate missed days
            const missedDays = Math.max(0, eligibleDays - reportsSubmitted);

            return {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                country: user.country,
                role: user.role,
                memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : null,
                reportsSubmitted,
                completionRate,
                currentStreak,
                lastReportDate,
                missedDays,
                totalEvangelismHours,
                totalMeditationHours,
                totalPrayerHours,
                totalExerciseHours,
                lastSubmittedAt: latestReport?.createdAt
                    ? new Date(latestReport.createdAt).toLocaleString()
                    : null
            };
        });

        // Sort by completion rate (best performers first)
        const allStats = userStats.sort((a, b) => b.completionRate - a.completionRate);

        const topPerformers = allStats.slice(0, 10);

        // Get users needing attention (below 70%)
        const needsAttention = userStats
            .filter(stat => stat.completionRate < 70)
            .sort((a, b) => a.completionRate - b.completionRate);

        // Calculate Country Stats (admin and leader)
        let countryStats = [];
        if (req.user.role === 'admin' || req.user.role === 'leader') {
            const countries = [...new Set(users.map(u => u.country))];
            countryStats = countries.map(country => {
                const countryUsers = userStats.filter(u => users.find(user => user.id === u.id).country === country);
                const avgCompletion = countryUsers.length > 0
                    ? Math.round(countryUsers.reduce((sum, u) => sum + u.completionRate, 0) / countryUsers.length)
                    : 0;
                const countryReportCount = reports.filter(report =>
                    users.find(user => user.id === report.user_id)?.country === country
                ).length;
                return {
                    country,
                    averageCompletion: avgCompletion,
                    memberCount: countryUsers.length,
                    totalReports: countryReportCount,
                    missingReports: countryUsers.reduce((sum, member) => sum + member.missedDays, 0)
                };
            }).sort((a, b) => b.averageCompletion - a.averageCompletion);
        }

        // Calculate overall statistics
        const totalMembers = users.length;
        const totalReports = reports.length;
        const totalEvangelismHours = userStats.reduce((sum, stat) => sum + stat.totalEvangelismHours, 0);
        const totalMeditationHours = userStats.reduce((sum, stat) => sum + stat.totalMeditationHours, 0);
        const totalPrayerHours = userStats.reduce((sum, stat) => sum + stat.totalPrayerHours, 0);
        const totalExerciseHours = userStats.reduce((sum, stat) => sum + stat.totalExerciseHours, 0);
        const averageCompletion = totalMembers > 0
            ? Math.round(userStats.reduce((sum, stat) => sum + stat.completionRate, 0) / totalMembers)
            : 0;
        const topStreak = userStats.length > 0
            ? Math.max(...userStats.map(stat => stat.currentStreak))
            : 0;

        res.json({
            totalMembers,
            totalReports,
            totalEvangelismHours,
            totalMeditationHours,
            totalPrayerHours,
            totalExerciseHours,
            averageCompletion,
            topStreak,
            topPerformers,
            needsAttention,
            allStats,
            countryStats, // Added country stats
            expectedDays,
            dateRange: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

const formatDateOnly = (date) => date.toISOString().split('T')[0];

const getPreviousReportingWeek = (referenceDate = new Date()) => {
    const today = new Date(Date.UTC(
        referenceDate.getUTCFullYear(),
        referenceDate.getUTCMonth(),
        referenceDate.getUTCDate()
    ));
    const day = today.getUTCDay();
    const weekEnd = new Date(today);
    weekEnd.setUTCDate(today.getUTCDate() - ((day + 1) % 7));
    const weekStart = new Date(weekEnd);
    weekStart.setUTCDate(weekEnd.getUTCDate() - 6);
    return { weekStart: formatDateOnly(weekStart), weekEnd: formatDateOnly(weekEnd) };
};

exports.getReportReminders = async (req, res) => {
    try {
        if (!['admin', 'leader'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'Not authorized.' });
        }
        const reminders = await ReportReminder.findAll({
            include: [{ model: User, as: 'User', attributes: ['id', 'fullname', 'email', 'country'] }],
            order: [['sent_at', 'DESC'], ['createdAt', 'DESC']],
            limit: 500
        });
        const filtered = req.user.role === 'leader'
            ? reminders.filter(reminder => reminder.User?.country === req.user.country)
            : reminders;
        res.json(filtered);
    } catch (err) {
        console.error('Reminder history error:', err.message);
        res.status(500).json({ msg: 'Unable to load reminder history.' });
    }
};

exports.sendWeeklyReportReminders = async (req, res) => {
    try {
        if (!['admin', 'leader'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'Not authorized.' });
        }
        const { weekStart, weekEnd, country, userId, recipientMode = 'bulk', force = false, preview = false, customSubject, customMessage } = req.body || {};
        const selectedWeek = weekStart && weekEnd
            ? { weekStart, weekEnd }
            : getPreviousReportingWeek();
        const userWhere = { role: { [Op.ne]: 'admin' }, reporting_exempt: { [Op.ne]: true } };
        if (req.user.role === 'leader') userWhere.country = req.user.country;
        if (country) userWhere.country = country;
        if (userId) userWhere.id = userId;

        const users = await User.findAll({ where: userWhere });
        const { sendReminderEmail, sendLeaderSummaryEmail, detectPreferredLanguage, chooseReminderVerse } = require('../services/emailService');
        const sent = [];
        const skipped = [];

        for (const user of users) {
            if (recipientMode === 'leader-summaries') continue;
            const reports = await Report.findAll({
                attributes: ['date'],
                where: {
                    user_id: user.id,
                    date: { [Op.between]: [selectedWeek.weekStart, selectedWeek.weekEnd] }
                }
            });
            const uniqueDays = new Set(reports.map(report => report.date)).size;
            const missedReports = Math.max(0, 7 - uniqueDays);
            if (recipientMode === 'individual' && String(user.id) !== String(userId)) continue;
            if (missedReports === 0) {
                skipped.push({ id: user.id, fullname: user.fullname, reason: 'All reports submitted' });
                continue;
            }

            const [reminder, created] = await ReportReminder.findOrCreate({
                where: { user_id: user.id, week_start: selectedWeek.weekStart, week_end: selectedWeek.weekEnd },
                defaults: {
                    user_id: user.id,
                    recipient_id: user.id,
                    recipient_type: 'member',
                    country: user.country,
                    language: detectPreferredLanguage({ preferredLanguage: user.preferred_language, country: user.country }),
                    week_start: selectedWeek.weekStart,
                    week_end: selectedWeek.weekEnd,
                    expected_reports: 7,
                    submitted_reports: uniqueDays,
                    missed_reports: missedReports,
                    email_status: 'queued'
                }
            });
            if (!created && reminder.sent_at && !force) {
                skipped.push({ id: user.id, fullname: user.fullname, reason: 'Reminder already sent' });
                continue;
            }
            await reminder.update({
                submitted_reports: uniqueDays,
                missed_reports: missedReports
            });

            const language = detectPreferredLanguage({ preferredLanguage: user.preferred_language, country: user.country });
            const verse = await chooseReminderVerse(user.id);
            if (preview) {
                sent.push({
                    id: user.id,
                    fullname: user.fullname,
                    email: user.email,
                    missedReports,
                    language,
                    subject: customSubject || `Weekly report reminder: ${selectedWeek.weekStart}–${selectedWeek.weekEnd}`,
                    message: customMessage || '',
                    verse
                });
                continue;
            }
            try {
                const delivery = await sendReminderEmail({
                    email: user.email,
                    name: user.fullname,
                    country: user.country,
                    preferredLanguage: language,
                    weekStart: selectedWeek.weekStart,
                    weekEnd: selectedWeek.weekEnd,
                    submittedReports: uniqueDays,
                    missedReports,
                    customSubject,
                    customMessage,
                    verse
                });
                await reminder.update({
                    email_status: delivery.deliveryStatus,
                    message_id: delivery.messageId,
                    sent_at: new Date(),
                    language: delivery.language,
                    subject: delivery.subject,
                    message_html: delivery.htmlContent,
                    verse_reference: delivery.verse.reference,
                    verse_text: delivery.verse.text,
                    sent_by: req.user.id
                });
                sent.push({ id: user.id, fullname: user.fullname, email: user.email, missedReports });
            } catch (error) {
                await reminder.update({ email_status: 'failed', sent_at: new Date() });
                skipped.push({ id: user.id, fullname: user.fullname, reason: error.code || error.message });
            }
        }
        if (recipientMode === 'leader-summaries') {
            const leaders = req.user.role === 'leader'
                ? await User.findAll({ where: { id: req.user.id, role: 'leader', reporting_exempt: { [Op.ne]: true } } })
                : await User.findAll({ where: { role: 'leader', reporting_exempt: { [Op.ne]: true } } });
            let scopedLeaders = leaders;
            if (country) scopedLeaders = scopedLeaders.filter(leader => leader.country === country);
            for (const leader of scopedLeaders) {
                const leaderCountry = leader.country;
                const countryUsers = await User.findAll({
                    where: { country: leaderCountry, role: { [Op.ne]: 'admin' }, reporting_exempt: { [Op.ne]: true } }
                });
                const missingMembers = [];
                let submittedCount = 0;
                for (const member of countryUsers) {
                    const memberReports = await Report.count({
                        where: { user_id: member.id, date: { [Op.between]: [selectedWeek.weekStart, selectedWeek.weekEnd] } }
                    });
                    if (memberReports > 0) submittedCount++;
                    else missingMembers.push({ fullname: member.fullname, email: member.email });
                }
                if (preview) {
                    sent.push({ leaderId: leader.id, fullname: leader.fullname, email: leader.email, country: leaderCountry, expectedMembers: countryUsers.length, submittedReports: submittedCount, missingReports: missingMembers.length, missingMembers, preview: true });
                    continue;
                }
                const summaryKey = `${leader.id}:${selectedWeek.weekStart}:${selectedWeek.weekEnd}:leader-summary`;
                const existing = await ReportReminder.findOne({ where: { recipient_type: 'leader-summary', recipient_id: leader.id, week_start: selectedWeek.weekStart, week_end: selectedWeek.weekEnd } });
                if (existing?.sent_at && !force) {
                    skipped.push({ id: leader.id, fullname: leader.fullname, reason: 'Leader summary already sent' });
                    continue;
                }
                const [leaderReminder] = await ReportReminder.findOrCreate({
                    where: { recipient_type: 'leader-summary', recipient_id: leader.id, week_start: selectedWeek.weekStart, week_end: selectedWeek.weekEnd },
                    defaults: {
                        user_id: leader.id,
                        recipient_type: 'leader-summary',
                        recipient_id: leader.id,
                        country: leaderCountry,
                        language: 'en',
                        week_start: selectedWeek.weekStart,
                        week_end: selectedWeek.weekEnd,
                        expected_reports: countryUsers.length,
                        submitted_reports: submittedCount,
                        missed_reports: missingMembers.length
                    }
                });
                try {
                    const delivery = await sendLeaderSummaryEmail({
                        email: leader.email,
                        name: leader.fullname,
                        country: leaderCountry,
                        weekStart: selectedWeek.weekStart,
                        weekEnd: selectedWeek.weekEnd,
                        expectedMembers: countryUsers.length,
                        submittedReports: submittedCount,
                        missingMembers,
                        customSubject,
                        customMessage
                    });
                    await leaderReminder.update({ email_status: delivery.deliveryStatus, message_id: delivery.messageId, sent_at: new Date(), subject: delivery.subject, message_html: delivery.htmlContent, sent_by: req.user.id });
                    sent.push({ id: leader.id, fullname: leader.fullname, email: leader.email, country: leaderCountry, missingReports: missingMembers.length });
                } catch (error) {
                    await leaderReminder.update({ email_status: 'failed', sent_at: new Date() });
                    skipped.push({ id: leader.id, fullname: leader.fullname, reason: error.code || error.message });
                }
            }
        }
        res.json({ weekStart: selectedWeek.weekStart, weekEnd: selectedWeek.weekEnd, sent, skipped });
    } catch (err) {
        console.error('Send weekly reminders error:', err.message);
        res.status(500).json({ msg: 'Unable to send weekly reminders.' });
    }
};

exports.exportPerformanceExcel = async (req, res) => {
    try {
        if (!['admin', 'leader'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'Not authorized.' });
        }
        const scope = req.params.scope === 'country' ? 'country' : 'member';
        const { startDate, endDate } = req.query;
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const end = endDate || new Date().toISOString().split('T')[0];
        const userWhere = req.user.role === 'leader'
            ? { country: req.user.country, role: { [Op.ne]: 'admin' } }
            : { role: { [Op.ne]: 'admin' } };
        const users = await User.findAll({ where: userWhere });
        const reports = await Report.findAll({
            where: {
                user_id: { [Op.in]: users.map(user => user.id) },
                date: { [Op.between]: [start, end] }
            }
        });
        const expectedDays = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000) + 1);
        const userStats = users.map(user => {
            const userReports = reports.filter(report => report.user_id === user.id);
            const uniqueDates = new Set(userReports.map(report => report.date)).size;
            return {
                name: user.fullname,
                email: user.email,
                country: user.country,
                reportsSubmitted: uniqueDates,
                completionRate: Math.min(100, Math.round((uniqueDates / expectedDays) * 100)),
                evangelismHours: userReports.reduce((sum, report) => sum + (parseFloat(report.evangelism_hours) || 0), 0),
                peopleReached: userReports.reduce((sum, report) => sum + (parseInt(report.people_reached) || 0), 0)
            };
        });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Ministry Report System';
        const worksheet = workbook.addWorksheet(scope === 'country' ? 'Country Performance' : 'Member Performance');
        if (scope === 'country') {
            worksheet.columns = [
                { header: 'Country', key: 'country', width: 22 },
                { header: 'Members', key: 'members', width: 12 },
                { header: 'Reports Submitted', key: 'reportsSubmitted', width: 20 },
                { header: 'Average Completion', key: 'completionRate', width: 20 },
                { header: 'Evangelism Hours', key: 'evangelismHours', width: 20 },
                { header: 'People Reached', key: 'peopleReached', width: 18 }
            ];
            const countryNames = [...new Set(userStats.map(stat => stat.country).filter(Boolean))];
            countryNames.forEach(country => {
                const countryStats = userStats.filter(stat => stat.country === country);
                worksheet.addRow({
                    country,
                    members: countryStats.length,
                    reportsSubmitted: countryStats.reduce((sum, stat) => sum + stat.reportsSubmitted, 0),
                    completionRate: `${Math.round(countryStats.reduce((sum, stat) => sum + stat.completionRate, 0) / countryStats.length)}%`,
                    evangelismHours: Number(countryStats.reduce((sum, stat) => sum + stat.evangelismHours, 0).toFixed(2)),
                    peopleReached: countryStats.reduce((sum, stat) => sum + stat.peopleReached, 0)
                });
            });
        } else {
            worksheet.columns = [
                { header: 'Member', key: 'name', width: 24 },
                { header: 'Email', key: 'email', width: 28 },
                { header: 'Country', key: 'country', width: 18 },
                { header: 'Reports Submitted', key: 'reportsSubmitted', width: 20 },
                { header: 'Completion', key: 'completionRate', width: 14 },
                { header: 'Evangelism Hours', key: 'evangelismHours', width: 20 },
                { header: 'People Reached', key: 'peopleReached', width: 18 }
            ];
            userStats.sort((a, b) => b.completionRate - a.completionRate).forEach(stat => {
                worksheet.addRow({
                    ...stat,
                    completionRate: `${stat.completionRate}%`,
                    evangelismHours: Number(stat.evangelismHours.toFixed(2))
                });
            });
        }
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
        worksheet.autoFilter = { from: 'A1', to: `${String.fromCharCode(64 + worksheet.columnCount)}1` };
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${scope}_performance_${start}_to_${end}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Performance export error:', err.message);
        res.status(500).json({ msg: 'Unable to export performance report.' });
    }
};

// Delete Report
exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findByPk(req.params.id);

        if (!report) {
            return res.status(404).json({ msg: 'Report not found' });
        }

        // Authorization Check
        let authorized = false;

        if (req.user.role === 'admin') {
            authorized = true;
        } else if (req.user.role === 'leader') {
            // Leader can delete their own reports OR reports from their country
            if (report.user_id === req.user.id) {
                authorized = true;
            } else {
                const reportUser = await User.findByPk(report.user_id);
                if (reportUser && reportUser.country === req.user.country) {
                    authorized = true;
                }
            }
        }
        // Members are NOT authorized to delete reports

        if (!authorized) {
            return res.status(403).json({ msg: 'Not authorized to delete this report' });
        }

        // Delete attachments first (optional, but good practice to clean up files)
        // For now, we just delete the database record.
        // In a real app, you'd delete files from 'uploads/' too.
        await Attachment.destroy({ where: { report_id: report.id } });

        await report.destroy();

        res.json({ msg: 'Report removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};