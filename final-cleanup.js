const fs = require('fs');
const path = require('path');

// Files and directories to remove
const filesToRemove = [
  // Log files (can be regenerated)
  'logs/.9b0f3aa49cf97f1434727e5b8ab0455dd799520d-audit.json',
  'logs/.22298e975d40cc1442a407a01a7ac382d692dd09-audit.json',
  'logs/.a9cbc6872a7e029f6628a4b5697ab2f79a0ba873-audit.json',
  'logs/.d1e837f0528bc2d595af5b9d8bf86d2f295a183e-audit.json',
  'logs/.ea8a50add6fedc04e3268334a7374ce834c83734-audit.json',
  'logs/application-2025-09-20.log',
  'logs/application-2025-09-21.log',
  'logs/application-2025-09-22.log',
  'logs/application-2025-09-23.log',
  'logs/application-2025-09-24.log',
  'logs/application-2025-09-25.log',
  'logs/application-2025-09-26.log',
  'logs/application-2025-09-27.log',
  'logs/combined.log',
  'logs/combined1.log',
  'logs/combined2.log',
  'logs/error.log',
  
  // Duplicate/redundant migration files
  'migrations/005_add_claiming_fields_correct.sql',
  'migrations/005_add_claiming_fields_fixed.sql',
  'migrations/005_add_claiming_fields.sql',
  'migrations/005_single_transaction.sql',
  'migrations/005b_add_claiming_fields_final.sql',
  'migrations/005b_add_claiming_fields_fixed.sql',
  'migrations/005b_add_claiming_fields_no_audit.sql',
  'migrations/005b_add_claiming_fields.sql',
  'migrations/006_add_approval_system_fixed.sql',
  'migrations/006_add_approval_system.sql',
  'migrations/007_add_ticket_statuses.sql',
  'migrations/008_enhance_claims_system.sql',
  'migrations/add_bet_limits_per_draw.sql',
  'migrations/create_audit_tables.sql',
  'migrations/MIGRATION_INSTRUCTIONS.md',
  
  // Backup/duplicate Prisma schemas
  'prisma/schema-audit-update.prisma',
  'prisma/schema-audit.prisma',
  'prisma/schema-extension.prisma.bak',
  'prisma/schema.additions.prisma',
  'prisma/schema.prisma.bak',
  
  // Duplicate/redundant route files
  'routes/auth-clean.js',
  'routes/auth-v2.js',
  'routes/claim-approvals-original.js.bak',
  'routes/ticket-verification.js', // Keep ticket-verification-clean.js
  'routes/tickets.js', // Keep tickets-clean.js
  'routes/users.js', // Keep users-clean.js
  'routes/winning-reports-simple.js',
  'routes/winning-reports.js', // Keep winning-reports-proper.js
  
  // Scripts (one-time use utilities)
  'scripts/apply-draw-fix.js',
  'scripts/apply-draw-fix2.js',
  'scripts/apply-draw-times.js',
  'scripts/check-draws.js',
  'scripts/check-users.js',
  'scripts/checkDraws.js',
  'scripts/delete-extra-operators.js',
  'scripts/fix-draw-date.js',
  'scripts/fix-draw-datetimes.js',
  'scripts/initialize-system.js',
  'scripts/normalize-draws.js',
  'scripts/set-db-utc-and-convert.js',
  'scripts/sync-draws-to-today.js',
  
  // Microservice (unused auth service)
  'services/auth-service/routes/auth.js',
  'services/auth-service/package.json',
  'services/auth-service/server.js',
  
  // Duplicate environment files
  '.env.deployment',
  'env.example', // Keep .env.example
  
  // Broken/incomplete files
  '{',
  
  // Duplicate database schemas (keep database_schema_fixed.sql)
  'database_schema.sql'
];

// Directories to remove entirely
const dirsToRemove = [
  'logs',
  'scripts',
  'services/auth-service',
  'prisma/migrations', // Keep main migrations folder
  'prisma/models'
];

console.log('🧹 Final Cleanup - Removing unused and redundant files...\n');

let removedFiles = 0;
let removedDirs = 0;
let totalSize = 0;

// Remove individual files
filesToRemove.forEach(filename => {
  const filePath = path.join(__dirname, filename);
  
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
      
      fs.unlinkSync(filePath);
      console.log(`✅ Removed file: ${filename} (${(stats.size / 1024).toFixed(2)} KB)`);
      removedFiles++;
    }
  } catch (error) {
    console.log(`❌ Error removing file ${filename}: ${error.message}`);
  }
});

// Remove directories
dirsToRemove.forEach(dirname => {
  const dirPath = path.join(__dirname, dirname);
  
  try {
    if (fs.existsSync(dirPath)) {
      // Calculate directory size before removal
      const getDirSize = (dir) => {
        let size = 0;
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            size += getDirSize(filePath);
          } else {
            size += stats.size;
          }
        });
        return size;
      };
      
      const dirSize = getDirSize(dirPath);
      totalSize += dirSize;
      
      // Remove directory recursively
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removed directory: ${dirname} (${(dirSize / 1024).toFixed(2)} KB)`);
      removedDirs++;
    }
  } catch (error) {
    console.log(`❌ Error removing directory ${dirname}: ${error.message}`);
  }
});

console.log(`\n📊 Final Cleanup Summary:`);
console.log(`Files removed: ${removedFiles}`);
console.log(`Directories removed: ${removedDirs}`);
console.log(`Total space freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

console.log(`\n✅ Final cleanup completed!`);

console.log(`\n🔒 Essential files/directories preserved:`);
const essentialItems = [
  'server.js',
  'package.json',
  'package-lock.json',
  '.env',
  '.env.example',
  'README.md',
  'Procfile',
  'render.yaml',
  'docker-compose.yml',
  'Dockerfile.backend',
  'nginx.conf',
  'schema.sql',
  'database_schema_fixed.sql',
  'middleware/',
  'routes/',
  'services/',
  'utils/',
  'prisma/schema.prisma',
  'migrations/ (core files)',
  'frontend/ (entire directory)'
];

essentialItems.forEach(item => {
  console.log(`   ✅ ${item}`);
});
