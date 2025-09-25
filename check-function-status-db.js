const { PrismaClient } = require('@prisma/client');

async function checkFunctionStatusDB() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking Function Management status from database...\n');
    
    // Get all functions with their permissions
    const functions = await prisma.systemFunction.findMany({
      include: {
        rolePermissions: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });
    
    console.log(`Found ${functions.length} system functions\n`);
    
    // Check status for each function
    let totalInactive = 0;
    let functionsWithInactivePermissions = [];
    
    functions.forEach(func => {
      console.log(`📋 ${func.name} (${func.category})`);
      
      if (func.rolePermissions && func.rolePermissions.length > 0) {
        let hasInactive = false;
        console.log('   Permissions:');
        
        func.rolePermissions.forEach(perm => {
          const status = perm.isEnabled ? '✅ ACTIVE' : '❌ INACTIVE';
          console.log(`     • ${perm.role}: ${status}`);
          
          if (!perm.isEnabled) {
            hasInactive = true;
            totalInactive++;
          }
        });
        
        if (hasInactive) {
          functionsWithInactivePermissions.push(func.name);
        }
      } else {
        console.log('   ❌ NO PERMISSIONS');
      }
      console.log('');
    });
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log('='.repeat(40));
    console.log(`Total Functions: ${functions.length}`);
    console.log(`Functions with inactive permissions: ${functionsWithInactivePermissions.length}`);
    console.log(`Total inactive permission entries: ${totalInactive}`);
    
    if (functionsWithInactivePermissions.length > 0) {
      console.log('\n❌ Functions with INACTIVE permissions:');
      functionsWithInactivePermissions.forEach(name => {
        console.log(`   • ${name}`);
      });
      
      console.log('\n🔧 To fix inactive functions, run:');
      console.log('   UPDATE role_function_permissions SET "isEnabled" = true WHERE "isEnabled" = false;');
    } else {
      console.log('\n✅ All function permissions are ACTIVE');
    }
    
    // Check for missing superadmin permissions
    const superadminPermissions = await prisma.roleFunctionPermission.count({
      where: { role: 'superadmin' }
    });
    
    console.log(`\nSuperadmin permissions: ${superadminPermissions}/${functions.length}`);
    
    if (superadminPermissions < functions.length) {
      console.log('⚠️  Superadmin missing some function permissions');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFunctionStatusDB();
