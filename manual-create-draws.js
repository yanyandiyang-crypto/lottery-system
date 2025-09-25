const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function manualCreateDraws() {
  try {
    console.log('Manual creation of September 25 draws...');
    
    // First, check what exists
    const existing = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: new Date('2025-09-24'),
          lte: new Date('2025-09-25T23:59:59')
        }
      },
      orderBy: [
        { drawDate: 'asc' },
        { drawTime: 'asc' }
      ]
    });
    
    console.log('Existing draws Sept 24-25:');
    existing.forEach(draw => {
      const date = draw.drawDate.toISOString().split('T')[0];
      console.log(`${date} ${draw.drawTime}: ${draw.status} (ID: ${draw.id})`);
    });
    
    // Check if Sept 25 draws exist
    const sept25Draws = existing.filter(d => 
      d.drawDate.toISOString().split('T')[0] === '2025-09-25'
    );
    
    if (sept25Draws.length === 0) {
      console.log('\nNo draws found for Sept 25. Creating them...');
      
      // Create using raw SQL to ensure it works
      await prisma.$executeRaw`
        INSERT INTO draws (draw_date, draw_time, status, "createdAt", "updatedAt")
        VALUES 
          ('2025-09-25'::date, 'twoPM', 'open', NOW(), NOW()),
          ('2025-09-25'::date, 'fivePM', 'open', NOW(), NOW()),
          ('2025-09-25'::date, 'ninePM', 'open', NOW(), NOW())
        ON CONFLICT (draw_date, draw_time) DO NOTHING
      `;
      
      console.log('✅ Draws created using raw SQL');
      
      // Verify creation
      const newDraws = await prisma.draw.findMany({
        where: { drawDate: new Date('2025-09-25') }
      });
      
      console.log(`Verified: ${newDraws.length} draws now exist for Sept 25`);
      newDraws.forEach(draw => {
        console.log(`- ${draw.drawTime}: ${draw.status} (ID: ${draw.id})`);
      });
      
    } else {
      console.log(`\n${sept25Draws.length} draws already exist for Sept 25`);
    }
    
    // Check tickets and sales
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
      console.log('💡 No tickets yet for Sept 25. Sales will appear once tickets are created.');
      console.log('   Try creating a test ticket through the frontend to generate sales data.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

manualCreateDraws();
