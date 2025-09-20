const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAreaCoordinator() {
  try {
    console.log('Fixing area coordinator password...');
    
    // Hash a known password
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    // Update the area coordinator
    const user = await prisma.user.update({
      where: { username: 'areatest' },
      data: { 
        passwordHash: hashedPassword,
        status: 'active'
      }
    });
    
    console.log('Updated area coordinator:', user.username);
    console.log('New password: password123');
    console.log('Status:', user.status);
    console.log('RegionId:', user.regionId);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAreaCoordinator();
