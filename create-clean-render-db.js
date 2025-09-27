const { PrismaClient } = require('@prisma/client');

console.log('🧹 Creating Clean Render Database');
console.log('=================================');

// You'll need to create a new database on Render first
// This script will help you set it up properly

console.log('📋 Steps to create a clean Render database:');
console.log('==========================================');
console.log('');
console.log('1. 🌐 Go to Render Dashboard: https://dashboard.render.com');
console.log('2. 📊 Click "New +" → "PostgreSQL"');
console.log('3. 📝 Fill in details:');
console.log('   - Name: lottery-system-clean');
console.log('   - Database: lottery_db_clean');
console.log('   - User: lottery_user_clean');
console.log('   - Region: Oregon (US West)');
console.log('4. 💰 Choose Free plan');
console.log('5. 🚀 Click "Create Database"');
console.log('');
console.log('📋 After creation, you\'ll get new credentials like:');
console.log('postgresql://username:password@host:port/database');
console.log('');
console.log('🔄 Then run this script again with the new URL');
console.log('');
console.log('💡 Alternative: Delete current database and recreate');
console.log('   - Go to current database settings');
console.log('   - Click "Delete Database"');
console.log('   - Create new one with same name');

// Check if we have a database URL to work with
const NEW_DB_URL = process.env.NEW_RENDER_DB_URL;

if (NEW_DB_URL) {
    console.log('\n🔗 Setting up database with provided URL...');
    setupCleanDatabase(NEW_DB_URL);
} else {
    console.log('\n⚠️ No NEW_RENDER_DB_URL provided');
    console.log('💡 Set environment variable: set NEW_RENDER_DB_URL=your_new_url');
    console.log('🔄 Then run: node create-clean-render-db.js');
}

async function setupCleanDatabase(dbUrl) {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: dbUrl
            }
        }
    });

    try {
        console.log('🔗 Connecting to clean database...');
        await prisma.$connect();
        console.log('✅ Connected successfully');
        
        console.log('\n🔄 Applying clean Prisma schema...');
        
        // Set environment variable for Prisma commands
        process.env.DATABASE_URL = dbUrl;
        
        const { execSync } = require('child_process');
        
        // Force reset and push schema
        execSync('npx prisma db push --force-reset', { 
            stdio: 'inherit',
            cwd: __dirname 
        });
        
        console.log('✅ Clean schema applied successfully');
        
        console.log('\n🎉 Clean database is ready!');
        console.log('\n📋 Next steps:');
        console.log('1. Use pgAdmin4 to restore NEW27back.sql');
        console.log('2. Update Render backend DATABASE_URL');
        console.log('3. Redeploy backend service');
        console.log('4. Test frontend connection');
        
    } catch (error) {
        console.error('❌ Error setting up clean database:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}
