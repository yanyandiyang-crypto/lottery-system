const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetUsers() {
  try {
    console.log('Starting user reset process...');
    console.log('Connecting to database...');

    await prisma.$transaction(async (tx) => {
      console.log('Cleaning up all user-related data...');

      // Delete all dependent records first
      await tx.notification.deleteMany({});
      console.log('✓ Deleted notifications');

      await tx.drawResult.deleteMany({});
      console.log('✓ Deleted draw results');

      await tx.balanceTransaction.deleteMany({});
      console.log('✓ Deleted balance transactions');

      await tx.userBalance.deleteMany({});
      console.log('✓ Deleted user balances');

      await tx.agentTicketTemplate.deleteMany({});
      console.log('✓ Deleted agent ticket templates');

      await tx.sale.deleteMany({});
      console.log('✓ Deleted sales');

      await tx.commission.deleteMany({});
      console.log('✓ Deleted commissions');

      await tx.ticketReprint.deleteMany({});
      console.log('✓ Deleted ticket reprints');

      await tx.betLimit.deleteMany({});
      console.log('✓ Deleted bet limits');

      await tx.ticket.deleteMany({});
      console.log('✓ Deleted tickets');

      // Clean up audit tables if they exist
      try {
        await tx.$executeRawUnsafe('DELETE FROM audit_log');
        console.log('✓ Deleted audit logs');
      } catch (e) {
        console.log('- Audit log table not found, skipping');
      }

      try {
        await tx.$executeRawUnsafe('DELETE FROM login_audit');
        console.log('✓ Deleted login audit');
      } catch (e) {
        console.log('- Login audit table not found, skipping');
      }

      // Update references to null
      await tx.ticketTemplate.updateMany({
        data: { createdById: null }
      });
      console.log('✓ Nullified ticket template references');

      await tx.systemSetting.updateMany({
        data: { updatedById: null }
      });
      console.log('✓ Nullified system setting references');

      // PrizeConfiguration table may not exist in some deployments; check via information_schema
      const prizeConfigExistsRows = await tx.$queryRawUnsafe(
        "SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'prize_configurations'"
      );
      const hasPrizeConfigTable = Array.isArray(prizeConfigExistsRows) && prizeConfigExistsRows[0] && prizeConfigExistsRows[0].count > 0;
      if (hasPrizeConfigTable) {
        await tx.$executeRawUnsafe('DELETE FROM "prize_configurations"');
        console.log('✓ Deleted prize configurations');
      } else {
        console.log('- PrizeConfiguration table not found, skipping');
      }

      await tx.region.updateMany({
        data: { areaCoordinatorId: null }
      });
      console.log('✓ Nullified region coordinator references');

      // Finally delete all users
      await tx.user.deleteMany({});
      console.log('✓ Deleted all users');

      // Create new superadmin user
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const superadmin = await tx.user.create({
        data: {
          username: 'superadmin',
          passwordHash: hashedPassword,
          fullName: 'Super Administrator',
          email: 'admin@lottery.com',
          role: 'superadmin',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log('✓ Created new superadmin user:', {
        id: superadmin.id,
        username: superadmin.username,
        fullName: superadmin.fullName,
        role: superadmin.role
      });

      // Create balance for superadmin
      await tx.userBalance.create({
        data: {
          userId: superadmin.id,
          currentBalance: 0,
          lastUpdated: new Date()
        }
      });
      console.log('✓ Created superadmin balance');
    });

    console.log('\n🎉 User reset completed successfully!');
    console.log('New superadmin credentials:');
    console.log('Username: superadmin');
    console.log('Password: admin123');
    console.log('\nPlease change the password after first login.');

  } catch (error) {
    console.error('❌ Error during user reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the reset
resetUsers()
  .then(() => {
    console.log('Process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Process failed:', error);
    process.exit(1);
  });
