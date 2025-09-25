console.log('Starting September 25 draws check...');

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndFixDraws() {
  try {
    // Check draws for September 25
    const draws = await prisma.draw.findMany({
      where: {
        drawDate: new Date('2025-09-25')
      }
    });
    
    console.log('Draws for September 25:', draws.length);
    
    if (draws.length === 0) {
      console.log('No draws found for September 25. Creating them...');
      
      // Create the three daily draws
      const drawTimes = ['twoPM', 'fivePM', 'ninePM'];
      
      for (const drawTime of drawTimes) {
        const draw = await prisma.draw.create({
          data: {
            drawDate: new Date('2025-09-25'),
            drawTime: drawTime,
            status: 'open'
          }
        });
        console.log(`Created ${drawTime} draw with ID: ${draw.id}`);
      }
    } else {
      draws.forEach(draw => {
        console.log(`${draw.drawTime}: ${draw.status} (ID: ${draw.id})`);
      });
    }
    
    // Check tickets for September 25
    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: new Date('2025-09-25'),
          lt: new Date('2025-09-26')
        }
      }
    });
    
    console.log(`Tickets for September 25: ${tickets.length}`);
    
    if (tickets.length > 0) {
      const totalAmount = tickets.reduce((sum, t) => sum + t.totalAmount, 0);
      console.log(`Total sales amount: ₱${totalAmount}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixDraws();
