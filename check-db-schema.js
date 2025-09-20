const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('Checking CurrentBetTotal table structure...');
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'current_bet_totals'
      ORDER BY ordinal_position;
    `;
    console.log('CurrentBetTotal table structure:', result);
    
    console.log('\nChecking Ticket table structure...');
    const ticketResult = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tickets'
      ORDER BY ordinal_position;
    `;
    console.log('Ticket table structure:', ticketResult);
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
