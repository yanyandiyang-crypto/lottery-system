const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSalesData() {
  try {
    console.log('=== CHECKING DRAWS FOR SEPTEMBER 24-25 ===');
    
    const draws = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: new Date('2025-09-24'),
          lte: new Date('2025-09-25T23:59:59')
        }
      },
      orderBy: { drawDate: 'asc' }
    });
    
    console.log('Draws found:', draws.length);
    draws.forEach(draw => {
      console.log(`Draw ID: ${draw.id}, Date: ${draw.drawDate.toISOString().split('T')[0]}, Time: ${draw.drawTime}, Status: ${draw.status}`);
    });
    
    console.log('\n=== CHECKING TICKETS FOR SEPTEMBER 24-25 ===');
    
    const tickets = await prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: new Date('2025-09-24'),
          lte: new Date('2025-09-25T23:59:59')
        }
      },
      include: {
        draw: {
          select: { drawDate: true, drawTime: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('Tickets found:', tickets.length);
    
    const ticketsByDate = {};
    tickets.forEach(ticket => {
      const date = ticket.createdAt.toISOString().split('T')[0];
      if (!ticketsByDate[date]) {
        ticketsByDate[date] = { count: 0, totalAmount: 0 };
      }
      ticketsByDate[date].count++;
      ticketsByDate[date].totalAmount += ticket.totalAmount;
    });
    
    console.log('\nTickets by date:');
    Object.entries(ticketsByDate).forEach(([date, data]) => {
      console.log(`${date}: ${data.count} tickets, ₱${data.totalAmount.toFixed(2)} total`);
    });
    
    console.log('\n=== CHECKING SALES RECORDS FOR SEPTEMBER 24-25 ===');
    
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: {
          gte: new Date('2025-09-24'),
          lte: new Date('2025-09-25T23:59:59')
        }
      },
      include: {
        draw: {
          select: { drawDate: true, drawTime: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('Sales records found:', sales.length);
    
    const salesByDate = {};
    sales.forEach(sale => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!salesByDate[date]) {
        salesByDate[date] = { count: 0, totalAmount: 0 };
      }
      salesByDate[date].count++;
      salesByDate[date].totalAmount += sale.totalAmount;
    });
    
    console.log('\nSales by date:');
    Object.entries(salesByDate).forEach(([date, data]) => {
      console.log(`${date}: ${data.count} sales records, ₱${data.totalAmount.toFixed(2)} total`);
    });
    
    console.log('\n=== CHECKING TODAY\'S DATE AND TIMEZONE ===');
    console.log('Current server time:', new Date().toISOString());
    console.log('Current Manila time:', new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSalesData();
