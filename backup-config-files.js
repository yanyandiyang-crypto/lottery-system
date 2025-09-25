const fs = require('fs');
const path = require('path');

function backupConfigFiles() {
  try {
    console.log('=== BACKING UP CONFIGURATION FILES ===');
    
    const backupDir = path.join(__dirname, 'backups');
    const configBackupDir = path.join(backupDir, 'config-backup');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    
    // Create config backup directory
    if (!fs.existsSync(configBackupDir)) {
      fs.mkdirSync(configBackupDir, { recursive: true });
    }
    
    console.log(`Creating config backup in: ${configBackupDir}`);
    
    // Important files to backup
    const filesToBackup = [
      // Core configuration
      'package.json',
      'package-lock.json',
      '.env',
      'env.example',
      
      // Database schema and migrations
      'database_schema.sql',
      'database_schema_fixed.sql',
      'prisma/schema.prisma',
      
      // Docker configuration
      'docker-compose.yml',
      'Dockerfile.backend',
      'nginx.conf',
      
      // Deployment files
      'Procfile',
      'render.yaml',
      'app.json',
      
      // Documentation
      'README.md',
      'QUICK_START.md',
      'API_DOCUMENTATION.md',
      'CURRENT_STATUS.md',
      'FINAL_STATUS.md',
      'SYSTEM_READY.md',
      
      // Scripts
      'run-system.bat',
      'run-system.sh',
      'setup-db.bat',
      'start-server.js',
      'server.js',
      
      // Frontend configuration
      'frontend/package.json',
      'frontend/package-lock.json',
      'frontend/public',
      'frontend/src',
      
      // Routes and services
      'routes',
      'services',
      'middleware',
      'utils',
      
      // Logs (if any)
      'logs'
    ];
    
    let backedUpCount = 0;
    let skippedCount = 0;
    
    console.log('\n📁 Backing up files...');
    
    for (const filePath of filesToBackup) {
      const sourcePath = path.join(__dirname, filePath);
      const targetPath = path.join(configBackupDir, filePath);
      
      try {
        if (fs.existsSync(sourcePath)) {
          const stats = fs.statSync(sourcePath);
          
          if (stats.isDirectory()) {
            // Copy directory recursively
            copyDirectory(sourcePath, targetPath);
            console.log(`✅ Directory: ${filePath}`);
            backedUpCount++;
          } else {
            // Copy file
            const targetDir = path.dirname(targetPath);
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }
            fs.copyFileSync(sourcePath, targetPath);
            console.log(`✅ File: ${filePath}`);
            backedUpCount++;
          }
        } else {
          console.log(`⚠️  Not found: ${filePath}`);
          skippedCount++;
        }
      } catch (error) {
        console.log(`❌ Error backing up ${filePath}: ${error.message}`);
        skippedCount++;
      }
    }
    
    // Create a backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      backupType: 'configuration_files',
      totalFiles: backedUpCount,
      skippedFiles: skippedCount,
      files: filesToBackup,
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd()
      },
      databaseInfo: {
        url: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
        // Don't log actual URL for security
        urlPreview: process.env.DATABASE_URL ? 
          process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT_SET'
      }
    };
    
    const manifestFile = path.join(configBackupDir, 'backup-manifest.json');
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
    
    // Create a simple text summary
    const summaryFile = path.join(configBackupDir, 'BACKUP_SUMMARY.txt');
    const summary = `
NEWBETTING SYSTEM - CONFIGURATION BACKUP
=========================================

Backup Date: ${new Date().toLocaleString()}
Backup Location: ${configBackupDir}

FILES BACKED UP: ${backedUpCount}
FILES SKIPPED: ${skippedCount}

IMPORTANT FILES INCLUDED:
- package.json (dependencies)
- .env (environment variables)
- database_schema.sql (database structure)
- prisma/schema.prisma (Prisma schema)
- docker-compose.yml (Docker configuration)
- All documentation files
- All scripts and utilities
- Frontend source code
- Routes and services

DATABASE CONNECTION INFO:
- Database: lottery_system_local
- Host: localhost
- Port: 5432
- Username: postgres
- Password: admin123

POSTGRESQL VERSION: 16

RESTORATION NOTES:
1. Install Node.js 18+
2. Install PostgreSQL 16
3. Restore database from SQL backups
4. Run npm install in root and frontend directories
5. Set up environment variables
6. Run database migrations

IMPORTANT: Keep this backup safe during Windows reinstall!
`;
    
    fs.writeFileSync(summaryFile, summary);
    
    console.log('\n🎯 CONFIGURATION BACKUP SUMMARY:');
    console.log(`✅ Files backed up: ${backedUpCount}`);
    console.log(`⚠️  Files skipped: ${skippedCount}`);
    console.log(`📁 Backup location: ${configBackupDir}`);
    console.log(`📋 Manifest: ${manifestFile}`);
    console.log(`📄 Summary: ${summaryFile}`);
    
    // Get total size
    const totalSize = getDirectorySize(configBackupDir);
    console.log(`📊 Total backup size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    
    console.log('\n🚨 IMPORTANT FOR WINDOWS REINSTALL:');
    console.log('1. Copy the entire backups/ folder to external drive');
    console.log('2. Save this summary for reference');
    console.log('3. Note your PostgreSQL version (16)');
    console.log('4. Keep database credentials safe');
    
  } catch (error) {
    console.error('❌ Error creating configuration backup:', error);
  }
}

function copyDirectory(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    const stats = fs.statSync(sourcePath);
    
    if (stats.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      const files = fs.readdirSync(itemPath);
      for (const file of files) {
        calculateSize(path.join(itemPath, file));
      }
    } else {
      totalSize += stats.size;
    }
  }
  
  calculateSize(dirPath);
  return totalSize;
}

backupConfigFiles();
