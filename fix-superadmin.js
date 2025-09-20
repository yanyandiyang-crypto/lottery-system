const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSuperadmin() {
  try {
    console.log('Reactivating superadmin...');
    const user = await prisma.user.update({
      where: { username: 'superadmin' },
      data: { status: 'active' }
    });
    
    console.log('Reactivated superadmin:', user.username, user.status);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSuperadmin();
