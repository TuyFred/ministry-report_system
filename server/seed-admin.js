require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize } = require('./config/db');
const User = require('./models/User');

const seedAdmin = async () => {
    try {
        console.log('🌱 Seeding admin user...\n');

        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connected');

        // Sync models
        await sequelize.sync();
        console.log('✅ Database synced\n');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ where: { email: 'admin@gmail.com' } });
        
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log('   Email: admin@gmail.com');
            console.log('   Role:', existingAdmin.role);
            
            // Update to admin if not already
            if (existingAdmin.role !== 'admin') {
                existingAdmin.role = 'admin';
                await existingAdmin.save();
                console.log('✅ Updated existing user to admin role');
            }
            
            process.exit(0);
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123@', salt);

        // Create admin user
        const admin = await User.create({
            fullname: 'System Administrator',
            email: 'admin@gmail.com',
            password: hashedPassword,
            role: 'admin',
            country: 'Global',
            contact: '+1234567890',
            address: 'System Admin'
        });

        console.log('🎉 Admin user created successfully!\n');
        console.log('═══════════════════════════════════════');
        console.log('📧 Email:    admin@gmail.com');
        console.log('🔑 Password: admin123@');
        console.log('👤 Role:     admin');
        console.log('═══════════════════════════════════════\n');
        console.log('✅ You can now login at:');
        console.log('   https://ministry-report-system.vercel.app\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding admin:', error.message);
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();