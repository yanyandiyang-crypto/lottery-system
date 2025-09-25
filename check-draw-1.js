const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDrawId1() {
  try {
    const draw1 = await prisma.draw.findUnique({
      where: { id: 1 },
      select: { id: true, drawDate: true, drawTime: true, status: true }
    });
    
    console.log('Draw ID 1 data:', draw1);
    
    // Also check what drawId the frontend is actually sending
    console.log('\nChecking all draws with September 17, 2025:');
    const sept17Draws = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: new Date('2025-09-17T00:00:00.000Z'),
          lt: new Date('2025-09-18T00:00:00.000Z')
        }
      }
    });
    
    sept17Draws.forEach(draw => {
      console.log(`ID: ${draw.id}, Date: ${draw.drawDate}, Time: ${draw.drawTime}, Status: ${draw.status}`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkDrawId1();
