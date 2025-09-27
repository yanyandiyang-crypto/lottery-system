/**
 * Check and Clean Duplicate Draws Script
 * Run this to check for duplicate draws and optionally clean them up
 */

const DrawCleanup = require('../utils/drawCleanup');

async function main() {
  console.log('🎯 Draw Cleanup Utility\n');
  
  try {
    // Show current statistics
    await DrawCleanup.showDrawStats();
    
    // Check for duplicates
    const { hasDuplicates } = await DrawCleanup.checkDuplicateDraws();
    
    if (hasDuplicates) {
      console.log('\n🔧 To clean up duplicates, you can run:');
      console.log('1. Dry run (preview): DrawCleanup.cleanupDuplicateDraws(true)');
      console.log('2. Actual cleanup: DrawCleanup.cleanupDuplicateDraws(false)');
      console.log('\n⚠️  To reset ALL draws and tickets: DrawCleanup.resetAllDraws(true)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Check completed!');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = main;
