const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDraw1Status() {
  try {
    console.log('🔧 Fixing Draw 1 status...');

    // Update Draw 1 to closed
    await prisma.draw.update({
      where: { id: 1 },
      data: { status: 'closed' }
    });

    console.log('✅ Draw 1 status updated to closed');

    // Verify the change
    const draw1 = await prisma.draw.findUnique({
      where: { id: 1 }
    });

    console.log(`📊 Draw 1 current status: ${draw1.status}`);

    // Check all today's draws
    const today = new Date().toISOString().split('T')[0];
    const todayDraws = await prisma.draw.findMany({
      where: {
        drawDate: new Date(today)
      },
      orderBy: { drawTime: 'asc' }
    });

    console.log('\n📅 All today\'s draws after fix:');
    todayDraws.forEach(draw => {
      console.log(`  Draw ${draw.id} | ${draw.drawTime} | Status: ${draw.status.toUpperCase()}`);
    });

  } catch (error) {
    console.error('❌ Error fixing draw status:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixDraw1Status();
