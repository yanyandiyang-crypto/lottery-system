const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Clean and Restore Database Script');
console.log('=====================================');

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

async function runCommand(command, description) {
    try {
        console.log(`\n🔄 ${description}...`);
        console.log(`Command: ${command}`);
        
        const result = execSync(command, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        
        console.log(`✅ ${description} completed successfully`);
        if (result.trim()) {
            console.log(`Output: ${result.trim()}`);
        }
        return true;
    } catch (error) {
        console.error(`❌ ${description} failed:`);
        console.error(error.message);
        return false;
    }
}

async function main() {
    console.log('\n🚀 Starting clean and restore process...');
    
    // Step 1: Clean the database completely
    const cleanCommand = `psql "${RENDER_DB_URL}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO lottery_db_nqw0_user; GRANT ALL ON SCHEMA public TO public;"`;
    
    const cleanSuccess = await runCommand(cleanCommand, 'Cleaning Render database');
    
    if (!cleanSuccess) {
        console.error('❌ Failed to clean database. Stopping process.');
        return;
    }
    
    // Step 2: Restore from SQL file
    let restoreCommand;
    
    if (backupFile.endsWith('.backup')) {
        // For .backup files, use pg_restore
        restoreCommand = `pg_restore --verbose --no-owner --no-privileges --disable-triggers "${RENDER_DB_URL}" "${backupFile}"`;
    } else {
        // For .sql files, use psql
        restoreCommand = `psql "${RENDER_DB_URL}" -f "${backupFile}"`;
    }
    
    const restoreSuccess = await runCommand(restoreCommand, 'Restoring database from backup');
    
    if (!restoreSuccess) {
        console.error('❌ Failed to restore database. Stopping process.');
        return;
    }
    
    console.log('\n🎉 Database restore completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: node verify-data-migration.js');
    console.log('2. Run: node test-render-connection.js');
    console.log('3. Test frontend: https://lottery-system-gamma.vercel.app');
}

main().catch(console.error);
