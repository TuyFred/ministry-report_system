-- ============================================
-- MySQL Schema for Ministry Report System
-- Complete Database Setup with All Queries
-- ============================================

-- Set character set and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS users;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  fullname VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'leader', 'member') NOT NULL DEFAULT 'member',
  country VARCHAR(100),
  contact VARCHAR(50),
  address TEXT,
  profile_image TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REPORTS TABLE
-- ============================================
CREATE TABLE reports (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  worship_time INT DEFAULT 0,
  bible_reading_time INT DEFAULT 0,
  study_attendants INT DEFAULT 0,
  unique_attendants INT DEFAULT 0,
  newcomers INT DEFAULT 0,
  meditation_time INT DEFAULT 0,
  prayer_time INT DEFAULT 0,
  sermons_listened INT DEFAULT 0,
  articles_written INT DEFAULT 0,
  exercise_time INT DEFAULT 0,
  reflections TEXT,
  thanksgiving TEXT,
  repentance TEXT,
  prayer_requests TEXT,
  other_work TEXT,
  tomorrow_tasks TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reports_user_date (user_id, date),
  INDEX idx_reports_date (date),
  INDEX idx_reports_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ATTACHMENTS TABLE
-- ============================================
CREATE TABLE attachments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  report_id VARCHAR(36) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  mime_type VARCHAR(100),
  size INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  INDEX idx_attachments_report (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED ADMIN USER
-- Password: Admin@123 (hashed with bcrypt)
-- ============================================
INSERT INTO users (id, fullname, email, password, role, country, contact, address, created_at, updated_at)
VALUES (
  UUID(),
  'System Administrator',
  'admin@ministry.com',
  '$2b$10$YourHashedPasswordHere',  -- Replace with actual bcrypt hash
  'admin',
  'Default Country',
  '+1234567890',
  'Admin Address',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- ============================================
-- COMMON QUERIES FOR THE SYSTEM
-- ============================================

-- ===================
-- USER QUERIES
-- ===================

-- 1. Create new user
-- INSERT INTO users (fullname, email, password, role, country, contact, address)
-- VALUES (?, ?, ?, ?, ?, ?, ?);

-- 2. Get user by email (for login)
-- SELECT * FROM users WHERE email = ?;

-- 3. Get user by ID
-- SELECT * FROM users WHERE id = ?;

-- 4. Update user profile
-- UPDATE users 
-- SET fullname = ?, country = ?, contact = ?, address = ?, profile_image = ?
-- WHERE id = ?;

-- 5. Update user password
-- UPDATE users SET password = ? WHERE id = ?;

-- 6. Get all users (with pagination)
-- SELECT * FROM users 
-- ORDER BY created_at DESC 
-- LIMIT ? OFFSET ?;

-- 7. Get users by role
-- SELECT * FROM users WHERE role = ? ORDER BY fullname;

-- 8. Delete user
-- DELETE FROM users WHERE id = ?;

-- 9. Count total users
-- SELECT COUNT(*) as total FROM users;

-- 10. Search users by name or email
-- SELECT * FROM users 
-- WHERE fullname LIKE ? OR email LIKE ?
-- ORDER BY fullname;

-- ===================
-- REPORT QUERIES
-- ===================

-- 11. Create new report
-- INSERT INTO reports (
--   user_id, date, worship_time, bible_reading_time, study_attendants,
--   unique_attendants, newcomers, meditation_time, prayer_time,
--   sermons_listened, articles_written, exercise_time,
--   reflections, thanksgiving, repentance, prayer_requests,
--   other_work, tomorrow_tasks
-- ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- 12. Get report by ID with user info
-- SELECT r.*, u.fullname, u.email 
-- FROM reports r
-- JOIN users u ON r.user_id = u.id
-- WHERE r.id = ?;

-- 13. Get all reports for a user
-- SELECT * FROM reports 
-- WHERE user_id = ?
-- ORDER BY date DESC;

-- 14. Get reports by date range
-- SELECT r.*, u.fullname, u.email
-- FROM reports r
-- JOIN users u ON r.user_id = u.id
-- WHERE r.date BETWEEN ? AND ?
-- ORDER BY r.date DESC;

-- 15. Get reports for a specific date
-- SELECT r.*, u.fullname, u.email
-- FROM reports r
-- JOIN users u ON r.user_id = u.id
-- WHERE r.date = ?
-- ORDER BY u.fullname;

-- 16. Update report
-- UPDATE reports 
-- SET worship_time = ?, bible_reading_time = ?, study_attendants = ?,
--     unique_attendants = ?, newcomers = ?, meditation_time = ?,
--     prayer_time = ?, sermons_listened = ?, articles_written = ?,
--     exercise_time = ?, reflections = ?, thanksgiving = ?,
--     repentance = ?, prayer_requests = ?, other_work = ?, tomorrow_tasks = ?
-- WHERE id = ? AND user_id = ?;

-- 17. Delete report
-- DELETE FROM reports WHERE id = ? AND user_id = ?;

-- 18. Get weekly reports (last 7 days)
-- SELECT r.*, u.fullname, u.email
-- FROM reports r
-- JOIN users u ON r.user_id = u.id
-- WHERE r.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
-- ORDER BY r.date DESC, u.fullname;

-- 19. Get monthly reports (current month)
-- SELECT r.*, u.fullname, u.email
-- FROM reports r
-- JOIN users u ON r.user_id = u.id
-- WHERE YEAR(r.date) = YEAR(CURDATE()) 
--   AND MONTH(r.date) = MONTH(CURDATE())
-- ORDER BY r.date DESC, u.fullname;

-- 20. Get reports with pagination
-- SELECT r.*, u.fullname, u.email
-- FROM reports r
-- JOIN users u ON r.user_id = u.id
-- ORDER BY r.date DESC, r.created_at DESC
-- LIMIT ? OFFSET ?;

-- ===================
-- ATTACHMENT QUERIES
-- ===================

-- 21. Create attachment
-- INSERT INTO attachments (report_id, filename, url, mime_type, size)
-- VALUES (?, ?, ?, ?, ?);

-- 22. Get attachments for a report
-- SELECT * FROM attachments WHERE report_id = ?;

-- 23. Delete attachment
-- DELETE FROM attachments WHERE id = ?;

-- 24. Delete all attachments for a report
-- DELETE FROM attachments WHERE report_id = ?;

-- ===================
-- ANALYTICS QUERIES
-- ===================

-- 25. Get total statistics for a user (date range)
-- SELECT 
--   COUNT(*) as total_reports,
--   SUM(worship_time) as total_worship,
--   SUM(bible_reading_time) as total_bible_reading,
--   SUM(study_attendants) as total_study_attendants,
--   SUM(unique_attendants) as total_unique_attendants,
--   SUM(newcomers) as total_newcomers,
--   SUM(meditation_time) as total_meditation,
--   SUM(prayer_time) as total_prayer,
--   SUM(sermons_listened) as total_sermons,
--   SUM(articles_written) as total_articles,
--   SUM(exercise_time) as total_exercise,
--   AVG(worship_time) as avg_worship,
--   AVG(bible_reading_time) as avg_bible_reading,
--   AVG(prayer_time) as avg_prayer
-- FROM reports
-- WHERE user_id = ? AND date BETWEEN ? AND ?;

-- 26. Get system-wide statistics (all users, date range)
-- SELECT 
--   COUNT(DISTINCT user_id) as active_users,
--   COUNT(*) as total_reports,
--   SUM(worship_time) as total_worship,
--   SUM(bible_reading_time) as total_bible_reading,
--   SUM(study_attendants) as total_study_attendants,
--   SUM(unique_attendants) as total_unique_attendants,
--   SUM(newcomers) as total_newcomers,
--   SUM(meditation_time) as total_meditation,
--   SUM(prayer_time) as total_prayer,
--   SUM(sermons_listened) as total_sermons,
--   SUM(articles_written) as total_articles,
--   AVG(worship_time) as avg_worship,
--   AVG(bible_reading_time) as avg_bible_reading
-- FROM reports
-- WHERE date BETWEEN ? AND ?;

-- 27. Get daily statistics grouped by date
-- SELECT 
--   date,
--   COUNT(*) as reports_count,
--   SUM(worship_time) as total_worship,
--   SUM(bible_reading_time) as total_bible_reading,
--   SUM(newcomers) as total_newcomers,
--   AVG(worship_time) as avg_worship,
--   AVG(bible_reading_time) as avg_bible_reading
-- FROM reports
-- WHERE date BETWEEN ? AND ?
-- GROUP BY date
-- ORDER BY date DESC;

-- 28. Get user performance ranking (by total worship time)
-- SELECT 
--   u.id,
--   u.fullname,
--   u.email,
--   COUNT(r.id) as total_reports,
--   SUM(r.worship_time) as total_worship,
--   SUM(r.bible_reading_time) as total_bible_reading,
--   SUM(r.prayer_time) as total_prayer
-- FROM users u
-- LEFT JOIN reports r ON u.id = r.user_id 
--   AND r.date BETWEEN ? AND ?
-- GROUP BY u.id, u.fullname, u.email
-- ORDER BY total_worship DESC;

-- 29. Get most active users (by report count)
-- SELECT 
--   u.fullname,
--   u.email,
--   COUNT(r.id) as report_count,
--   MAX(r.date) as last_report_date
-- FROM users u
-- LEFT JOIN reports r ON u.id = r.user_id
-- GROUP BY u.id, u.fullname, u.email
-- ORDER BY report_count DESC
-- LIMIT ?;

-- 30. Get weekly trend (last 4 weeks)
-- SELECT 
--   YEARWEEK(date, 1) as week_number,
--   DATE_SUB(date, INTERVAL WEEKDAY(date) DAY) as week_start,
--   COUNT(*) as reports,
--   SUM(worship_time) as total_worship,
--   SUM(bible_reading_time) as total_bible_reading,
--   SUM(newcomers) as total_newcomers
-- FROM reports
-- WHERE date >= DATE_SUB(CURDATE(), INTERVAL 4 WEEK)
-- GROUP BY week_number, week_start
-- ORDER BY week_number DESC;

-- 31. Get monthly trend (last 12 months)
-- SELECT 
--   YEAR(date) as year,
--   MONTH(date) as month,
--   DATE_FORMAT(date, '%Y-%m') as month_label,
--   COUNT(*) as reports,
--   SUM(worship_time) as total_worship,
--   SUM(bible_reading_time) as total_bible_reading,
--   SUM(newcomers) as total_newcomers,
--   COUNT(DISTINCT user_id) as active_users
-- FROM reports
-- WHERE date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
-- GROUP BY year, month, month_label
-- ORDER BY year DESC, month DESC;

-- ===================
-- EXPORT QUERIES
-- ===================

-- 32. Export all reports for a user (CSV format)
-- SELECT 
--   r.date,
--   r.worship_time,
--   r.bible_reading_time,
--   r.study_attendants,
--   r.unique_attendants,
--   r.newcomers,
--   r.meditation_time,
--   r.prayer_time,
--   r.sermons_listened,
--   r.articles_written,
--   r.exercise_time,
--   r.reflections,
--   r.thanksgiving,
--   r.repentance,
--   r.prayer_requests,
--   r.other_work,
--   r.tomorrow_tasks
-- FROM reports r
-- WHERE r.user_id = ? AND r.date BETWEEN ? AND ?
-- ORDER BY r.date;

-- 33. Export system-wide report summary
-- SELECT 
--   u.fullname,
--   u.email,
--   u.role,
--   r.date,
--   r.worship_time,
--   r.bible_reading_time,
--   r.study_attendants,
--   r.unique_attendants,
--   r.newcomers,
--   r.prayer_time,
--   r.meditation_time
-- FROM reports r
-- JOIN users u ON r.user_id = u.id
-- WHERE r.date BETWEEN ? AND ?
-- ORDER BY r.date DESC, u.fullname;

-- ===================
-- BACKUP QUERIES
-- ===================

-- 34. Check database integrity
-- CHECK TABLE users;
-- CHECK TABLE reports;
-- CHECK TABLE attachments;

-- 35. Optimize tables
-- OPTIMIZE TABLE users;
-- OPTIMIZE TABLE reports;
-- OPTIMIZE TABLE attachments;

-- 36. Get database size
-- SELECT 
--   table_name AS 'Table',
--   ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
-- FROM information_schema.TABLES
-- WHERE table_schema = DATABASE()
-- ORDER BY (data_length + index_length) DESC;

-- ===================
-- MAINTENANCE QUERIES
-- ===================

-- 37. Delete old reports (older than 2 years)
-- DELETE FROM reports 
-- WHERE date < DATE_SUB(CURDATE(), INTERVAL 2 YEAR);

-- 38. Clean orphaned attachments (if any)
-- DELETE FROM attachments 
-- WHERE report_id NOT IN (SELECT id FROM reports);

-- 39. Get inactive users (no reports in last 30 days)
-- SELECT u.*
-- FROM users u
-- LEFT JOIN reports r ON u.id = r.user_id 
--   AND r.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
-- WHERE r.id IS NULL AND u.role != 'admin';

-- 40. Update user role
-- UPDATE users SET role = ? WHERE id = ?;

-- ===================
-- ADVANCED QUERIES
-- ===================

-- 41. Get report submission consistency (days with reports vs total days)
-- SELECT 
--   u.fullname,
--   COUNT(DISTINCT r.date) as days_with_reports,
--   DATEDIFF(MAX(r.date), MIN(r.date)) + 1 as total_days,
--   ROUND(COUNT(DISTINCT r.date) / (DATEDIFF(MAX(r.date), MIN(r.date)) + 1) * 100, 2) as consistency_percentage
-- FROM users u
-- JOIN reports r ON u.id = r.user_id
-- WHERE r.date BETWEEN ? AND ?
-- GROUP BY u.id, u.fullname
-- HAVING total_days > 0
-- ORDER BY consistency_percentage DESC;

-- 42. Get missing report dates for a user
-- SELECT date_range.check_date
-- FROM (
--   SELECT DATE_ADD(?, INTERVAL seq.seq DAY) as check_date
--   FROM (
--     SELECT 0 as seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 
--     UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
--     UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11
--     UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15
--     UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
--     UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23
--     UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27
--     UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
--   ) seq
-- ) date_range
-- LEFT JOIN reports r ON r.user_id = ? AND r.date = date_range.check_date
-- WHERE date_range.check_date <= ?
--   AND r.id IS NULL
-- ORDER BY date_range.check_date;

-- 43. Get comprehensive user report with latest activity
-- SELECT 
--   u.id,
--   u.fullname,
--   u.email,
--   u.role,
--   u.country,
--   u.created_at,
--   COUNT(r.id) as total_reports,
--   MAX(r.date) as last_report_date,
--   DATEDIFF(CURDATE(), MAX(r.date)) as days_since_last_report
-- FROM users u
-- LEFT JOIN reports r ON u.id = r.user_id
-- GROUP BY u.id, u.fullname, u.email, u.role, u.country, u.created_at
-- ORDER BY last_report_date DESC NULLS LAST;

-- 44. Search reports by text content
-- SELECT r.*, u.fullname, u.email
-- FROM reports r
-- JOIN users u ON r.user_id = u.id
-- WHERE r.reflections LIKE ?
--    OR r.thanksgiving LIKE ?
--    OR r.repentance LIKE ?
--    OR r.prayer_requests LIKE ?
--    OR r.other_work LIKE ?
--    OR r.tomorrow_tasks LIKE ?
-- ORDER BY r.date DESC;

-- 45. Get year-over-year comparison
-- SELECT 
--   YEAR(date) as year,
--   COUNT(*) as total_reports,
--   SUM(worship_time) as total_worship,
--   SUM(newcomers) as total_newcomers,
--   AVG(worship_time) as avg_worship
-- FROM reports
-- GROUP BY YEAR(date)
-- ORDER BY year DESC;

-- ============================================
-- VIEWS (Optional - for easier querying)
-- ============================================

-- View: Latest reports with user info
CREATE OR REPLACE VIEW vw_latest_reports AS
SELECT 
  r.id,
  r.user_id,
  u.fullname,
  u.email,
  u.role,
  r.date,
  r.worship_time,
  r.bible_reading_time,
  r.study_attendants,
  r.unique_attendants,
  r.newcomers,
  r.meditation_time,
  r.prayer_time,
  r.sermons_listened,
  r.articles_written,
  r.exercise_time,
  r.created_at,
  r.updated_at
FROM reports r
JOIN users u ON r.user_id = u.id
ORDER BY r.date DESC, r.created_at DESC;

-- View: User statistics summary
CREATE OR REPLACE VIEW vw_user_statistics AS
SELECT 
  u.id,
  u.fullname,
  u.email,
  u.role,
  COUNT(r.id) as total_reports,
  COALESCE(SUM(r.worship_time), 0) as total_worship,
  COALESCE(SUM(r.bible_reading_time), 0) as total_bible_reading,
  COALESCE(SUM(r.prayer_time), 0) as total_prayer,
  COALESCE(SUM(r.newcomers), 0) as total_newcomers,
  COALESCE(AVG(r.worship_time), 0) as avg_worship,
  MAX(r.date) as last_report_date
FROM users u
LEFT JOIN reports r ON u.id = r.user_id
GROUP BY u.id, u.fullname, u.email, u.role;

-- ============================================
-- STORED PROCEDURES (Optional)
-- ============================================

DELIMITER //

-- Procedure: Get user reports with statistics
CREATE PROCEDURE sp_get_user_reports_stats(
  IN p_user_id VARCHAR(36),
  IN p_start_date DATE,
  IN p_end_date DATE
)
BEGIN
  SELECT 
    COUNT(*) as total_reports,
    SUM(worship_time) as total_worship,
    SUM(bible_reading_time) as total_bible_reading,
    SUM(prayer_time) as total_prayer,
    SUM(newcomers) as total_newcomers,
    AVG(worship_time) as avg_worship,
    AVG(bible_reading_time) as avg_bible_reading,
    AVG(prayer_time) as avg_prayer,
    MIN(date) as first_report,
    MAX(date) as last_report
  FROM reports
  WHERE user_id = p_user_id 
    AND date BETWEEN p_start_date AND p_end_date;
END //

-- Procedure: Get system statistics
CREATE PROCEDURE sp_get_system_stats(
  IN p_start_date DATE,
  IN p_end_date DATE
)
BEGIN
  SELECT 
    COUNT(DISTINCT user_id) as active_users,
    COUNT(*) as total_reports,
    SUM(worship_time) as total_worship,
    SUM(bible_reading_time) as total_bible_reading,
    SUM(newcomers) as total_newcomers,
    AVG(worship_time) as avg_worship,
    AVG(bible_reading_time) as avg_bible_reading
  FROM reports
  WHERE date BETWEEN p_start_date AND p_end_date;
END //

DELIMITER ;

-- ============================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================

-- Additional indexes for common queries
CREATE INDEX idx_reports_created_at ON reports(created_at);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_attachments_created_at ON attachments(created_at);

-- ============================================
-- GRANTS (adjust based on your setup)
-- ============================================

-- Example: Create app user with limited permissions
-- CREATE USER IF NOT EXISTS 'ministry_app'@'localhost' IDENTIFIED BY 'SecurePassword123!';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ministry_db.* TO 'ministry_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

SELECT 'MySQL Schema for Ministry Report System created successfully!' AS Message;
SELECT 'Tables created: users, reports, attachments' AS Info;
SELECT 'Views created: vw_latest_reports, vw_user_statistics' AS Info;
SELECT 'Stored procedures created: sp_get_user_reports_stats, sp_get_system_stats' AS Info;
SELECT 'Ready to use! Please update the admin password hash before deployment.' AS Warning;
