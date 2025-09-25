const drawScheduler = require('./services/drawScheduler');

async function createSept25Draws() {
  try {
    console.log('Creating draws for September 25, 2025...');
    
    // Use the draw scheduler to create draws for September 25
    const result = await drawScheduler.createDrawForDate('2025-09-25');
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      console.log('Created draws:', result.draws?.length || 0);
    } else {
      console.log('ℹ️', result.message);
      
      // If draws already exist, let's check their status
      console.log('Checking existing draws...');
      const upcomingDraws = await drawScheduler.getUpcomingDraws();
      const sept25Draws = upcomingDraws.filter(draw => 
        draw.drawDate.toISOString().split('T')[0] === '2025-09-25'
      );
      
      console.log(`Found ${sept25Draws.length} draws for September 25:`);
      sept25Draws.forEach(draw => {
        console.log(`- ${draw.drawTime}: ${draw.status} (ID: ${draw.id})`);
      });
    }
    
    // Also ensure draws exist for the next 7 days
    console.log('\nEnsuring draws exist for next 7 days...');
    const ensureResult = await drawScheduler.ensureDrawsExist(7);
    console.log('Ensure result:', ensureResult);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createSept25Draws();
