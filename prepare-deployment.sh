#!/bin/bash
# Pre-Deployment Preparation Script
# Run this on your local machine before uploading to cPanel

echo "================================================"
echo "  Ministry Report System - cPanel Preparation"
echo "================================================"
echo ""

# Step 1: Create deployment package directories
echo "Step 1: Creating deployment directories..."
mkdir -p deployment_package/backend
mkdir -p deployment_package/frontend
mkdir -p deployment_package/database

# Step 2: Copy backend files
echo "Step 2: Copying backend files..."
cd server
cp -R config controllers middleware models routes scripts uploads \
   ../deployment_package/backend/
cp index.js package.json .env.production ecosystem.config.js \
   backup-database.sh .htaccess \
   ../deployment_package/backend/
cd ..

# Step 3: Copy database files
echo "Step 3: Copying database files..."
cp server/scripts/mysql_schema_sequelize.sql deployment_package/database/

# Step 4: Copy frontend source files (build on cPanel)
echo "Step 4: Copying frontend source files..."
echo "   (Build will be done on cPanel)"
cp -R client/src client/public deployment_package/frontend/
cp client/index.html client/package.json client/vite.config.js \
   client/postcss.config.cjs client/tailwind.config.cjs \
   client/.htaccess client/.env.production.local \
   deployment_package/frontend/

# Step 5: Create README for deployment package
echo "Step 5: Creating deployment instructions..."
cat > deployment_package/README.txt << 'EOF'
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
1. Create MySQL database in cPanel
2. Import database/mysql_schema_sequelize.sql via phpMyAdmin
3. Upload backend/ folder to ~/ministry-backend/
4. Upload frontend/ folder to ~/public_html/
5. Edit backend/.env.production with your database credentials
6. Start Node.js application in cPanel
7. Visit your domain!

For detailed instructions, see:
- CPANEL_QUICK_START.md (quick guide)
- CPANEL_DEPLOYMENT_GUIDE.md (full guide)
- deployment-checklist.txt (checklist)

IMPORTANT:
----------
Before uploading, update these files:
- backend/.env.production → Your database credentials
- frontend/.env.production.local → Your domain

Need help? See CPANEL_DEPLOYMENT_GUIDE.md
EOF

# Step 6: Create compressed archive
echo "Step 6: Creating compressed archive..."
tar -czf ministry-report-cpanel.tar.gz deployment_package/

echo ""
echo "================================================"
echo "  ✅ Preparation Complete!"
echo "================================================"
echo ""
echo "Created files:"
echo "  - deployment_package/ (folder)"
echo "  - ministry-report-cpanel.tar.gz (compressed)"
echo ""
echo "Next steps:"
echo "  1. Review deployment_package/ contents"
echo "  2. Update .env files with your credentials"
echo "  3. Upload to cPanel"
echo "  4. Follow CPANEL_QUICK_START.md"
echo ""
echo "================================================"
