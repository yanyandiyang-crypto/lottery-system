const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...');
    console.log('Database URL:', process.env.DATABASE_URL);
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check current database name
    const result = await prisma.$queryRaw`SELECT current_database()`;
    console.log('📊 Current database:', result[0].current_database);
    
    // Count users
    const userCount = await prisma.user.count();
    console.log('👥 Total users:', userCount);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: { id: true, username: true, role: true, fullName: true }
      });
      console.log('Users found:');
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.role}) - ${user.fullName}`);
      });
    } else {
      console.log('❌ No users found in database');
    }
    
    // Check other tables
    const drawCount = await prisma.draw.count();
    const regionCount = await prisma.region.count();
    
    console.log('📈 Other data:');
    console.log(`  - Draws: ${drawCount}`);
    console.log(`  - Regions: ${regionCount}`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
