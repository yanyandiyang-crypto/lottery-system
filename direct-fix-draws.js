const { PrismaClient } = require('@prisma/client');

async function directFix() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== DIRECT FIX FOR SEPTEMBER 25 DRAWS ===');
    
    // Check current draws for Sept 25
    const existingDraws = await prisma.draw.findMany({
      where: {
        drawDate: new Date('2025-09-25')
      }
    });
    
    console.log(`Current draws for Sept 25: ${existingDraws.length}`);
    
    if (existingDraws.length === 0) {
      console.log('Creating draws for September 25...');
      
      // Create 2PM draw
      const draw2pm = await prisma.draw.create({
        data: {
          drawDate: new Date('2025-09-25'),
          drawTime: 'twoPM',
          status: 'open'
        }
      });
      console.log('Created 2PM draw:', draw2pm.id);
      
      // Create 5PM draw
      const draw5pm = await prisma.draw.create({
        data: {
          drawDate: new Date('2025-09-25'),
          drawTime: 'fivePM',
          status: 'open'
        }
      });
      console.log('Created 5PM draw:', draw5pm.id);
      
      // Create 9PM draw
      const draw9pm = await prisma.draw.create({
        data: {
          drawDate: new Date('2025-09-25'),
          drawTime: 'ninePM',
          status: 'open'
        }
      });
      console.log('Created 9PM draw:', draw9pm.id);
      
      console.log('✅ All draws created for September 25!');
    } else {
      console.log('Existing draws:');
      existingDraws.forEach(draw => {
        console.log(`- ${draw.drawTime}: ${draw.status} (ID: ${draw.id})`);
      });
    }
    
    // Now check if there are any tickets for Sept 25
    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: new Date('2025-09-25'),
          lt: new Date('2025-09-26')
        }
      }
    });
    
    console.log(`\nTickets for Sept 25: ${tickets.length}`);
    
    if (tickets.length === 0) {
      console.log('No tickets found for September 25 yet.');
      console.log('Sales will appear once tickets are created.');
    } else {
      const total = tickets.reduce((sum, t) => sum + t.totalAmount, 0);
      console.log(`Total sales: ₱${total}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

directFix();
