const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// @route   POST /api/database-reset
// @desc    Reset all users and create fresh superadmin
// @access  Public (for setup only - should be removed in production)
router.post('/reset-users', async (req, res) => {
  try {
    console.log('Starting database reset...');

    await prisma.$transaction(async (tx) => {
      // Delete all dependent records first
      console.log('Deleting notifications...');
      await tx.notification.deleteMany({});
      
      console.log('Deleting balance transactions...');
      await tx.balanceTransaction.deleteMany({});
      
      console.log('Deleting user balances...');
      await tx.userBalance.deleteMany({});
      
      console.log('Deleting tickets...');
      await tx.ticket.deleteMany({});
      
      console.log('Deleting sales...');
      await tx.sale.deleteMany({});
      
      console.log('Deleting commissions...');
      await tx.commission.deleteMany({});
      
      console.log('Deleting draw results...');
      await tx.drawResult.deleteMany({});
      
      console.log('Deleting bet limits...');
      await tx.betLimit.deleteMany({});
      
      console.log('Deleting agent ticket templates...');
      await tx.agentTicketTemplate.deleteMany({});
      
      console.log('Deleting ticket reprints...');
      await tx.ticketReprint.deleteMany({});

      // Update references to null
      console.log('Updating region references...');
      await tx.region.updateMany({
        data: { areaCoordinatorId: null }
      });
      
      console.log('Updating ticket template references...');
      await tx.ticketTemplate.updateMany({
        data: { createdById: null }
      });
      
      console.log('Updating system setting references...');
      await tx.systemSetting.updateMany({
        data: { updatedById: null }
      });
      
      console.log('Updating prize configuration references...');
      await tx.prizeConfiguration.updateMany({
        data: { 
          createdById: null,
          updatedById: null 
        }
      });

      // Delete all users
      console.log('Deleting all users...');
      const deletedUsers = await tx.user.deleteMany({});
      console.log(`Deleted ${deletedUsers.count} users`);

      // Create new superadmin
      console.log('Creating new superadmin...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const superadmin = await tx.user.create({
        data: {
          username: 'superadmin',
          passwordHash: hashedPassword,
          fullName: 'Super Administrator',
          email: 'admin@lottery.com',
          role: 'superadmin',
          status: 'active'
        }
      });

      // Create balance for superadmin
      await tx.userBalance.create({
        data: {
          userId: superadmin.id,
          currentBalance: 0,
          lastUpdated: new Date()
        }
      });

      console.log('Database reset completed successfully');
      
      return {
        deletedUsers: deletedUsers.count,
        superadmin: {
          id: superadmin.id,
          username: superadmin.username,
          fullName: superadmin.fullName,
          role: superadmin.role
        }
      };
    });

    res.json({
      success: true,
      message: 'Database reset completed successfully',
      credentials: {
        username: 'superadmin',
        password: 'admin123'
      },
      note: 'Please change the password after first login'
    });

  } catch (error) {
    console.error('Database reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting database',
      error: error.message
    });
  }
});

// @route   GET /api/database-reset/status
// @desc    Check current user count
// @access  Public
router.get('/status', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        status: true
      }
    });

    res.json({
      success: true,
      userCount,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking status',
      error: error.message
    });
  }
});

module.exports = router;
