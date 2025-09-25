const { PrismaClient } = require('@prisma/client');

async function checkColumns() {
  const prisma = new PrismaClient();
  
  try {
    const columns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'draw_results'`;
    console.log('draw_results table columns:', columns);
  } catch (error) {
    console.log('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumns();
