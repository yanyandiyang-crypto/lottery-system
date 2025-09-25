const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking database connection...');
    
    // Check draws for Sept 24-25
    const draws = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: new Date('2025-09-24'),
          lte: new Date('2025-09-25')
        }
      }
    });
    
    console.log(`Found ${draws.length} draws for Sept 24-25:`);
    draws.forEach(d => console.log(`- ${d.drawDate.toDateString()} ${d.drawTime} (${d.status})`));
    
    // Check tickets for Sept 24-25
    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: new Date('2025-09-24'),
          lte: new Date('2025-09-25T23:59:59')
        }
      }
    });
    
    console.log(`\nFound ${tickets.length} tickets for Sept 24-25`);
    
    // Group by date
    const byDate = {};
    tickets.forEach(t => {
      const date = t.createdAt.toISOString().split('T')[0];
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(t);
    });
    
    Object.keys(byDate).forEach(date => {
      const total = byDate[date].reduce((sum, t) => sum + t.totalAmount, 0);
      console.log(`${date}: ${byDate[date].length} tickets, ₱${total}`);
    });
    
    // Check current time
    console.log(`\nCurrent time: ${new Date().toISOString()}`);
    console.log(`Manila time: ${new Date().toLocaleString('en-PH', {timeZone: 'Asia/Manila'})}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
