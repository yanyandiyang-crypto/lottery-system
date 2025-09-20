const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugFunctionManagement() {
  try {
    console.log('=== Debugging Function Management ===');
    
    // Check if SystemFunction table exists and has data
    console.log('1. Checking SystemFunction table...');
    const functions = await prisma.systemFunction.findMany();
    console.log('Functions found:', functions.length);
    console.log('Sample functions:', functions.slice(0, 3));
    
    // Check if RoleFunctionPermission table exists and has data
    console.log('\n2. Checking RoleFunctionPermission table...');
    const permissions = await prisma.roleFunctionPermission.findMany();
    console.log('Permissions found:', permissions.length);
    console.log('Sample permissions:', permissions.slice(0, 3));
    
    // Test the specific query that's failing
    console.log('\n3. Testing agent permissions query...');
    const agentPermissions = await prisma.roleFunctionPermission.findMany({
      where: { 
        role: 'agent',
        isEnabled: true,
        function: {
          isActive: true
        }
      },
      include: {
        function: true
      }
    });
    console.log('Agent permissions:', agentPermissions);
    
  } catch (error) {
    console.error('Error during debug:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
  } finally {
    await prisma.$disconnect();
  }
}

debugFunctionManagement();
