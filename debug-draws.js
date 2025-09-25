const { PrismaClient } = require('@prisma/client');
const moment = require('moment-timezone');

const prisma = new PrismaClient();

async function checkDraws() {
  try {
    console.log('=== Checking Draw Data ===');
    
    const draws = await prisma.draw.findMany({
      orderBy: { drawDate: 'desc' },
      take: 10
    });
    
    console.log('Recent draws in database:');
    draws.forEach(draw => {
      console.log(`ID: ${draw.id}, Date: ${draw.drawDate}, Time: ${draw.drawTime}, Status: ${draw.status}`);
    });
    
    // Check current Philippine date
    const currentDate = moment().tz('Asia/Manila').format('YYYY-MM-DD');
    console.log(`\nCurrent Philippine date: ${currentDate}`);
    
    // Check if there are draws for today
    const todayDraws = await prisma.draw.findMany({
      where: {
        drawDate: currentDate
      }
    });
    
    console.log(`\nDraws for today (${currentDate}):`);
    if (todayDraws.length === 0) {
      console.log('No draws found for today');
    } else {
      todayDraws.forEach(draw => {
        console.log(`ID: ${draw.id}, Time: ${draw.drawTime}, Status: ${draw.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking draws:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDraws();
