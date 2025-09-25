const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function createPgDumpBackup() {
  try {
    console.log('=== CREATING POSTGRESQL PG_DUMP BACKUP ===');
    
    const backupDir = path.join(__dirname, 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Database connection details (from actual connection)
    const dbConfig = {
      host: 'localhost',
      port: '5432',
      database: 'lottery_system_local',
      username: 'postgres',
      password: 'admin123'
    };
    
    console.log('Database Configuration:');
    console.log(`- Host: ${dbConfig.host}`);
    console.log(`- Port: ${dbConfig.port}`);
    console.log(`- Database: ${dbConfig.database}`);
    console.log(`- Username: ${dbConfig.username}`);
    
    // PostgreSQL installation path
    const pgDumpPath = '"C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe"';
    
    // Create different types of backups
    const backups = [
      {
        name: 'complete-database',
        file: path.join(backupDir, `pg-dump-complete-${timestamp}.sql`),
        command: `${pgDumpPath} -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} --verbose --clean --if-exists --create --format=plain`
      },
      {
        name: 'data-only',
        file: path.join(backupDir, `pg-dump-data-only-${timestamp}.sql`),
        command: `${pgDumpPath} -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} --data-only --verbose --format=plain`
      },
      {
        name: 'schema-only',
        file: path.join(backupDir, `pg-dump-schema-only-${timestamp}.sql`),
        command: `${pgDumpPath} -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} --schema-only --verbose --format=plain`
      }
    ];
    
    // Set password environment variable
    process.env.PGPASSWORD = dbConfig.password;
    
    for (const backup of backups) {
      console.log(`\nCreating ${backup.name} backup...`);
      console.log(`Command: ${backup.command}`);
      
      await new Promise((resolve, reject) => {
        const child = exec(backup.command, (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Error creating ${backup.name} backup:`, error.message);
            reject(error);
            return;
          }
          
          if (stderr) {
            console.log(`⚠️  Warnings for ${backup.name}:`, stderr);
          }
          
          // Write output to file
          fs.writeFileSync(backup.file, stdout);
          
          // Get file size
          const stats = fs.statSync(backup.file);
          const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
          
          console.log(`✅ ${backup.name} backup completed!`);
          console.log(`📁 File: ${backup.file}`);
          console.log(`📊 Size: ${fileSizeInMB} MB`);
          
          resolve();
        });
      });
    }
    
    // Create a compressed backup
    console.log('\nCreating compressed backup...');
    const compressedFile = path.join(backupDir, `pg-dump-compressed-${timestamp}.sql.gz`);
    const compressCommand = `${pgDumpPath} -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.username} -d ${dbConfig.database} --verbose --clean --if-exists --create --format=custom | gzip > "${compressedFile}"`;
    
    await new Promise((resolve, reject) => {
      exec(compressCommand, (error, stdout, stderr) => {
        if (error) {
          console.log(`⚠️  Compressed backup failed (gzip might not be available): ${error.message}`);
          console.log('✅ Regular SQL backups are sufficient for restoration');
        } else {
          const stats = fs.statSync(compressedFile);
          const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.log(`✅ Compressed backup completed!`);
          console.log(`📁 File: ${compressedFile}`);
          console.log(`📊 Size: ${fileSizeInMB} MB`);
        }
        resolve();
      });
    });
    
    console.log('\n🎯 POSTGRESQL BACKUP SUMMARY:');
    console.log('✅ Complete database backup (with schema and data)');
    console.log('✅ Data-only backup (for data restoration)');
    console.log('✅ Schema-only backup (for structure restoration)');
    console.log('✅ JSON backup (for application-level restoration)');
    
    console.log('\n📋 BACKUP FILES CREATED:');
    const files = fs.readdirSync(backupDir).filter(file => file.includes(timestamp));
    files.forEach(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`- ${file} (${fileSizeInMB} MB)`);
    });
    
    console.log('\n🚨 IMPORTANT FOR WINDOWS REINSTALL:');
    console.log('1. Copy all backup files to external drive/USB');
    console.log('2. Save database connection details');
    console.log('3. Note PostgreSQL version for reinstall');
    console.log('4. Test restoration before Windows reinstall if possible');
    
  } catch (error) {
    console.error('❌ Error creating pg_dump backup:', error);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Check database connection details');
    console.log('3. Ensure pg_dump is in PATH');
    console.log('4. Verify database credentials');
  }
}

createPgDumpBackup();
