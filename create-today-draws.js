const { PrismaClient } = require('@prisma/client');
const moment = require('moment-timezone');

const prisma = new PrismaClient();

async function createTodayDraws() {
  try {
    const currentDate = moment().tz('Asia/Manila').format('YYYY-MM-DD');
    console.log(`Creating draws for ${currentDate}`);
    
    // Check if draws already exist for today
    const existingDraws = await prisma.draw.findMany({
      where: {
        drawDate: new Date(currentDate + 'T00:00:00.000Z')
      }
    });
    
    if (existingDraws.length > 0) {
      console.log('Draws already exist for today:');
      existingDraws.forEach(draw => {
        console.log(`ID: ${draw.id}, Time: ${draw.drawTime}, Status: ${draw.status}`);
      });
      return;
    }
    
    // Create draws for today
    const drawTimes = ['twoPM', 'fivePM', 'ninePM'];
    const createdDraws = [];
    
    for (const drawTime of drawTimes) {
      const draw = await prisma.draw.create({
        data: {
          drawDate: new Date(currentDate + 'T00:00:00.000Z'),
          drawTime: drawTime,
          status: 'open'
        }
      });
      createdDraws.push(draw);
      console.log(`Created draw: ID ${draw.id}, Time: ${drawTime}`);
    }
    
    console.log(`\nSuccessfully created ${createdDraws.length} draws for ${currentDate}`);
    
  } catch (error) {
    console.error('Error creating draws:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTodayDraws();
