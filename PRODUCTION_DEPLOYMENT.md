# 🚀 Production Deployment Guide

## Live URLs

- **Frontend (Vercel)**: https://ministry-report-system.vercel.app
- **Backend (Render)**: https://ministry-report-system.onrender.com

## 📋 Deployment Configuration

### ✅ Frontend - Vercel

**Deployment Status**: Deployed ✓

**Environment Variables Required**:
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `ministry-report-system`
3. Settings → Environment Variables
4. Add:
   ```
   VITE_API_URL=https://ministry-report-system.onrender.com
   ```
5. Redeploy after adding

**Auto-Detection**:
The frontend automatically detects production environment and uses the Render backend URL.

**Build Configuration**:
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`
- Root Directory: `client`

---

### ✅ Backend - Render

**Deployment Status**: Needs Configuration ⚠️

**Environment Variables Required** (Set in Render Dashboard):

1. **DATABASE_URL** (Required)
   - Get from: Render PostgreSQL Database → Internal Database URL
   - Format: `postgresql://user:password@host:5432/database`
   - Example: `postgresql://ministry_user:abc123@dpg-xxxxx.oregon-postgres.render.com/ministry_db`

2. **JWT_SECRET** (Required)
   - Your secret key for JWT tokens
   - Example: `my-super-secret-jwt-key-2025`
   - Generate secure key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. **CLIENT_URL** (Optional - already in code)
   - Value: `https://ministry-report-system.vercel.app`

**Service Configuration**:
- Environment: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Root Directory: `server`
- Node Version: 22.x or higher

---

## 🔧 Setup Steps

### 1. Backend Setup (Render)

#### A. Create PostgreSQL Database
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Configure:
   - Name: `ministry-db`
   - Database: `ministry_db`
   - User: (auto-generated)
   - Region: Oregon (US West)
   - Plan: Free
4. Click "Create Database"
5. **Copy the "Internal Database URL"**

#### B. Configure Web Service
1. Go to your web service: `ministry-report-system`
2. Click "Environment" tab
3. Add Environment Variables:
   ```
   DATABASE_URL=<paste-internal-database-url-here>
   JWT_SECRET=<your-secret-key-here>
   ```
4. Click "Save Changes"
5. Render will automatically redeploy

#### C. Verify Deployment
- Visit: https://ministry-report-system.onrender.com
- You should see: "Ministry Reporting System API"
- Health check: https://ministry-report-system.onrender.com/api/health
- Should return: `{"status":"ok","db":"connected"}`

---

### 2. Frontend Setup (Vercel)

#### A. Environment Variables (Optional but Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select project: `ministry-report-system`
3. Settings → Environment Variables
4. Add:
   ```
   VITE_API_URL=https://ministry-report-system.onrender.com
   ```
5. Select all environments: Production, Preview, Development

#### B. Redeploy
1. Go to "Deployments" tab
2. Click "..." on latest deployment
3. Click "Redeploy"

OR:
```bash
git push origin main
```
Vercel will auto-deploy on push.

---

## 🌍 Global Access

Your application is now accessible worldwide at:
- **https://ministry-report-system.vercel.app**

Anyone can:
✅ Register an account (as member)
✅ Submit daily reports
✅ View their own reports
✅ Export reports (PDF/Excel)
✅ Generate weekly/monthly summaries

Admin features:
✅ View all reports
✅ Manage users
✅ Change user roles
✅ View analytics

---

## 🔒 Security Features

✅ **CORS Protection**: Only allows requests from verified domains
✅ **JWT Authentication**: Secure token-based authentication
✅ **SSL/HTTPS**: All connections encrypted
✅ **Database SSL**: PostgreSQL connections use SSL
✅ **Environment Variables**: Secrets stored securely
✅ **Role-based Access**: Member, Leader, Admin roles

---

## 🧪 Testing Production

### Test Registration:
1. Visit: https://ministry-report-system.vercel.app
2. Click "Register"
3. Fill in details (will be created as member)
4. Verify you can log in

### Test Report Submission:
1. Log in
2. Click "Submit Report"
3. Fill in daily ministry report
4. Submit and verify it appears in dashboard

### Test Export:
1. Go to Dashboard
2. Scroll to "Export Reports"
3. Select "Today"
4. Click "Export PDF" or "Export Excel"
5. Verify file downloads correctly

---

## 📊 Monitoring

### Backend Health
- URL: https://ministry-report-system.onrender.com/api/health
- Expected: `{"status":"ok","db":"connected"}`

### Frontend Status
- URL: https://ministry-report-system.vercel.app
- Should load login page

### Logs
- **Render Logs**: Dashboard → Your Service → Logs
- **Vercel Logs**: Dashboard → Your Project → Deployments → View Logs

---

## 🚨 Troubleshooting

### Backend Issues

**"Unable to connect to database"**
- Check DATABASE_URL is set correctly
- Verify PostgreSQL database is running
- Check database credentials

**"CORS Error"**
- Verify CLIENT_URL is set
- Check frontend URL matches Vercel deployment

### Frontend Issues

**"Failed to fetch" / "Network Error"**
- Check backend is running: https://ministry-report-system.onrender.com
- Verify VITE_API_URL is set correctly
- Check browser console for errors

**"Files downloading as .txt"**
- Clear browser cache (Ctrl + Shift + Delete)
- Hard refresh (Ctrl + Shift + R)

---

## 🔄 Deployment Pipeline

### Automatic Deployments

**When you push to GitHub:**
1. ✅ Vercel automatically builds and deploys frontend
2. ✅ Render automatically builds and deploys backend

**Manual Deploy:**
- Vercel: Dashboard → Deployments → Redeploy
- Render: Dashboard → Manual Deploy → Deploy latest commit

---

## ✨ Features Available Globally

✅ User Registration & Authentication
✅ Daily Ministry Report Submission
✅ Weekend Reports (different form)
✅ Weekly Report Summary (auto-aggregates daily reports)
✅ Monthly Report Summary (auto-aggregates daily reports)
✅ PDF Export (all date ranges)
✅ Excel Export (all date ranges)
✅ Profile Management
✅ User Role Management (Admin)
✅ Country-based Leader Restrictions (max 2 per country)
✅ Responsive Design (mobile-friendly)
✅ Real-time Statistics Dashboard

---

## 📱 Mobile Access

The application is fully responsive and works on:
- ✅ Desktop (Windows, Mac, Linux)
- ✅ Mobile (iOS, Android)
- ✅ Tablet (iPad, Android tablets)
- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)

---

## 🎉 Your System is Live!

Anyone in the world can now access your ministry reporting system at:
**https://ministry-report-system.vercel.app**

Just make sure to:
1. Set DATABASE_URL on Render
2. Set JWT_SECRET on Render
3. Verify both services are running

Then your system will be fully operational globally! 🌍
