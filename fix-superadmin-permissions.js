const { PrismaClient } = require('@prisma/client');

async function fixSuperadminPermissions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Adding superadmin permissions to all system functions...\n');
    
    // Get all system functions
    const functions = await prisma.systemFunction.findMany();
    console.log(`Found ${functions.length} system functions`);
    
    // Check existing superadmin permissions
    const existingPermissions = await prisma.roleFunctionPermission.findMany({
      where: { role: 'superadmin' }
    });
    console.log(`Existing superadmin permissions: ${existingPermissions.length}`);
    
    // Create superadmin permissions for all functions
    const newPermissions = [];
    
    for (const func of functions) {
      // Check if permission already exists
      const exists = existingPermissions.find(p => p.functionId === func.id);
      
      if (!exists) {
        newPermissions.push({
          role: 'superadmin',
          functionId: func.id,
          isEnabled: true
        });
      }
    }
    
    if (newPermissions.length > 0) {
      await prisma.roleFunctionPermission.createMany({
        data: newPermissions
      });
      console.log(`✅ Created ${newPermissions.length} new superadmin permissions`);
      
      // Show which functions got permissions
      console.log('\nFunctions with new superadmin permissions:');
      for (const permission of newPermissions) {
        const func = functions.find(f => f.id === permission.functionId);
        console.log(`   • ${func.name} (${func.category})`);
      }
    } else {
      console.log('✅ All superadmin permissions already exist');
    }
    
    // Verify final state
    const finalPermissions = await prisma.roleFunctionPermission.findMany({
      where: { role: 'superadmin' },
      include: { function: true }
    });
    
    console.log(`\n📊 Total superadmin permissions: ${finalPermissions.length}`);
    console.log('Superadmin has access to:');
    finalPermissions.forEach(p => {
      console.log(`   • ${p.function.name} (${p.function.category})`);
    });
    
  } catch (error) {
    console.log('❌ Error fixing superadmin permissions:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixSuperadminPermissions();
