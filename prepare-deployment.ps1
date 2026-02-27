# Ministry Report System - cPanel Deployment Preparation
# Run this on Windows PowerShell before uploading to cPanel

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Ministry Report System - cPanel Preparation" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create deployment package directories
Write-Host "Step 1: Creating deployment directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "deployment_package\backend" | Out-Null
New-Item -ItemType Directory -Force -Path "deployment_package\frontend" | Out-Null
New-Item -ItemType Directory -Force -Path "deployment_package\database" | Out-Null
New-Item -ItemType Directory -Force -Path "deployment_package\backend\uploads" | Out-Null
New-Item -ItemType Directory -Force -Path "deployment_package\backend\logs" | Out-Null

# Step 2: Copy backend files
Write-Host "Step 2: Copying backend files..." -ForegroundColor Yellow
Copy-Item -Path "server\config" -Destination "deployment_package\backend\" -Recurse -Force
Copy-Item -Path "server\controllers" -Destination "deployment_package\backend\" -Recurse -Force
Copy-Item -Path "server\middleware" -Destination "deployment_package\backend\" -Recurse -Force
Copy-Item -Path "server\models" -Destination "deployment_package\backend\" -Recurse -Force
Copy-Item -Path "server\routes" -Destination "deployment_package\backend\" -Recurse -Force
Copy-Item -Path "server\scripts" -Destination "deployment_package\backend\" -Recurse -Force
Copy-Item -Path "server\index.js" -Destination "deployment_package\backend\" -Force
Copy-Item -Path "server\package.json" -Destination "deployment_package\backend\" -Force
Copy-Item -Path "server\.env.production" -Destination "deployment_package\backend\" -Force
Copy-Item -Path "server\ecosystem.config.js" -Destination "deployment_package\backend\" -Force
Copy-Item -Path "server\backup-database.sh" -Destination "deployment_package\backend\" -Force
Copy-Item -Path "server\.htaccess" -Destination "deployment_package\backend\" -Force

# Step 3: Copy database files
Write-Host "Step 3: Copying database files..." -ForegroundColor Yellow
Copy-Item -Path "server\scripts\mysql_schema_sequelize.sql" -Destination "deployment_package\database\" -Force

# Step 4: Copy frontend source files (build on cPanel)
Write-Host "Step 4: Copying frontend source files..." -ForegroundColor Yellow
Write-Host "   (Build will be done on cPanel)" -ForegroundColor Gray
Copy-Item -Path "client\src" -Destination "deployment_package\frontend\" -Recurse -Force
Copy-Item -Path "client\public" -Destination "deployment_package\frontend\" -Recurse -Force
Copy-Item -Path "client\index.html" -Destination "deployment_package\frontend\" -Force
Copy-Item -Path "client\package.json" -Destination "deployment_package\frontend\" -Force
Copy-Item -Path "client\vite.config.js" -Destination "deployment_package\frontend\" -Force
Copy-Item -Path "client\postcss.config.cjs" -Destination "deployment_package\frontend\" -Force
Copy-Item -Path "client\tailwind.config.cjs" -Destination "deployment_package\frontend\" -Force
Copy-Item -Path "client\.htaccess" -Destination "deployment_package\frontend\" -Force
Copy-Item -Path "client\.env.production.local" -Destination "deployment_package\frontend\" -Force

# Step 5: Create README
Write-Host "Step 5: Creating deployment instructions..." -ForegroundColor Yellow
@"
MINISTRY REPORT SYSTEM - DEPLOYMENT PACKAGE
===========================================

This package contains everything you need to deploy to cPanel.

STRUCTURE:
----------
deployment_package/
├── backend/          → Upload to ~/ministry-backend/
├── frontend/         → Upload to ~/public_html/
├── database/         → Import via phpMyAdmin
└── README.txt        → This file

DEPLOYMENT STEPS:
-----------------
1. Login to cPanel
2. Create MySQL database
3. Import database/mysql_schema_sequelize.sql via phpMyAdmin
4. Upload backend/ folder to ~/ministry-backend/
5. Upload frontend/ folder to ~/ministry-frontend/
6. SSH into cPanel and run:
   cd ~/ministry-backend && npm install --production
   cd ~/ministry-frontend && npm install && npm run build
   cp -R dist/* ~/public_html/
   cp .htaccess ~/public_html/
7. Edit ~/ministry-backend/.env.production → rename to .env
8. Update .env with your database credentials
9. Start Node.js application
10. Visit your domain!

DETAILED GUIDES:
----------------
See these files in your project root:
- CPANEL_QUICK_START.md (30-minute guide)
- CPANEL_DEPLOYMENT_GUIDE.md (complete guide)
- deployment-checklist.txt (step-by-step checklist)

BEFORE/AFTER UPLOADING:
-----------------------
Update these files:
1. backend/.env.production (rename to .env on cPanel)
   - DB_NAME, DB_USER, DB_PASS
   - CLIENT_URL (your domain)
   - Generate new JWT_SECRET and ADMIN_SECRET_KEY

2. frontend/.env.production.local
   - VITE_API_URL (https://report.gnitafrica.com/api)

3. Build frontend on cPanel:
   cd ~/ministry-frontend
   npm install
   npm run build
   cp -R dist/* ~/public_html/
   cp .htaccess ~/public_html/

FILES INCLUDED:
---------------
Backend (~source files):
- React source code
- Vite configuration
- Package.json
- Build will be done on cPanel
- .htaccess for routing included
Frontend (~built files):
- Optimized production build
- index.html
- JavaScript bundles
- CSS files
- Assets & images
- .htaccess for routing

Database:
- Complete MySQL schema
- All tables, views, triggers
- Admin user seed

CREDENTIALS:
------------
After deployment, login with:
Email: admin@ministry.com
Password: Admin@123

⚠️ IMPORTANT: Change this password immediately after first login!

NEED HELP?
----------
1. Check CPANEL_QUICK_START.md for quick setup
2. See CPANEL_DEPLOYMENT_GUIDE.md for detailed steps
3. Use deployment-checklist.txt to track progress
4. Contact your hosting provider for cPanel-specific issues

Good luck with your deployment! 🎉
"@ | Out-File -FilePath "deployment_package\README.txt" -Encoding UTF8

# Step 6: Create compressed archive
Write-Host "Step 6: Creating compressed archive..." -ForegroundColor Yellow
if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
    Compress-Archive -Path "deployment_package\*" -DestinationPath "ministry-report-cpanel.zip" -Force
    Write-Host "   ✓ Created: ministry-report-cpanel.zip" -ForegroundColor Green
} else {
    Write-Host "   Note: Install 7-Zip to create .zip file" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  ✅ Preparation Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Created files:" -ForegroundColor White
Write-Host "  ✓ deployment_package\ (folder with all files)" -ForegroundColor Green
if (Test-Path "ministry-report-cpanel.zip") {
    Write-Host "  ✓ ministry-report-cpanel.zip (compressed)" -ForegroundColor Green
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review deployment_package\ contents"
Write-Host "  2. Update .env files with your credentials:"
Write-Host "     - deployment_package\backend\.env.production"
Write-Host "     - deployment_package\frontend\.env.production.local"
Write-Host "  3. Upload to cPanel via File Manager or FTP"
Write-Host "  4. Follow CPANEL_QUICK_START.md"
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  📖 CPANEL_QUICK_START.md - Quick setup (30 min)"
Write-Host "  📖 CPANEL_DEPLOYMENT_GUIDE.md - Complete guide"
Write-Host "  📋 deployment-checklist.txt - Step-by-step checklist"
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Open deployment folder
Write-Host "Opening deployment folder..." -ForegroundColor Gray
Start-Process "deployment_package"
