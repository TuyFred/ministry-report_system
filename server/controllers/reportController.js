const Report = require('../models/Report');
const Attachment = require('../models/Attachment');
const User = require('../models/User');
const { Op, fn, col, literal } = require('sequelize');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Create Report
exports.createReport = async (req, res) => {
    try {
        const {
            date, name, country, church, evangelism_hours, people_reached, contacts_received,
            bible_study_sessions, bible_study_attendants, unique_attendants, newcomers,
            meditation_time, prayer_time, morning_service, regular_service, sermons_listened, articles_written, exercise_time,
            reflections, thanksgiving, repentance, prayer_requests, other_work, tomorrow_tasks
        } = req.body;

        const newReport = await Report.create({
            user_id: req.user.id,
            date, name, country, church, evangelism_hours, people_reached, contacts_received,
            bible_study_sessions, bible_study_attendants, unique_attendants, newcomers,
            meditation_time, prayer_time, morning_service, regular_service, sermons_listened, articles_written, exercise_time,
            reflections, thanksgiving, repentance, prayer_requests, other_work, tomorrow_tasks
        });

        // Handle Attachments
        if (req.files) {
            const attachments = req.files.map(file => ({
                report_id: newReport.id,
                file_url: file.path,
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
        const { startDate, endDate, userId, country } = req.query;
        let whereClause = {};

        // Date Filter
        if (startDate && endDate) {
            whereClause.date = { [Op.between]: [startDate, endDate] };
        }

        // Role-based Access
        if (req.user.role === 'member') {
            whereClause.user_id = req.user.id;
        } else if (req.user.role === 'leader') {
            // Leader sees reports from their country
            // First find all users in that country
            const countryUsers = await User.findAll({ where: { country: req.user.country }, attributes: ['id'] });
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
                const countryUsers = await User.findAll({ where: { country: country }, attributes: ['id'] });
                const userIds = countryUsers.map(u => u.id);
                whereClause.user_id = { [Op.in]: userIds };
            }
            if (userId) whereClause.user_id = userId;
        }

        const reports = await Report.findAll({
            where: whereClause,
            include: [
                { model: User, attributes: ['fullname', 'country'] },
                { model: Attachment }
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
            return res.status(403).json({ msg: 'Not authorized to edit this report' });
        }

        const {
            date, name, country, church, evangelism_hours, people_reached, contacts_received,
            bible_study_sessions, bible_study_attendants, unique_attendants, newcomers,
            meditation_time, prayer_time, morning_service, regular_service, sermons_listened, 
            articles_written, exercise_time, sermon_reflection, reflections, thanksgiving, 
            repentance, prayer_requests, other_work, tomorrow_tasks
        } = req.body;

        await report.update({
            date, name, country, church, evangelism_hours, people_reached, contacts_received,
            bible_study_sessions, bible_study_attendants, unique_attendants, newcomers,
            meditation_time, prayer_time, morning_service, regular_service, sermons_listened, 
            articles_written, exercise_time, sermon_reflection, reflections, thanksgiving, 
            repentance, prayer_requests, other_work, tomorrow_tasks
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
        const { startDate, endDate, userId, country } = req.query;
        let whereClause = {};

        // Apply same filters as getReports
        if (startDate && endDate) {
            whereClause.date = { [Op.between]: [startDate, endDate] };
        }

        // Role-based filtering
        if (req.user.role === 'admin') {
            if (userId) whereClause.user_id = userId;
            if (country) {
                const users = await User.findAll({ where: { country } });
                whereClause.user_id = { [Op.in]: users.map(u => u.id) };
            }
        } else if (req.user.role === 'leader') {
            const users = await User.findAll({ where: { country: req.user.country } });
            whereClause.user_id = { [Op.in]: users.map(u => u.id) };
        } else {
            whereClause.user_id = req.user.id;
        }

        const reports = await Report.findAll({
            where: whereClause,
            include: [{ model: User, attributes: ['fullname', 'country', 'church'] }],
            order: [['date', 'DESC']]
        });

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        let filename = `ministry_reports_${new Date().toISOString().split('T')[0]}.pdf`;
        filename = encodeURIComponent(filename);

        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');

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
                doc.fontSize(16).fillColor('#4F46E5').text(`Report #${index + 1}`, { underline: true });
                doc.moveDown(0.5);

                // Basic Info
                doc.fontSize(12).fillColor('#111827').text(`Name: ${report.User?.fullname || 'N/A'}`, { continued: false });
                doc.text(`Country: ${report.User?.country || 'N/A'}`);
                doc.text(`Church: ${report.User?.church || 'N/A'}`);
                doc.text(`Date: ${new Date(report.date).toLocaleDateString()}`);
                doc.moveDown();

                // Evangelism Section
                doc.fontSize(14).fillColor('#7C3AED').text('Evangelism Activities');
                doc.fontSize(11).fillColor('#374151');
                doc.text(`Evangelism Hours: ${report.evangelism_hours || 0} hours`);
                doc.text(`People Reached: ${report.people_reached || 0}`);
                doc.text(`Contacts Received: ${report.contacts_received || 0}`);
                doc.moveDown();

                // Bible Study Section
                doc.fontSize(14).fillColor('#7C3AED').text('Bible Study');
                doc.fontSize(11).fillColor('#374151');
                doc.text(`Sessions: ${report.bible_study_sessions || 0}`);
                doc.text(`Attendants: ${report.bible_study_attendants || 0}`);
                doc.text(`Unique Attendants: ${report.unique_attendants || 0}`);
                doc.text(`Newcomers: ${report.newcomers || 0}`);
                doc.moveDown();

                // Spiritual Life Section
                doc.fontSize(14).fillColor('#7C3AED').text('Spiritual Life');
                doc.fontSize(11).fillColor('#374151');
                doc.text(`Meditation Time: ${report.meditation_time || 0} minutes`);
                doc.text(`Prayer Time: ${report.prayer_time || 0} minutes`);
                doc.text(`Morning Service: ${report.morning_service ? 'Yes' : 'No'}`);
                doc.text(`Regular Service: ${report.regular_service ? 'Yes' : 'No'}`);
                doc.text(`Sermons Listened: ${report.sermons_listened || 0}`);
                doc.text(`Articles Written: ${report.articles_written || 0}`);
                doc.text(`Exercise Time: ${report.exercise_time || 0} minutes`);
                doc.moveDown();

                // Reflections
                if (report.reflections) {
                    doc.fontSize(14).fillColor('#7C3AED').text('Reflections');
                    doc.fontSize(10).fillColor('#374151').text(report.reflections, { width: 500 });
                    doc.moveDown();
                }

                // Thanksgiving
                if (report.thanksgiving) {
                    doc.fontSize(14).fillColor('#7C3AED').text('Thanksgiving');
                    doc.fontSize(10).fillColor('#374151').text(report.thanksgiving, { width: 500 });
                    doc.moveDown();
                }

                // Prayer Requests
                if (report.prayer_requests) {
                    doc.fontSize(14).fillColor('#7C3AED').text('Prayer Requests');
                    doc.fontSize(10).fillColor('#374151').text(report.prayer_requests, { width: 500 });
                    doc.moveDown();
                }
            });
        }

        doc.end();

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Export to Excel
exports.exportExcel = async (req, res) => {
    try {
        const { startDate, endDate, userId, country } = req.query;
        let whereClause = {};

        // Apply same filters as getReports
        if (startDate && endDate) {
            whereClause.date = { [Op.between]: [startDate, endDate] };
        }

        // Role-based filtering
        if (req.user.role === 'admin') {
            if (userId) whereClause.user_id = userId;
            if (country) {
                const users = await User.findAll({ where: { country } });
                whereClause.user_id = { [Op.in]: users.map(u => u.id) };
            }
        } else if (req.user.role === 'leader') {
            const users = await User.findAll({ where: { country: req.user.country } });
            whereClause.user_id = { [Op.in]: users.map(u => u.id) };
        } else {
            whereClause.user_id = req.user.id;
        }

        const reports = await Report.findAll({
            where: whereClause,
            include: [{ model: User, attributes: ['fullname', 'country', 'church'] }],
            order: [['date', 'DESC']]
        });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Ministry Reports');

        // Style the header
        worksheet.columns = [
            { header: 'Date', key: 'date', width: 12 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Country', key: 'country', width: 15 },
            { header: 'Church', key: 'church', width: 20 },
            { header: 'Evangelism Hours', key: 'evangelism_hours', width: 18 },
            { header: 'People Reached', key: 'people_reached', width: 15 },
            { header: 'Contacts Received', key: 'contacts_received', width: 18 },
            { header: 'Bible Study Sessions', key: 'bible_study_sessions', width: 20 },
            { header: 'Bible Study Attendants', key: 'bible_study_attendants', width: 22 },
            { header: 'Unique Attendants', key: 'unique_attendants', width: 18 },
            { header: 'Newcomers', key: 'newcomers', width: 12 },
            { header: 'Meditation (min)', key: 'meditation_time', width: 16 },
            { header: 'Prayer (min)', key: 'prayer_time', width: 14 },
            { header: 'Morning Service', key: 'morning_service', width: 16 },
            { header: 'Regular Service', key: 'regular_service', width: 16 },
            { header: 'Sermons Listened', key: 'sermons_listened', width: 16 },
            { header: 'Articles Written', key: 'articles_written', width: 16 },
            { header: 'Exercise (min)', key: 'exercise_time', width: 14 },
            { header: 'Reflections', key: 'reflections', width: 40 },
            { header: 'Thanksgiving', key: 'thanksgiving', width: 40 },
            { header: 'Repentance', key: 'repentance', width: 40 },
            { header: 'Prayer Requests', key: 'prayer_requests', width: 40 },
            { header: 'Other Work', key: 'other_work', width: 40 },
            { header: 'Tomorrow Tasks', key: 'tomorrow_tasks', width: 40 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 25;

        // Add data rows
        reports.forEach(report => {
            worksheet.addRow({
                date: new Date(report.date).toLocaleDateString(),
                name: report.User?.fullname || 'N/A',
                country: report.User?.country || 'N/A',
                church: report.User?.church || 'N/A',
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
                tomorrow_tasks: report.tomorrow_tasks || ''
            });
        });

        // Add alternating row colors
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) {
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

        const filename = `ministry_reports_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
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
        if (req.user.role === 'admin') {
            users = await User.findAll({ where: { role: { [Op.ne]: 'admin' } } });
        } else if (req.user.role === 'leader') {
            users = await User.findAll({ where: { country: req.user.country, role: { [Op.ne]: 'admin' } } });
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
            include: [{ model: User, attributes: ['id', 'fullname'] }]
        });

        // Calculate statistics for each user
        const userStats = users.map(user => {
            const userReports = reports.filter(r => r.user_id === user.id);
            const reportsSubmitted = userReports.length;
            const completionRate = Math.round((reportsSubmitted / expectedDays) * 100);

            // Calculate current streak (consecutive days)
            const sortedDates = userReports
                .map(r => new Date(r.date))
                .sort((a, b) => b - a);

            let currentStreak = 0;
            let checkDate = new Date();
            
            for (let i = 0; i < sortedDates.length; i++) {
                const reportDate = sortedDates[i].toISOString().split('T')[0];
                const expectedDate = checkDate.toISOString().split('T')[0];
                
                if (reportDate === expectedDate) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }

            // Get last report date
            const lastReportDate = sortedDates.length > 0 
                ? sortedDates[0].toLocaleDateString() 
                : null;

            // Calculate missed days
            const missedDays = expectedDays - reportsSubmitted;

            return {
                id: user.id,
                fullname: user.fullname,
                reportsSubmitted,
                completionRate,
                currentStreak,
                lastReportDate,
                missedDays
            };
        });

        // Sort by completion rate (best performers first)
        const allStats = userStats.sort((a, b) => b.completionRate - a.completionRate);

        const topPerformers = allStats.slice(0, 10);

        // Get users needing attention (below 70%)
        const needsAttention = userStats
            .filter(stat => stat.completionRate < 70)
            .sort((a, b) => a.completionRate - b.completionRate);

        // Calculate Country Stats (for Admin)
        let countryStats = [];
        if (req.user.role === 'admin') {
            const countries = [...new Set(users.map(u => u.country))];
            countryStats = countries.map(country => {
                const countryUsers = userStats.filter(u => users.find(user => user.id === u.id).country === country);
                const avgCompletion = countryUsers.length > 0 
                    ? Math.round(countryUsers.reduce((sum, u) => sum + u.completionRate, 0) / countryUsers.length)
                    : 0;
                return {
                    country,
                    averageCompletion: avgCompletion,
                    memberCount: countryUsers.length
                };
            }).sort((a, b) => b.averageCompletion - a.averageCompletion);
        }

        // Calculate overall statistics
        const totalMembers = users.length;
        const totalReports = reports.length;
        const averageCompletion = totalMembers > 0 
            ? Math.round(userStats.reduce((sum, stat) => sum + stat.completionRate, 0) / totalMembers)
            : 0;
        const topStreak = userStats.length > 0
            ? Math.max(...userStats.map(stat => stat.currentStreak))
            : 0;

        res.json({
            totalMembers,
            totalReports,
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
