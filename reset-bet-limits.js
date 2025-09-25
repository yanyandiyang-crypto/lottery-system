const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetBetLimits() {
  try {
    console.log('🔄 Resetting bet limits...');

    // Delete all existing bet limits
    await prisma.betLimit.deleteMany();
    console.log('✅ Global bet limits deleted');

    // Delete all per-draw bet limits
    await prisma.betLimitPerDraw.deleteMany();
    console.log('✅ Per-draw bet limits deleted');

    console.log('✅ All bet limits have been reset successfully');
  } catch (error) {
    console.error('❌ Error resetting bet limits:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetBetLimits()
  .catch(console.error);