const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugBetLimitsAPI() {
  try {
    console.log('🔍 Debugging bet limits API...');

    // Test database connection
    console.log('1. Testing database connection...');
    const betLimits = await prisma.betLimit.findMany();
    console.log('✅ Database connection successful');
    console.log('Current bet limits:', betLimits);

    // Test the API endpoint manually
    console.log('\n2. Testing bet limit update...');
    
    // Try to update a bet limit
    const testUpdate = await prisma.betLimit.upsert({
      where: { betType: 'standard' },
      update: {
        limitAmount: 150000,
        updatedAt: new Date()
      },
      create: {
        betType: 'standard',
        limitAmount: 150000,
        createdById: 1
      }
    });
    
    console.log('✅ Bet limit update successful:', testUpdate);

    // Check BetType enum values
    console.log('\n3. Checking BetType enum...');
    const schema = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'BetType'
      )
    `;
    console.log('Available BetType values:', schema);

  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

debugBetLimitsAPI();
