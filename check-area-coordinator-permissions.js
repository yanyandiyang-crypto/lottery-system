const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPermissions() {
  try {
    const permissions = await prisma.roleFunctionPermission.findMany({
      where: { 
        role: 'area_coordinator',
        function: {
          key: 'sales_per_draw'
        }
      },
      include: {
        function: true
      }
    });
    
    console.log('Area Coordinator permissions for sales_per_draw:');
    console.log(JSON.stringify(permissions, null, 2));
    
    const allFunctions = await prisma.systemFunction.findMany({
      where: { key: 'sales_per_draw' }
    });
    
    console.log('Sales per draw function:');
    console.log(JSON.stringify(allFunctions, null, 2));
    
    // Check if permission exists, if not create it
    if (permissions.length === 0 && allFunctions.length > 0) {
      console.log('Creating missing permission for area_coordinator...');
      await prisma.roleFunctionPermission.create({
        data: {
          role: 'area_coordinator',
          functionId: allFunctions[0].id,
          isEnabled: true
        }
      });
      console.log('Permission created successfully!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPermissions();
