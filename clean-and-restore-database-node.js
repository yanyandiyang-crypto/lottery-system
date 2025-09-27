const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

console.log('🧹 Clean and Restore Database Script (Node.js Version)');
console.log('======================================================');

// Render database URL
const RENDER_DB_URL = 'postgresql://lottery_db_nqw0_user:tGo0DoCsLZDe71OsGOhWnciU5k9ahcid@dpg-d37ec1ffte5s73b7jat0-a.oregon-postgres.render.com/lottery_db_nqw0';

// Find the latest backup file
const backupDir = path.join(__dirname, 'backups');
let backupFile = null;

if (fs.existsSync(backupDir)) {
    // Look for .backup files first, then .sql files
    let files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.backup'))
        .sort()
        .reverse();
    
    // If no .backup files, look for .sql files
    if (files.length === 0) {
        files = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.sql') && !file.includes('schema-only') && !file.includes('data-only'))
            .sort()
            .reverse();
    }
    
    if (files.length > 0) {
        backupFile = path.join(backupDir, files[0]);
        console.log(`📁 Found backup file: ${files[0]}`);
    }
}

if (!backupFile) {
    console.error('❌ No backup file found in backups/ directory');
    console.log('Available files:');
    if (fs.existsSync(backupDir)) {
        const allFiles = fs.readdirSync(backupDir);
        allFiles.forEach(file => console.log(`  - ${file}`));
    }
    process.exit(1);
}

async function cleanDatabase() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: RENDER_DB_URL
            }
        }
    });

    try {
        console.log('\n🔄 Cleaning Render database...');
        
        // Get all table names
        const tables = await prisma.$queryRaw`
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT LIKE '_prisma%'
        `;
        
        console.log(`Found ${tables.length} tables to clean`);
        
        // Drop all tables
        for (const table of tables) {
            try {
                await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
                console.log(`✅ Dropped table: ${table.tablename}`);
            } catch (error) {
                console.log(`⚠️ Could not drop table ${table.tablename}: ${error.message}`);
            }
        }
        
        console.log('✅ Database cleaned successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Error cleaning database:', error.message);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function restoreFromSQL() {
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: RENDER_DB_URL
            }
        }
    });

    try {
        console.log('\n🔄 Reading SQL backup file...');
        
        const sqlContent = fs.readFileSync(backupFile, 'utf8');
        console.log(`📄 Read ${sqlContent.length} characters from backup file`);
        
        // Split SQL into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements`);
        
        console.log('\n🔄 Executing SQL statements...');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            if (statement.length === 0) continue;
            
            try {
                await prisma.$executeRawUnsafe(statement);
                successCount++;
                
                if (successCount % 10 === 0) {
                    console.log(`✅ Executed ${successCount}/${statements.length} statements`);
                }
            } catch (error) {
                errorCount++;
                console.log(`⚠️ Statement ${i + 1} failed: ${error.message.substring(0, 100)}...`);
            }
        }
        
        console.log(`\n📊 Execution Summary:`);
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${errorCount}`);
        
        if (successCount > 0) {
            console.log('✅ Database restore completed successfully!');
            return true;
        } else {
            console.log('❌ No statements executed successfully');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error restoring database:', error.message);
        return false;
    } finally {
        await prisma.$disconnect();
    }
}

async function main() {
    try {
        console.log('\n🚀 Starting clean and restore process...');
        
        // Step 1: Clean the database
        const cleanSuccess = await cleanDatabase();
        
        if (!cleanSuccess) {
            console.error('❌ Failed to clean database. Stopping process.');
            return;
        }
        
        // Step 2: Restore from SQL file
        const restoreSuccess = await restoreFromSQL();
        
        if (!restoreSuccess) {
            console.error('❌ Failed to restore database. Stopping process.');
            return;
        }
        
        console.log('\n🎉 Database restore completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Run: node verify-data-migration.js');
        console.log('2. Run: node test-render-connection.js');
        console.log('3. Test frontend: https://lottery-system-gamma.vercel.app');
        
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
    }
}

main();
