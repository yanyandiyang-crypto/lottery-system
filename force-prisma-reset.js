const { PrismaClient } = require('@prisma/client');

async function forcePrismaReset() {
  try {
    console.log('🔄 Force resetting Prisma client and testing queries...\n');

    // Create fresh Prisma client
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });

    // Force disconnect and reconnect
    await prisma.$disconnect();
    await prisma.$connect();

    console.log('✅ Prisma client reconnected\n');

    // Test direct query with raw SQL
    console.log('1. Testing with raw SQL query...');
    const rawResult = await prisma.$queryRaw`
      SELECT id, "drawTime", "drawDate", status, "createdAt"
      FROM "draw" 
      WHERE "drawDate"::date = '2025-09-18'::date
      ORDER BY "drawTime"
    `;
    
    console.log(`Raw SQL returned: ${rawResult.length} draws`);
    rawResult.forEach(draw => {
      console.log(`  Draw ${draw.id} | ${draw.drawTime} | Status: ${draw.status}`);
    });

    // Test with fresh Prisma query
    console.log('\n2. Testing with fresh Prisma query...');
    const today = new Date('2025-09-18');
    const nextDay = new Date('2025-09-19');
    
    const prismaResult = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: today,
          lt: nextDay
        }
      },
      orderBy: { drawTime: 'asc' }
    });

    console.log(`Prisma query returned: ${prismaResult.length} draws`);
    prismaResult.forEach(draw => {
      console.log(`  Draw ${draw.id} | ${draw.drawTime} | Status: ${draw.status}`);
    });

    // Check if Draw 1 specifically exists
    console.log('\n3. Checking if Draw 1 exists...');
    const draw1 = await prisma.draw.findUnique({
      where: { id: 1 }
    });

    if (draw1) {
      console.log('❌ Draw 1 still exists in database!');
      console.log(`   Draw 1: ${draw1.drawTime} | ${new Date(draw1.drawDate).toDateString()} | ${draw1.status}`);
      
      // Force delete it again
      console.log('\n🗑️  Force deleting Draw 1...');
      try {
        await prisma.draw.delete({
          where: { id: 1 }
        });
        console.log('✅ Draw 1 deleted successfully');
      } catch (error) {
        console.log('❌ Failed to delete Draw 1:', error.message);
      }
    } else {
      console.log('✅ Draw 1 does not exist in database');
    }

    // Final verification
    console.log('\n4. Final verification...');
    const finalCheck = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: today,
          lt: nextDay
        }
      },
      orderBy: { drawTime: 'asc' }
    });

    console.log(`Final check: ${finalCheck.length} draws for today`);
    finalCheck.forEach(draw => {
      console.log(`  Draw ${draw.id} | ${draw.drawTime} | Status: ${draw.status}`);
    });

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Force reset failed:', error.message);
  }
}

forcePrismaReset();
