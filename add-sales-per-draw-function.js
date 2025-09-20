const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSalesPerDrawFunction() {
  try {
    // Check if the function already exists
    const existingFunction = await prisma.systemFunction.findFirst({
      where: { key: 'sales_per_draw' }
    });

    if (existingFunction) {
      console.log('Sales per Draw function already exists');
      return;
    }

    // Create the Sales per Draw function
    const newFunction = await prisma.systemFunction.create({
      data: {
        name: 'Sales per Draw',
        key: 'sales_per_draw',
        category: 'Reports',
        description: 'View sales data per draw',
        isActive: true
      }
    });

    console.log('Created Sales per Draw function:', newFunction);

    // Create default permissions for all roles
    const defaultPermissions = [];
    ['admin', 'area_coordinator', 'coordinator'].forEach(role => {
      defaultPermissions.push({
        role,
        functionId: newFunction.id,
        isEnabled: true
      });
    });

    await prisma.roleFunctionPermission.createMany({
      data: defaultPermissions
    });

    console.log('Created default permissions for Sales per Draw function');
    console.log('Sales per Draw function added successfully!');

  } catch (error) {
    console.error('Error adding Sales per Draw function:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSalesPerDrawFunction();
