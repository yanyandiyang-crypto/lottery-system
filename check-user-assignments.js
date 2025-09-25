const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserAssignments() {
  try {
    console.log('User assignments:');
    const users = await prisma.user.findMany({ 
      select: { id: true, username: true, role: true, regionId: true } 
    });
    
    users.forEach(u => {
      console.log(`ID: ${u.id}, User: ${u.username}, Role: ${u.role}, RegionId: ${u.regionId}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAssignments();
