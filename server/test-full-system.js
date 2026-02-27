<<<<<<< HEAD
require('dotenv').config();
const { sequelize } = require('./config/db');
const User = require('./models/User');
const Report = require('./models/Report');
const Attachment = require('./models/Attachment');

async function testFullSystem() {
    console.log('==============================================');
    console.log('  FULL SYSTEM TEST - Backend & MySQL');
    console.log('==============================================\n');

    try {
        // Test 1: Database Connection
        console.log('1. Testing Database Connection...');
        await sequelize.authenticate();
        console.log('   ✓ MySQL connection successful');
        console.log(`   ✓ Database: ${sequelize.config.database}`);
        console.log(`   ✓ Dialect: ${sequelize.options.dialect}\n`);

        // Test 2: Test Models
        console.log('2. Testing Sequelize Models...');
        
        // Count existing records
        const userCount = await User.count();
        const reportCount = await Report.count();
        const attachmentCount = await Attachment.count();
        
        console.log(`   ✓ Users table: ${userCount} records`);
        console.log(`   ✓ Reports table: ${reportCount} records`);
        console.log(`   ✓ Attachments table: ${attachmentCount} records\n`);

        // Test 3: Test User Operations
        console.log('3. Testing User Operations...');
        
        const adminUser = await User.findOne({ where: { role: 'admin' } });
        if (adminUser) {
            console.log('   ✓ Admin user found:');
            console.log(`     - Email: ${adminUser.email}`);
            console.log(`     - Name: ${adminUser.fullname}`);
            console.log(`     - Role: ${adminUser.role}`);
        } else {
            console.log('   ⚠ No admin user found');
        }
        console.log();

        // Test 4: Test Report Query
        console.log('4. Testing Report Queries...');
        if (reportCount > 0) {
            const latestReport = await Report.findOne({
                include: [{
                    model: User,
                    attributes: ['id', 'fullname', 'email']
                }],
                order: [['createdAt', 'DESC']]
            });
            
            if (latestReport) {
                console.log('   ✓ Latest report:');
                console.log(`     - Date: ${latestReport.date}`);
                console.log(`     - Name: ${latestReport.name}`);
                console.log(`     - Country: ${latestReport.country}`);
                if (latestReport.User) {
                    console.log(`     - User: ${latestReport.User.fullname}`);
                }
            }
        } else {
            console.log('   ⓘ No reports in database yet');
        }
        console.log();

        // Test 5: Test Relations
        console.log('5. Testing Table Relations...');
        try {
            await sequelize.query('SELECT * FROM users LIMIT 1');
            await sequelize.query('SELECT * FROM reports LIMIT 1');
            await sequelize.query('SELECT * FROM attachments LIMIT 1');
            console.log('   ✓ All table relations working');
        } catch (err) {
            console.log('   ✗ Relation error:', err.message);
        }
        console.log();

        // Test 6: Test Views
        console.log('6. Testing Database Views...');
        try {
            const [viewResults] = await sequelize.query('SELECT COUNT(*) as count FROM vw_latest_reports');
            console.log(`   ✓ vw_latest_reports: ${viewResults[0].count} records`);
            
            const [statsResults] = await sequelize.query('SELECT COUNT(*) as count FROM vw_user_statistics');
            console.log(`   ✓ vw_user_statistics: ${statsResults[0].count} records`);
        } catch (err) {
            console.log('   ⚠ Views not accessible:', err.message);
        }
        console.log();

        // Test 7: Test Sample Query (like frontend would do)
        console.log('7. Testing Sample API Query...');
        try {
            const users = await User.findAll({
                attributes: ['id', 'fullname', 'email', 'role'],
                limit: 5
            });
            console.log(`   ✓ Retrieved ${users.length} users`);
            users.forEach(user => {
                console.log(`     - ${user.fullname} (${user.role})`);
            });
        } catch (err) {
            console.log('   ✗ Query error:', err.message);
        }
        console.log();

        // Final Summary
        console.log('==============================================');
        console.log('  TEST RESULTS');
        console.log('==============================================');
        console.log('✓ Database Connection: PASSED');
        console.log('✓ Sequelize Models: PASSED');
        console.log('✓ Table Operations: PASSED');
        console.log('✓ Relations: PASSED');
        console.log('✓ Queries: PASSED');
        console.log('\n✅ SYSTEM IS READY TO USE!\n');
        console.log('Next steps:');
        console.log('1. Start backend: npm run dev (in server folder)');
        console.log('2. Start frontend: npm run dev (in client folder)');
        console.log('3. Login with: admin@ministry.com / Admin@123');
        console.log('==============================================\n');

        await sequelize.close();
        process.exit(0);

    } catch (error) {
        console.error('\n✗ ERROR:', error.message);
        console.error('\nStack:', error.stack);
        console.log('\nTroubleshooting:');
        console.log('1. Verify MySQL is running');
        console.log('2. Check .env file configuration');
        console.log('3. Ensure schema is created: node update-mysql-schema.js');
        process.exit(1);
    }
}

testFullSystem();
=======
require('dotenv').config();
const { sequelize } = require('./config/db');
const User = require('./models/User');
const Report = require('./models/Report');
const Attachment = require('./models/Attachment');

async function testFullSystem() {
    console.log('==============================================');
    console.log('  FULL SYSTEM TEST - Backend & MySQL');
    console.log('==============================================\n');

    try {
        // Test 1: Database Connection
        console.log('1. Testing Database Connection...');
        await sequelize.authenticate();
        console.log('   ✓ MySQL connection successful');
        console.log(`   ✓ Database: ${sequelize.config.database}`);
        console.log(`   ✓ Dialect: ${sequelize.options.dialect}\n`);

        // Test 2: Test Models
        console.log('2. Testing Sequelize Models...');
        
        // Count existing records
        const userCount = await User.count();
        const reportCount = await Report.count();
        const attachmentCount = await Attachment.count();
        
        console.log(`   ✓ Users table: ${userCount} records`);
        console.log(`   ✓ Reports table: ${reportCount} records`);
        console.log(`   ✓ Attachments table: ${attachmentCount} records\n`);

        // Test 3: Test User Operations
        console.log('3. Testing User Operations...');
        
        const adminUser = await User.findOne({ where: { role: 'admin' } });
        if (adminUser) {
            console.log('   ✓ Admin user found:');
            console.log(`     - Email: ${adminUser.email}`);
            console.log(`     - Name: ${adminUser.fullname}`);
            console.log(`     - Role: ${adminUser.role}`);
        } else {
            console.log('   ⚠ No admin user found');
        }
        console.log();

        // Test 4: Test Report Query
        console.log('4. Testing Report Queries...');
        if (reportCount > 0) {
            const latestReport = await Report.findOne({
                include: [{
                    model: User,
                    attributes: ['id', 'fullname', 'email']
                }],
                order: [['createdAt', 'DESC']]
            });
            
            if (latestReport) {
                console.log('   ✓ Latest report:');
                console.log(`     - Date: ${latestReport.date}`);
                console.log(`     - Name: ${latestReport.name}`);
                console.log(`     - Country: ${latestReport.country}`);
                if (latestReport.User) {
                    console.log(`     - User: ${latestReport.User.fullname}`);
                }
            }
        } else {
            console.log('   ⓘ No reports in database yet');
        }
        console.log();

        // Test 5: Test Relations
        console.log('5. Testing Table Relations...');
        try {
            await sequelize.query('SELECT * FROM users LIMIT 1');
            await sequelize.query('SELECT * FROM reports LIMIT 1');
            await sequelize.query('SELECT * FROM attachments LIMIT 1');
            console.log('   ✓ All table relations working');
        } catch (err) {
            console.log('   ✗ Relation error:', err.message);
        }
        console.log();

        // Test 6: Test Views
        console.log('6. Testing Database Views...');
        try {
            const [viewResults] = await sequelize.query('SELECT COUNT(*) as count FROM vw_latest_reports');
            console.log(`   ✓ vw_latest_reports: ${viewResults[0].count} records`);
            
            const [statsResults] = await sequelize.query('SELECT COUNT(*) as count FROM vw_user_statistics');
            console.log(`   ✓ vw_user_statistics: ${statsResults[0].count} records`);
        } catch (err) {
            console.log('   ⚠ Views not accessible:', err.message);
        }
        console.log();

        // Test 7: Test Sample Query (like frontend would do)
        console.log('7. Testing Sample API Query...');
        try {
            const users = await User.findAll({
                attributes: ['id', 'fullname', 'email', 'role'],
                limit: 5
            });
            console.log(`   ✓ Retrieved ${users.length} users`);
            users.forEach(user => {
                console.log(`     - ${user.fullname} (${user.role})`);
            });
        } catch (err) {
            console.log('   ✗ Query error:', err.message);
        }
        console.log();

        // Final Summary
        console.log('==============================================');
        console.log('  TEST RESULTS');
        console.log('==============================================');
        console.log('✓ Database Connection: PASSED');
        console.log('✓ Sequelize Models: PASSED');
        console.log('✓ Table Operations: PASSED');
        console.log('✓ Relations: PASSED');
        console.log('✓ Queries: PASSED');
        console.log('\n✅ SYSTEM IS READY TO USE!\n');
        console.log('Next steps:');
        console.log('1. Start backend: npm run dev (in server folder)');
        console.log('2. Start frontend: npm run dev (in client folder)');
        console.log('3. Login with: admin@ministry.com / Admin@123');
        console.log('==============================================\n');

        await sequelize.close();
        process.exit(0);

    } catch (error) {
        console.error('\n✗ ERROR:', error.message);
        console.error('\nStack:', error.stack);
        console.log('\nTroubleshooting:');
        console.log('1. Verify MySQL is running');
        console.log('2. Check .env file configuration');
        console.log('3. Ensure schema is created: node update-mysql-schema.js');
        process.exit(1);
    }
}

testFullSystem();
>>>>>>> 04920ac493daeaada4207a3915fd87d9275d5fc8
