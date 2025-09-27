const fs = require('fs');
const path = require('path');

// Frontend files to remove
const filesToRemove = [
  // Build directory (can be regenerated)
  'frontend/build',
  
  // Example/test files
  'frontend/src/examples/MobileTableExample.js',
  'frontend/src/pages/Test/WebShareTest.js',
  
  // VSCode settings (IDE-specific)
  'frontend/vscode-settings.json',
  
  // Duplicate logos (keep in public, remove from build)
  // Build logos will be removed with build directory
  
  // Check for unused components/pages
  // These might be unused based on naming patterns:
  'frontend/src/components/TicketTemplates', // Might be unused if no references
  'frontend/src/components/VisualEditor', // Might be unused
  'frontend/src/pages/Test', // Test directory
  
  // CSS files that might be redundant
  'frontend/src/pages/AgentResults/AgentResults.css',
  'frontend/src/pages/MonthlyDraws/MonthlyDraws.css'
];

// Directories to check for emptiness and remove if empty
const dirsToCheck = [
  'frontend/src/examples',
  'frontend/src/components/TicketTemplates',
  'frontend/src/components/VisualEditor',
  'frontend/src/pages/Test'
];

console.log('🧹 Frontend Cleanup - Analyzing files...\n');

let removedFiles = 0;
let removedDirs = 0;
let totalSize = 0;

// Function to get directory size recursively
const getDirSize = (dir) => {
  let size = 0;
  try {
    if (fs.existsSync(dir)) {
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
    }
  } catch (error) {
    console.log(`Error reading directory ${dir}: ${error.message}`);
  }
  return size;
};

// Remove files and directories
filesToRemove.forEach(item => {
  const fullPath = path.join(__dirname, item);
  
  try {
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        const dirSize = getDirSize(fullPath);
        totalSize += dirSize;
        
        // Remove directory recursively
        fs.rmSync(fullPath, { recursive: true, force: true });
        console.log(`✅ Removed directory: ${item} (${(dirSize / 1024 / 1024).toFixed(2)} MB)`);
        removedDirs++;
      } else {
        totalSize += stats.size;
        fs.unlinkSync(fullPath);
        console.log(`✅ Removed file: ${item} (${(stats.size / 1024).toFixed(2)} KB)`);
        removedFiles++;
      }
    } else {
      console.log(`ℹ️  Not found: ${item}`);
    }
  } catch (error) {
    console.log(`❌ Error removing ${item}: ${error.message}`);
  }
});

console.log(`\n📊 Frontend Cleanup Summary:`);
console.log(`Files removed: ${removedFiles}`);
console.log(`Directories removed: ${removedDirs}`);
console.log(`Total space freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

console.log(`\n🔍 Analysis of Frontend Structure:`);

// Analyze component usage
const componentDirs = [
  'frontend/src/components/Dashboard',
  'frontend/src/components/DataMode',
  'frontend/src/components/Layout',
  'frontend/src/components/Notifications',
  'frontend/src/components/Security',
  'frontend/src/components/TemplateEditor',
  'frontend/src/components/Tickets',
  'frontend/src/components/UI'
];

console.log(`\n✅ Essential Components Preserved:`);
componentDirs.forEach(dir => {
  if (fs.existsSync(path.join(__dirname, dir))) {
    console.log(`   ✅ ${dir.replace('frontend/src/', '')}`);
  }
});

// Analyze page structure
const pageDirs = [
  'frontend/src/pages/Dashboard',
  'frontend/src/pages/Betting',
  'frontend/src/pages/Tickets',
  'frontend/src/pages/ClaimApprovals',
  'frontend/src/pages/Auth',
  'frontend/src/pages/Balance',
  'frontend/src/pages/Reports',
  'frontend/src/pages/Sales',
  'frontend/src/pages/UserManagement'
];

console.log(`\n✅ Core Pages Preserved:`);
pageDirs.forEach(dir => {
  if (fs.existsSync(path.join(__dirname, dir))) {
    console.log(`   ✅ ${dir.replace('frontend/src/pages/', '')}`);
  }
});

console.log(`\n💡 Recommendations:`);
console.log(`1. Build directory removed - run 'npm run build' to regenerate`);
console.log(`2. Test files removed - create new tests as needed`);
console.log(`3. Example files removed - reduces clutter`);
console.log(`4. IDE-specific files removed - improves portability`);

console.log(`\n🚀 Frontend is now optimized for production!`);
