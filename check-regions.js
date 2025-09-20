const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRegions() {
  try {
    console.log('Checking regions...');
    const regions = await prisma.region.findMany();
    console.log('Regions:', regions);
    
    // Check if we need to create a region and assign the area coordinator
    if (regions.length === 0) {
      console.log('No regions found. Creating a test region...');
      const newRegion = await prisma.region.create({
        data: {
          name: 'Test Region',
          areaCoordinatorId: 4 // areatest user ID
        }
      });
      console.log('Created region:', newRegion);
      
      // Update the area coordinator with the region ID
      await prisma.user.update({
        where: { id: 4 },
        data: { regionId: newRegion.id }
      });
      console.log('Updated area coordinator with regionId');
    } else {
      // Assign the area coordinator to the first region
      const firstRegion = regions[0];
      await prisma.user.update({
        where: { id: 4 },
        data: { regionId: firstRegion.id }
      });
      console.log(`Assigned area coordinator to region ${firstRegion.id}`);
    }
    
    // Also assign other users to the same region for testing
    await prisma.user.updateMany({
      where: { 
        role: { in: ['coordinator', 'agent'] }
      },
      data: { regionId: regions.length > 0 ? regions[0].id : 1 }
    });
    console.log('Assigned coordinators and agents to the region');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRegions();
