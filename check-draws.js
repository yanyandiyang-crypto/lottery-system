const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDraws() {
  try {
    console.log('=== Checking Draws ===');
    
    // Get all draws
    const draws = await prisma.draw.findMany({
      orderBy: { drawDate: 'desc' },
      take: 10
    });
    
    console.log('Recent draws:');
    draws.forEach(draw => {
      console.log(`- ID: ${draw.id}, Date: ${draw.drawDate}, Time: ${draw.drawTime}, Status: ${draw.status}, Cutoff: ${draw.cutoffTime}`);
    });
    
    // Get open draws
    const openDraws = await prisma.draw.findMany({
      where: { status: 'open' }
    });
    
    console.log(`\nOpen draws: ${openDraws.length}`);
    openDraws.forEach(draw => {
      console.log(`- ID: ${draw.id}, Date: ${draw.drawDate}, Time: ${draw.drawTime}, Cutoff: ${draw.cutoffTime}`);
    });
    
    // Check users
    const users = await prisma.user.findMany({
      where: { role: 'agent' },
      take: 5
    });
    
    console.log(`\nAgent users: ${users.length}`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Name: ${user.fullName}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDraws();

