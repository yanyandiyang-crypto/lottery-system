const { PrismaClient } = require('@prisma/client');
const moment = require('moment-timezone');

const prisma = new PrismaClient();

async function fixSeptember25Draws() {
  try {
    console.log('🔍 Checking draws for September 25, 2025...');
    
    const targetDate = '2025-09-25';
    const dateObj = new Date(targetDate);
    
    // Check existing draws for September 25
    const existingDraws = await prisma.draw.findMany({
      where: { drawDate: dateObj },
      orderBy: { drawTime: 'asc' }
    });
    
    console.log(`Found ${existingDraws.length} existing draws for September 25:`);
    existingDraws.forEach(draw => {
      console.log(`- ${draw.drawTime}: Status = ${draw.status}, ID = ${draw.id}`);
    });
    
    // Define the required draw times
    const requiredDrawTimes = [
      { time: 'twoPM', hour: 14 },
      { time: 'fivePM', hour: 17 },
      { time: 'ninePM', hour: 21 }
    ];
    
    let createdCount = 0;
    let updatedCount = 0;
    
    // Create missing draws or update status
    for (const drawTime of requiredDrawTimes) {
      const existingDraw = existingDraws.find(d => d.drawTime === drawTime.time);
      
      if (!existingDraw) {
        // Create missing draw
        const cutoffTime = new Date(dateObj);
        cutoffTime.setHours(drawTime.hour - 1, 55, 0, 0); // 5 minutes before draw time
        
        const newDraw = await prisma.draw.create({
          data: {
            drawDate: dateObj,
            drawTime: drawTime.time,
            status: 'open',
            cutoffTime: cutoffTime
          }
        });
        
        console.log(`✅ Created ${drawTime.time} draw (ID: ${newDraw.id}) - Cutoff: ${cutoffTime.toLocaleString()}`);
        createdCount++;
      } else if (existingDraw.status !== 'open') {
        // Update status to open if it's not already open
        const now = moment().tz('Asia/Manila');
        const cutoffHour = drawTime.hour - 1; // 1 hour before draw time
        const cutoffTime = moment(targetDate).tz('Asia/Manila').hour(cutoffHour).minute(55);
        
        if (now.isBefore(cutoffTime)) {
          await prisma.draw.update({
            where: { id: existingDraw.id },
            data: { status: 'open' }
          });
          
          console.log(`🔄 Updated ${drawTime.time} draw status to 'open' (ID: ${existingDraw.id})`);
          updatedCount++;
        } else {
          console.log(`⏰ ${drawTime.time} draw cutoff time has passed, keeping status as '${existingDraw.status}'`);
        }
      } else {
        console.log(`✅ ${drawTime.time} draw already exists and is open (ID: ${existingDraw.id})`);
      }
    }
    
    // Check current time and available betting windows
    const now = moment().tz('Asia/Manila');
    console.log(`\n⏰ Current Manila time: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
    
    // Check which draws are currently available for betting
    const availableDraws = await prisma.draw.findMany({
      where: { 
        drawDate: dateObj,
        status: 'open'
      },
      orderBy: { drawTime: 'asc' }
    });
    
    console.log(`\n🎯 Available draws for betting on September 25:`);
    availableDraws.forEach(draw => {
      let cutoffHour;
      switch (draw.drawTime) {
        case 'twoPM': cutoffHour = 13; break;
        case 'fivePM': cutoffHour = 16; break;
        case 'ninePM': cutoffHour = 20; break;
      }
      
      const cutoffTime = moment(targetDate).tz('Asia/Manila').hour(cutoffHour).minute(55);
      const timeUntilCutoff = cutoffTime.diff(now, 'minutes');
      
      if (timeUntilCutoff > 0) {
        console.log(`- ${draw.drawTime}: Open (${timeUntilCutoff} minutes until cutoff)`);
      } else {
        console.log(`- ${draw.drawTime}: Should be closed (cutoff was ${Math.abs(timeUntilCutoff)} minutes ago)`);
      }
    });
    
    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`- Created: ${createdCount} new draws`);
    console.log(`- Updated: ${updatedCount} existing draws`);
    console.log(`- Total draws for Sept 25: ${existingDraws.length + createdCount}`);
    
    // Check if sales should now appear
    console.log(`\n💰 Sales data should now be available for September 25 once tickets are created.`);
    
  } catch (error) {
    console.error('❌ Error fixing September 25 draws:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSeptember25Draws();
