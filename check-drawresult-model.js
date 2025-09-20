const { PrismaClient } = require('@prisma/client');

async function checkDrawResultModel() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking DrawResult model...');
    
    // Try to query the drawResult table
    const count = await prisma.drawResult.count();
    console.log('✅ DrawResult model exists, count:', count);
    
    // Check the schema
    const result = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'DrawResult' ORDER BY ordinal_position`;
    console.log('DrawResult table columns:', result);
    
  } catch (error) {
    console.log('❌ DrawResult model error:', error.message);
    
    // Check if the table exists at all
    try {
      const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%draw%'`;
      console.log('Draw-related tables:', tables);
    } catch (e) {
      console.log('Error checking tables:', e.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDrawResultModel();
