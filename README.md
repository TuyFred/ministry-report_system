# Ministry Report System

A comprehensive web application for managing ministry activities, reports, and analytics across multiple countries and teams.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [User Roles & Permissions](#user-roles--permissions)
- [Key Features](#key-features)
- [API Endpoints](#api-endpoints)
- [Export Functionality](#export-functionality)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### 🎯 Core Functionality
- **Multi-Role System**: Admin, Country Leader, and Member roles with specific permissions
- **Report Management**: Submit, view, and edit comprehensive ministry reports
- **Analytics Dashboard**: Track performance, completion rates, and team statistics
- **Export Reports**: Download reports in PDF and Excel formats
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices
- **Beautiful UI**: Modern, professional design with smooth animations and transitions

### 👥 Role-Based Features

#### Admin
- Manage all users across all countries
- View reports from all members and countries
- Access comprehensive analytics with country-level statistics
- Create new admin accounts
- Filter reports by country and date ranges
- Export filtered reports to PDF/Excel

#### Country Leader
- View and manage members from their assigned country
- Add new members (role: member) to their country
- View reports from team members in their country
- Access team analytics and performance metrics
- Export team reports to PDF/Excel

#### Member
- Submit daily ministry reports
- View and edit their own reports
- Track personal performance and completion rates
- Export personal reports to PDF/Excel

### 📊 Report Features
- **Evangelism Activities**: Hours, people reached, contacts received
- **Bible Study**: Sessions, attendants, unique attendants, newcomers
- **Spiritual Life**: Meditation time, prayer time, service attendance
- **Reflections**: Personal reflections, thanksgiving, prayer requests
- **Future Planning**: Tomorrow's tasks and commitments
- **Attachments**: Upload supporting files and images

### 📈 Analytics Features
- **Performance Tracking**: Completion rates, streaks, and consistency
- **Top Performers**: Leaderboard of best reporting members
- **Needs Attention**: Identify members needing support
- **Country Statistics**: Admin-level country performance comparison
- **Time-based Analysis**: Weekly, monthly, and yearly views
- **Visual Indicators**: Color-coded performance levels

## 🛠 Tech Stack

### Frontend
- **React 18**: Modern UI library
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client
- **React Icons**: Icon library
- **Vite**: Fast build tool and dev server

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web application framework
- **PostgreSQL**: Relational database
- **Sequelize**: ORM for database operations
- **JWT**: Authentication tokens
- **Bcrypt**: Password hashing
- **Multer**: File upload handling
- **PDFKit**: PDF generation
- **ExcelJS**: Excel file generation

## 📦 Prerequisites

- **Node.js** (v14 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**
- Modern web browser (Chrome, Firefox, Safari, Edge)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ministry-report-system
```

## 🗄 Database Setup

### Install PostgreSQL
If not already installed, download and install PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)

### Create Database
```sql
CREATE DATABASE ministry_db;
```

### Configure Database Password

**Option 1**: Set PostgreSQL password to match the project default
```bash
psql -U postgres
ALTER USER postgres PASSWORD 'fred123';
\q
```

**Option 2**: Update `.env` file with your PostgreSQL password
```env
DB_PASS=your_actual_password
```

## ⚙️ Backend Setup

### 1. Navigate to Server Folder
```bash
cd server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Create or verify `.env` file in the `server` folder:
```env
DB_NAME=ministry_db
DB_USER=postgres
DB_PASS=fred123
DB_HOST=localhost
JWT_SECRET=generate_a_long_random_secret
PORT=5000
ADMIN_SECRET_KEY=generate_a_different_long_random_secret
BREVO_API_KEY=your_brevo_transactional_api_key
BREVO_SENDER_EMAIL=verified-sender@your-domain.example
BREVO_SENDER_NAME=Ministry Reports
BREVO_WEBHOOK_SECRET=generate_a_third_long_random_secret
OTP_HASH_SECRET=generate_a_fourth_long_random_secret
APP_NAME=Ministry Reports
```

Verify the sender address/domain in Brevo before sending. For reliable inbox delivery, authenticate your sending domain with Brevo's SPF and DKIM DNS records (and configure DMARC where possible). Delivery to the inbox cannot be guaranteed by application code alone.

The server creates the `email_otps` table at startup. Codes are HMAC-hashed, expire after 10 minutes, can be used once, allow at most five guesses, and are limited to one send per minute and five sends per hour per email and flow. To record delivery outcomes, configure a Brevo transactional webhook to `https://YOUR_API_HOST/api/email/brevo-webhook?secret=YOUR_BREVO_WEBHOOK_SECRET` and subscribe to delivery/bounce events. The webhook secret must match the backend environment variable.

### 4. Run Database Migrations
The database tables will be created automatically when you start the server for the first time.

### 5. Seed Admin Account (Optional)
Create an initial admin account:
```bash
node seedAdmin.js
```

This creates:
- **Email**: admin@ministry.com
- **Password**: admin123456

### 6. Start the Server
```bash
npm run dev
```

Server runs on: `http://localhost:5000`

## 💻 Frontend Setup

### 1. Navigate to Client Folder
```bash
cd ../client
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

Client runs on: `http://localhost:3000`

## 🏃 Running the Application

### Start Both Servers

**Terminal 1 - Backend**:
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd client
npm run dev
```

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 👥 User Roles & Permissions

### 🔴 Admin
**Full System Access**
- ✅ Manage all users across all countries
- ✅ View/edit/delete any member
- ✅ View reports from all countries
- ✅ Access global analytics and country statistics
- ✅ Create new admin accounts
- ✅ Filter reports by country and date
- ✅ Export all reports to PDF/Excel
- ❌ Cannot self-register (must be created via API)

### 🟡 Country Leader
**Regional Management**
- ✅ View members from their assigned country only
- ✅ Add new members (role: member) to their country
- ✅ View reports from their country's team
- ✅ Access team analytics and performance metrics
- ✅ Export team reports to PDF/Excel
- ❌ Cannot edit or delete members
- ❌ Cannot view other countries' data
- ✅ Can self-register via registration form

### 🟢 Member
**Personal Reporting**
- ✅ Submit daily ministry reports
- ✅ View their own reports
- ✅ Edit their own reports
- ✅ Track personal performance metrics
- ✅ Export personal reports to PDF/Excel
- ❌ Cannot view other members' reports
- ✅ Can self-register via registration form

## 🔐 Creating Admin Accounts

### Method 1: Seed Script (Initial Setup)
```bash
cd server
node seedAdmin.js
```

**Default Credentials**:
- Email: admin@ministry.com
- Password: admin123456

### Method 2: Via Existing Admin (Settings Page)
1. Login as admin
2. Navigate to Settings page
3. Use "Add Admin" form
4. Fill in admin details
5. Submit

### Method 3: API Request (Advanced)
```bash
POST http://localhost:5000/api/auth/create-admin
```

**Headers**:
```
Content-Type: application/json
x-auth-token: <admin_jwt_token>
```

**Body**:
```json
{
  "fullname": "New Admin",
  "email": "newadmin@ministry.com",
  "password": "securepassword",
  "country": "Global",
  "contact": "+1234567890",
  "address": "Admin Address"
}
```

## 📊 Key Features

### 🏠 Welcome Page
- **Professional Slideshow**: 4 stunning images depicting Heaven's glory
- **Auto-rotation**: Images change every 5 seconds
- **Manual Navigation**: Left/right arrows and slide indicators
- **Responsive Design**: Optimized for all device sizes
- **Call-to-Action**: Clear registration and login buttons

### 📝 Report Management
**Comprehensive Report Submission**:
- Date and basic information (name, country, church)
- Evangelism activities (hours, people reached, contacts)
- Bible study metrics (sessions, attendants, newcomers)
- Spiritual life tracking (meditation, prayer, services)
- Content creation (sermons listened, articles written)
- Physical wellness (exercise time)
- Reflections and spiritual growth
- Prayer requests and thanksgiving
- File attachments support
- **Edit Your Reports**: Members can edit their own submitted reports

**Report Viewing**:
- Daily, weekly, and monthly filters
- Expandable report cards with full details
- Country-based filtering (Admin only)
- Pagination (5 reports per page)
- Beautiful gradient UI with icons

### 📈 Analytics Dashboard
**Performance Metrics**:
- Total members and reports count
- Average completion rate across team
- Top streak tracker
- Expected vs actual reporting days

**Member Performance Tables**:
- Top performers leaderboard
- Members needing attention (< 70% completion)
- All members statistics with completion rates
- Current streak tracking
- Last report date
- Color-coded performance indicators:
  - 🟢 Green: 90%+ (Excellent)
  - 🟡 Yellow: 70-89% (Good)
  - 🔴 Red: < 70% (Needs Attention)

**Country Statistics** (Admin Only):
- Average completion rate by country
- Member count per country
- Ranked by performance

**Time Range Selection**:
- Last 7 days (Week)
- Last 30 days (Month)
- Last 365 days (Year)

### 📄 Export Functionality
**PDF Export**:
- Multi-page professional format
- Complete report details with all fields
- Color-coded sections (Evangelism, Bible Study, Spiritual Life)
- User information (name, country, church)
- Proper formatting and layout
- Timestamped filenames

**Excel Export**:
- 24 comprehensive columns
- Styled headers with brand colors
- Alternating row colors for readability
- Borders and proper formatting
- All report fields included
- Text wrapping for long content
- Timestamped filenames

**Export Locations**:
- Dashboard: Quick access buttons
- ViewReports: Filter-aware exports
- Analytics: Performance data exports

**Filters Applied to Exports**:
- Date ranges (daily/weekly/monthly)
- Country filtering (Admin)
- User-based filtering (Leaders see their country only)

### 👨‍👩‍👧‍👦 Member Management
**Admin Features**:
- View all members across countries
- Edit member details
- Delete members
- Modal popup forms for add/edit
- Country and role filters
- Pagination (5 members per page)

**Leader Features**:
- View members from their country
- Add members (auto-assigned to leader's country)
- Country field is read-only and pre-filled
- View-only access (no edit/delete)

**Member Features**:
- Personal profile editing
- Upload profile image
- Update contact information
- Change password

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on phones, tablets, and desktops
- **Gradient Backgrounds**: Professional indigo-purple theme
- **Smooth Animations**: Fade-ins, transitions, hover effects
- **Icon-Rich Interface**: Visual clarity with React Icons
- **Card-Based Layout**: Clean, modern component design
- **Loading States**: Spinner animations during data fetching
- **Empty States**: Helpful messages when no data exists
- **Form Validation**: Real-time feedback on inputs
- **Toast Notifications**: Success/error messages
- **Modal Dialogs**: Non-intrusive popups for forms

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register          - Register new user
POST /api/auth/login             - User login
POST /api/auth/create-admin      - Create admin (admin only)
```

### Reports
```
GET    /api/reports              - Get reports (filtered by role)
POST   /api/reports              - Create new report
GET    /api/reports/:id          - Get specific report
PUT    /api/reports/:id          - Update report (owner only)
GET    /api/reports/export/pdf   - Export reports to PDF
GET    /api/reports/export/excel - Export reports to Excel
GET    /api/reports/analytics    - Get analytics data
```

### Users
```
GET    /api/users                - Get all users (admin/leader)
PUT    /api/users/:id            - Update user
DELETE /api/users/:id            - Delete user (admin only)
GET    /api/users/profile        - Get current user profile
PUT    /api/users/profile        - Update profile
POST   /api/users/upload-profile - Upload profile image
```

## 📁 Project Structure

```
ministry-report-system/
├── client/                      # React Frontend
│   ├── public/
│   │   └── images/             # Slideshow images
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Reusable components
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   └── Input.jsx
│   │   │   └── layout/         # Layout components
│   │   │       ├── Layout.jsx
│   │   │       ├── Navbar.jsx
│   │   │       └── Sidebar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Authentication state
│   │   ├── pages/
│   │   │   ├── Welcome.jsx     # Landing page with slideshow
│   │   │   ├── Login.jsx       # Login page
│   │   │   ├── Register.jsx    # Registration page
│   │   │   ├── Dashboard.jsx   # Main dashboard
│   │   │   ├── ReportForm.jsx  # Submit/Edit reports
│   │   │   ├── ViewReports.jsx # View all reports
│   │   │   ├── Analytics.jsx   # Performance analytics
│   │   │   ├── Members.jsx     # Member management
│   │   │   └── Settings.jsx    # User settings
│   │   ├── App.jsx             # Main app component
│   │   ├── index.css           # Global styles
│   │   └── index.jsx           # Entry point
│   ├── package.json
│   ├── tailwind.config.cjs     # Tailwind configuration
│   └── vite.config.js          # Vite configuration
│
├── server/                      # Node.js Backend
│   ├── config/
│   │   └── db.js               # Database connection
│   ├── controllers/
│   │   ├── authController.js   # Authentication logic
│   │   ├── reportController.js # Report CRUD & exports
│   │   └── userController.js   # User management
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   ├── authMiddleware.js   # Role-based access
│   │   └── upload.js           # File upload (Multer)
│   ├── models/
│   │   ├── User.js             # User model
│   │   ├── Report.js           # Report model
│   │   └── Attachment.js       # Attachment model
│   ├── routes/
│   │   ├── authRoutes.js       # Auth endpoints
│   │   ├── reportRoutes.js     # Report endpoints
│   │   └── userRoutes.js       # User endpoints
│   ├── uploads/                # Uploaded files storage
│   ├── .env                    # Environment variables
│   ├── index.js                # Server entry point
│   ├── seedAdmin.js            # Admin account seeder
│   └── package.json
│
└── README.md                    # This file
```

## 🔧 Environment Variables

### Server (.env)
```env

### Frontend
- React 19
- React Router v7
- Tailwind CSS v4
- Axios
- React Icons

### Backend
- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- bcrypt
- JWT
- Multer (file uploads)

---

## 🔧 Troubleshooting

### Database Connection Error
```
Error: password authentication failed for user "postgres"
```
**Solution:** Update the PostgreSQL password or change `DB_PASS` in `.env`

### Tailwind CSS Error
```
PostCSS plugin error
```
**Solution:** Already fixed! Using `@tailwindcss/postcss` package

### Port Already in Use
```
Error: Port 5000 is already in use
```
**Solution:** Change `PORT` in `.env` or stop the process using port 5000

---

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register leader/member
- `POST /api/auth/register/verify-otp` - Verify email and create member account
- `POST /api/auth/register/resend-otp` - Resend account verification code
- `POST /api/auth/register-admin` - Register admin (requires secret key)
- `POST /api/auth/login` - Login
- `POST /api/auth/password-reset/request-otp` - Email a password-reset code
- `POST /api/auth/password-reset/resend-otp` - Resend password-reset code
- `POST /api/auth/password-reset/verify-otp` - Verify code and set a new password
- `POST /api/users/admin-reset-password/request-otp` - Admin-only; email a code to the selected user's registered address
- `POST /api/users/admin-reset-password` - Admin-only; verify the emailed code and change that user's password
- `POST /api/email/brevo-webhook` - Optional, secret-protected Brevo delivery-status webhook
## 🔧 Environment Variables

### Server (.env)
```env
DB_NAME=ministry_db
DB_USER=postgres
DB_PASS=fred123
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=generate_a_long_random_secret
PORT=5000
ADMIN_SECRET_KEY=generate_a_different_long_random_secret
```

## 🚨 Troubleshooting

### Database Connection Issues
**Problem**: Cannot connect to PostgreSQL

**Solutions**:
1. Verify PostgreSQL is running
2. Check database exists: `psql -U postgres -l`
3. Verify credentials in `.env` file

### Port Already in Use
**Problem**: Port 5000 or 3000 already in use

**Solution** (Windows):
```bash
netstat -ano | findstr :5000
taskkill /PID <process_id> /F
```

### JWT Token Errors
**Solutions**:
1. Clear browser localStorage
2. Re-login to get fresh token
3. Verify JWT_SECRET in `.env`

### Export Not Working
**Solutions**:
1. Verify you're logged in
2. Check browser console for errors
3. Ensure backend server is running

## 📱 Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 🎯 Usage Guide

### For Admins
1. Login with admin credentials
2. Navigate to Members page to manage users
3. Use Dashboard to view all reports
4. Access Analytics for system-wide metrics
5. Export reports as needed
6. Create new admin accounts via Settings

### For Leaders
1. Register or login with leader credentials
2. Submit daily reports via Dashboard
3. View team reports in ViewReports
4. Monitor team performance in Analytics
5. Add new members to your country

### For Members
1. Register with member role
2. Submit daily ministry reports
3. Track your personal statistics
4. Edit your submitted reports
5. Export your reports

## 🔒 Security Features

- Password Hashing with Bcrypt
- JWT Authentication
- Role-Based Access Control
- Input Validation
- SQL Injection Prevention (Sequelize ORM)
- XSS Protection (React)
- File Upload Security
- CORS Configuration

## 🔒 Security Notes

1. **Change default credentials** in production
2. **Keep `.env` files secret** - never commit to git
3. **Use strong passwords** for database and JWT
4. **Change ADMIN_SECRET_KEY** before deployment
5. **Enable HTTPS** in production

---

## 📞 Support

For technical support or questions:
- **Email**: support@ministry.com
- **Documentation**: See this README.md
- **Issues**: Check Troubleshooting section

## 🎉 Acknowledgments

- Built with React and Node.js
- UI powered by Tailwind CSS
- Icons from React Icons
- Database by PostgreSQL
- Export functionality using PDFKit and ExcelJS

---

**Ministry Report System v1.0** - Empowering ministries worldwide with efficient reporting and analytics 🙏✨
