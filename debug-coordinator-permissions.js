const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugCoordinatorPermissions() {
  try {
    console.log('🔍 Debugging Coordinator Permissions...');
    
    // Check if system functions exist
    const functions = await prisma.systemFunction.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log('📋 Available System Functions:');
    functions.forEach(func => {
      console.log(`  - ${func.name} (${func.key})`);
    });
    
    // Check coordinator permissions
    const coordinatorPermissions = await prisma.roleFunctionPermission.findMany({
      where: { role: 'coordinator' },
      include: {
        function: {
          select: {
            name: true,
            key: true
          }
        }
      }
    });
    
    console.log('\n👥 Coordinator Permissions:');
    if (coordinatorPermissions.length === 0) {
      console.log('  ❌ No permissions found for coordinator role!');
    } else {
      coordinatorPermissions.forEach(perm => {
        console.log(`  - ${perm.function.name} (${perm.function.key}): ${perm.isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
      });
    }
    
    // Check if there are any coordinators in the system
    const coordinators = await prisma.user.findMany({
      where: { role: 'coordinator' },
      select: {
        id: true,
        username: true,
        fullName: true
      }
    });
    
    console.log('\n👤 Coordinators in System:');
    if (coordinators.length === 0) {
      console.log('  ❌ No coordinator users found!');
    } else {
      coordinators.forEach(coord => {
        console.log(`  - ${coord.fullName || coord.username} (ID: ${coord.id})`);
      });
    }
    
    // Check area coordinator permissions for comparison
    const areaCoordPermissions = await prisma.roleFunctionPermission.findMany({
      where: { role: 'area_coordinator' },
      include: {
        function: {
          select: {
            name: true,
            key: true
          }
        }
      }
    });
    
    console.log('\n🏢 Area Coordinator Permissions (for comparison):');
    areaCoordPermissions.forEach(perm => {
      console.log(`  - ${perm.function.name} (${perm.function.key}): ${perm.isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    });
    
  } catch (error) {
    console.error('❌ Error in debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCoordinatorPermissions();
