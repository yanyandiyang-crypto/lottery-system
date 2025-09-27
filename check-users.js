const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Total users found: ${users.length}\n`);
    
    if (users.length > 0) {
      console.log('👥 Users list:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.username} (${user.fullName || 'No full name'})`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No users found in database!');
      console.log('💡 You may need to:');
      console.log('   1. Create some users first');
      console.log('   2. Check if the database connection is working');
      console.log('   3. Run database migrations');
    }
    
    // Check user counts by role
    const roleCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true }
    });
    
    if (roleCounts.length > 0) {
      console.log('📈 Users by role:');
      roleCounts.forEach(({ role, _count }) => {
        console.log(`   ${role}: ${_count.id} users`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
