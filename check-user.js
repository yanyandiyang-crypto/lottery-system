const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({ 
      where: { username: 'admin' },
      include: {
        region: true,
        coordinator: true,
        balance: true
      }
    });
    
    console.log('User data:', JSON.stringify(user, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
