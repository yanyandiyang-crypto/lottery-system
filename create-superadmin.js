const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('Creating superadmin user...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create superadmin user
    const superadmin = await prisma.user.create({
      data: {
        username: 'superadmin',
        passwordHash: hashedPassword,
        fullName: 'Super Administrator',
        email: 'admin@lottery.com',
        role: 'superadmin',
        status: 'active'
      }
    });

    console.log('Superadmin created:', superadmin);

    // Create balance
    await prisma.userBalance.create({
      data: {
        userId: superadmin.id,
        currentBalance: 0,
        lastUpdated: new Date()
      }
    });

    console.log('Superadmin balance created');
    console.log('Username: superadmin');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
