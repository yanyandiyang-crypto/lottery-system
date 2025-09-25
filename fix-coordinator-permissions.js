const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCoordinatorPermissions() {
  try {
    console.log('🔧 Fixing Coordinator Permissions...');
    
    // Functions that coordinators should have access to
    const coordinatorFunctions = [
      'users',
      'agent_management',
      'balance_management', 
      'draw_results',
      'tickets',
      'sales',
      'sales_per_draw',
      'reports',
      'sales_reports',
      'notifications'
    ];
    
    // Get all system functions
    const functions = await prisma.systemFunction.findMany();
    
    // Update coordinator permissions
    for (const func of functions) {
      const shouldHaveAccess = coordinatorFunctions.includes(func.key);
      
      // Check if permission exists
      const existingPermission = await prisma.roleFunctionPermission.findFirst({
        where: {
          role: 'coordinator',
          functionId: func.id
        }
      });
      
      if (existingPermission) {
        // Update existing permission
        await prisma.roleFunctionPermission.update({
          where: { id: existingPermission.id },
          data: { isEnabled: shouldHaveAccess }
        });
        console.log(`📝 Updated ${func.name}: ${shouldHaveAccess ? 'Enabled' : 'Disabled'}`);
      } else {
        // Create new permission
        await prisma.roleFunctionPermission.create({
          data: {
            role: 'coordinator',
            functionId: func.id,
            isEnabled: shouldHaveAccess
          }
        });
        console.log(`➕ Created ${func.name}: ${shouldHaveAccess ? 'Enabled' : 'Disabled'}`);
      }
    }
    
    console.log('✅ Coordinator permissions fixed successfully!');
    
    // Verify the changes
    const updatedPermissions = await prisma.roleFunctionPermission.findMany({
      where: { role: 'coordinator', isEnabled: true },
      include: {
        function: {
          select: { name: true, key: true }
        }
      }
    });
    
    console.log('\n📋 Coordinator now has access to:');
    updatedPermissions.forEach(perm => {
      console.log(`  ✅ ${perm.function.name} (${perm.function.key})`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing permissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCoordinatorPermissions();
