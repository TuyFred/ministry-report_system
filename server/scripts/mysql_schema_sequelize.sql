<<<<<<< HEAD
-- ============================================
-- MySQL Schema - MATCHED TO SEQUELIZE MODELS
-- Updated to match your actual backend models
-- ============================================

USE report;

-- Drop existing tables to recreate with correct structure
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS users;
DROP VIEW IF EXISTS vw_latest_reports;
DROP VIEW IF EXISTS vw_user_statistics;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- USERS TABLE (Matches User.js model)
-- ============================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'leader', 'member') NOT NULL DEFAULT 'member',
  country VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  address VARCHAR(255),
  profile_image VARCHAR(255),
  resetPasswordToken VARCHAR(255),
  resetPasswordExpire DATETIME,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REPORTS TABLE (Matches Report.js model)
-- ============================================
CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  church VARCHAR(255) NOT NULL,
  evangelism_hours FLOAT DEFAULT 0,
  people_reached INT DEFAULT 0,
  contacts_received INT DEFAULT 0,
  bible_study_sessions INT DEFAULT 0,
  bible_study_attendants INT DEFAULT 0,
  unique_attendants INT DEFAULT 0,
  newcomers INT DEFAULT 0,
  meditation_time FLOAT DEFAULT 0,
  prayer_time FLOAT DEFAULT 0,
  morning_service VARCHAR(255),
  regular_service VARCHAR(255),
  sermons_listened INT DEFAULT 0,
  articles_written INT DEFAULT 0,
  exercise_time FLOAT DEFAULT 0,
  sermon_reflection TEXT,
  reflections TEXT,
  thanksgiving TEXT,
  repentance TEXT,
  prayer_requests TEXT,
  other_work TEXT,
  tomorrow_tasks TEXT,
  other_activities TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reports_user_date (user_id, date),
  INDEX idx_reports_date (date),
  INDEX idx_reports_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ATTACHMENTS TABLE (Matches Attachment.js model)
-- ============================================
CREATE TABLE attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  mime_type VARCHAR(100),
  size INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  INDEX idx_attachments_report (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED ADMIN USER
-- Password: Admin@123 (bcrypt hashed)
-- ============================================
INSERT INTO users (fullname, email, password, role, country, contact, address)
VALUES (
  'System Administrator',
  'admin@ministry.com',
  '$2b$10$8K1p/a0dL22N/y/xnnTNwO7B2vHY1aXHkPvPsFG0PRE7.A4XHLPiu',
  'admin',
  'Default Country',
  '+1234567890',
  'Admin Address'
);

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

CREATE VIEW vw_latest_reports AS
SELECT 
  r.id,
  r.user_id,
  u.fullname,
  u.email,
  u.role,
  r.date,
  r.name,
  r.country,
  r.church,
  r.evangelism_hours,
  r.people_reached,
  r.contacts_received,
  r.bible_study_sessions,
  r.bible_study_attendants,
  r.unique_attendants,
  r.newcomers,
  r.meditation_time,
  r.prayer_time,
  r.sermons_listened,
  r.articles_written,
  r.exercise_time,
  r.createdAt,
  r.updatedAt
FROM reports r
JOIN users u ON r.user_id = u.id
ORDER BY r.date DESC, r.createdAt DESC;

CREATE VIEW vw_user_statistics AS
SELECT 
  u.id,
  u.fullname,
  u.email,
  u.role,
  COUNT(r.id) as total_reports,
  COALESCE(SUM(r.evangelism_hours), 0) as total_evangelism_hours,
  COALESCE(SUM(r.people_reached), 0) as total_people_reached,
  COALESCE(SUM(r.prayer_time), 0) as total_prayer_time,
  COALESCE(SUM(r.meditation_time), 0) as total_meditation_time,
  COALESCE(SUM(r.newcomers), 0) as total_newcomers,
  COALESCE(AVG(r.evangelism_hours), 0) as avg_evangelism_hours,
  MAX(r.date) as last_report_date
FROM users u
LEFT JOIN reports r ON u.id = r.user_id
GROUP BY u.id, u.fullname, u.email, u.role;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'MySQL Schema Updated Successfully!' AS Message;
SELECT 'Tables created to match Sequelize models' AS Info;
SELECT '✓ users, reports, attachments tables ready' AS Status;
SELECT '✓ Admin user created (email: admin@ministry.com, password: Admin@123)' AS Admin;
=======
-- ============================================
-- MySQL Schema - MATCHED TO SEQUELIZE MODELS
-- Updated to match your actual backend models
-- ============================================

USE report;

-- Drop existing tables to recreate with correct structure
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS users;
DROP VIEW IF EXISTS vw_latest_reports;
DROP VIEW IF EXISTS vw_user_statistics;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- USERS TABLE (Matches User.js model)
-- ============================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullname VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'leader', 'member') NOT NULL DEFAULT 'member',
  country VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  address VARCHAR(255),
  profile_image VARCHAR(255),
  resetPasswordToken VARCHAR(255),
  resetPasswordExpire DATETIME,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- REPORTS TABLE (Matches Report.js model)
-- ============================================
CREATE TABLE reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  country VARCHAR(255) NOT NULL,
  church VARCHAR(255) NOT NULL,
  evangelism_hours FLOAT DEFAULT 0,
  people_reached INT DEFAULT 0,
  contacts_received INT DEFAULT 0,
  bible_study_sessions INT DEFAULT 0,
  bible_study_attendants INT DEFAULT 0,
  unique_attendants INT DEFAULT 0,
  newcomers INT DEFAULT 0,
  meditation_time FLOAT DEFAULT 0,
  prayer_time FLOAT DEFAULT 0,
  morning_service VARCHAR(255),
  regular_service VARCHAR(255),
  sermons_listened INT DEFAULT 0,
  articles_written INT DEFAULT 0,
  exercise_time FLOAT DEFAULT 0,
  sermon_reflection TEXT,
  reflections TEXT,
  thanksgiving TEXT,
  repentance TEXT,
  prayer_requests TEXT,
  other_work TEXT,
  tomorrow_tasks TEXT,
  other_activities TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_reports_user_date (user_id, date),
  INDEX idx_reports_date (date),
  INDEX idx_reports_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ATTACHMENTS TABLE (Matches Attachment.js model)
-- ============================================
CREATE TABLE attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  mime_type VARCHAR(100),
  size INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  INDEX idx_attachments_report (report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SEED ADMIN USER
-- Password: Admin@123 (bcrypt hashed)
-- ============================================
INSERT INTO users (fullname, email, password, role, country, contact, address)
VALUES (
  'System Administrator',
  'admin@ministry.com',
  '$2b$10$8K1p/a0dL22N/y/xnnTNwO7B2vHY1aXHkPvPsFG0PRE7.A4XHLPiu',
  'admin',
  'Default Country',
  '+1234567890',
  'Admin Address'
);

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

CREATE VIEW vw_latest_reports AS
SELECT 
  r.id,
  r.user_id,
  u.fullname,
  u.email,
  u.role,
  r.date,
  r.name,
  r.country,
  r.church,
  r.evangelism_hours,
  r.people_reached,
  r.contacts_received,
  r.bible_study_sessions,
  r.bible_study_attendants,
  r.unique_attendants,
  r.newcomers,
  r.meditation_time,
  r.prayer_time,
  r.sermons_listened,
  r.articles_written,
  r.exercise_time,
  r.createdAt,
  r.updatedAt
FROM reports r
JOIN users u ON r.user_id = u.id
ORDER BY r.date DESC, r.createdAt DESC;

CREATE VIEW vw_user_statistics AS
SELECT 
  u.id,
  u.fullname,
  u.email,
  u.role,
  COUNT(r.id) as total_reports,
  COALESCE(SUM(r.evangelism_hours), 0) as total_evangelism_hours,
  COALESCE(SUM(r.people_reached), 0) as total_people_reached,
  COALESCE(SUM(r.prayer_time), 0) as total_prayer_time,
  COALESCE(SUM(r.meditation_time), 0) as total_meditation_time,
  COALESCE(SUM(r.newcomers), 0) as total_newcomers,
  COALESCE(AVG(r.evangelism_hours), 0) as avg_evangelism_hours,
  MAX(r.date) as last_report_date
FROM users u
LEFT JOIN reports r ON u.id = r.user_id
GROUP BY u.id, u.fullname, u.email, u.role;

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'MySQL Schema Updated Successfully!' AS Message;
SELECT 'Tables created to match Sequelize models' AS Info;
SELECT '✓ users, reports, attachments tables ready' AS Status;
SELECT '✓ Admin user created (email: admin@ministry.com, password: Admin@123)' AS Admin;
>>>>>>> 04920ac493daeaada4207a3915fd87d9275d5fc8
