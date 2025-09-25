require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function resetUsers() {
  console.log('=== Starting User Reset Process ===');
  
  try {
    // Test connection first
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✓ Database connected');

    // Count existing users
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} existing users`);

    // Start the cleanup process
    console.log('\n--- Cleaning up database ---');
    
    // Delete in correct order to avoid foreign key constraints
    console.log('Deleting notifications...');
    const notificationResult = await prisma.notification.deleteMany({});
    console.log(`✓ Deleted ${notificationResult.count} notifications`);

    console.log('Deleting balance transactions...');
    const balanceTransResult = await prisma.balanceTransaction.deleteMany({});
    console.log(`✓ Deleted ${balanceTransResult.count} balance transactions`);

    console.log('Deleting user balances...');
    const balanceResult = await prisma.userBalance.deleteMany({});
    console.log(`✓ Deleted ${balanceResult.count} user balances`);

    console.log('Deleting tickets...');
    const ticketResult = await prisma.ticket.deleteMany({});
    console.log(`✓ Deleted ${ticketResult.count} tickets`);

    console.log('Deleting sales...');
    const salesResult = await prisma.sale.deleteMany({});
    console.log(`✓ Deleted ${salesResult.count} sales`);

    console.log('Deleting commissions...');
    const commissionResult = await prisma.commission.deleteMany({});
    console.log(`✓ Deleted ${commissionResult.count} commissions`);

    console.log('Deleting draw results...');
    const drawResult = await prisma.drawResult.deleteMany({});
    console.log(`✓ Deleted ${drawResult.count} draw results`);

    console.log('Deleting bet limits...');
    const betLimitResult = await prisma.betLimit.deleteMany({});
    console.log(`✓ Deleted ${betLimitResult.count} bet limits`);

    console.log('Deleting agent ticket templates...');
    const templateResult = await prisma.agentTicketTemplate.deleteMany({});
    console.log(`✓ Deleted ${templateResult.count} agent ticket templates`);

    console.log('Deleting ticket reprints...');
    const reprintResult = await prisma.ticketReprint.deleteMany({});
    console.log(`✓ Deleted ${reprintResult.count} ticket reprints`);

    // Update references to null before deleting users
    console.log('Updating region references...');
    await prisma.region.updateMany({
      data: { areaCoordinatorId: null }
    });
    console.log('✓ Updated region references');

    console.log('Updating ticket template references...');
    await prisma.ticketTemplate.updateMany({
      data: { createdById: null }
    });
    console.log('✓ Updated ticket template references');

    console.log('Updating system setting references...');
    await prisma.systemSetting.updateMany({
      data: { updatedById: null }
    });
    console.log('✓ Updated system setting references');

    console.log('Updating prize configuration references...');
    await prisma.prizeConfiguration.updateMany({
      data: { 
        createdById: null,
        updatedById: null 
      }
    });
    console.log('✓ Updated prize configuration references');

    // Finally delete all users
    console.log('Deleting all users...');
    const userDeleteResult = await prisma.user.deleteMany({});
    console.log(`✓ Deleted ${userDeleteResult.count} users`);

    // Create new superadmin
    console.log('\n--- Creating new superadmin ---');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const superadmin = await prisma.user.create({
      data: {
        username: 'superadmin',
        passwordHash: hashedPassword,
        fullName: 'Super Administrator',
        email: 'admin@lottery.com',
        role: 'superadmin',
        status: 'active'
      }
    });

    console.log('✓ Created superadmin:', {
      id: superadmin.id,
      username: superadmin.username,
      fullName: superadmin.fullName,
      role: superadmin.role
    });

    // Create balance for superadmin
    await prisma.userBalance.create({
      data: {
        userId: superadmin.id,
        currentBalance: 0,
        lastUpdated: new Date()
      }
    });
    console.log('✓ Created superadmin balance');

    console.log('\n🎉 Reset completed successfully!');
    console.log('=================================');
    console.log('New superadmin credentials:');
    console.log('Username: superadmin');
    console.log('Password: admin123');
    console.log('=================================');

  } catch (error) {
    console.error('❌ Error during reset:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed');
  }
}

resetUsers();
