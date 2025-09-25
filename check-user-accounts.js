const { PrismaClient } = require('@prisma/client');

async function checkUserAccounts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking all user accounts in the system...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`Total users found: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('User accounts:');
      console.log('ID | Username | Full Name | Email | Role | Status | Created');
      console.log('-'.repeat(80));
      
      users.forEach(user => {
        const createdDate = new Date(user.createdAt).toLocaleDateString();
        console.log(`${user.id.toString().padEnd(2)} | ${user.username.padEnd(12)} | ${(user.fullName || 'N/A').padEnd(15)} | ${(user.email || 'N/A').padEnd(20)} | ${user.role.padEnd(12)} | ${user.status.padEnd(8)} | ${createdDate}`);
      });
    } else {
      console.log('No user accounts found in the system.');
    }
    
  } catch (error) {
    console.log('❌ Error checking user accounts:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAccounts();
