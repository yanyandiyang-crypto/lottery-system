const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        role: true,
        email: true
      }
    });

    console.log('Users in database:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, Name: ${user.fullName}, Role: ${user.role}, Email: ${user.email}`);
    });

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();




