const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const userCount = await prisma.user.count();
    console.log(`Current user count: ${userCount}`);
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
