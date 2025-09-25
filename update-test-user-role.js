const { PrismaClient } = require('@prisma/client');

async function updateTestUserRole() {
  const prisma = new PrismaClient();
  
  try {
    const user = await prisma.user.update({
      where: { username: 'testadmin' },
      data: { role: 'superadmin' }
    });
    console.log('✅ Updated user role to:', user.role);
  } catch (error) {
    console.log('❌ Error updating user role:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateTestUserRole();
