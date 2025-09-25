const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin, requireAreaCoordinator, requireCoordinator, roleCheck } = require('../middleware/roleCheck');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// @route   POST /api/v1/balance-management/load
// @desc    Load balance for subordinates based on hierarchy
// @access  Coordinator and above
router.post('/load', requireAuth, requireCoordinator, [
  body('userId').isInt().withMessage('User ID is required'),
  body('amount').isFloat().withMessage('Amount must be a valid number'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, amount, description } = req.body;
    const currentUser = req.user;

    // Validate amount is not zero
    if (amount === 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount cannot be zero'
      });
    }

    // Check if target user exists and has valid role
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { balance: true }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hierarchical permission check
    let canLoad = false;
    
    if (currentUser.role === 'superadmin' || currentUser.role === 'admin') {
      // Superadmin and Admin can load to anyone
      canLoad = ['area_coordinator', 'coordinator', 'agent'].includes(targetUser.role);
    } else if (currentUser.role === 'area_coordinator') {
      // Area coordinators can only load to coordinators and agents in their region
      canLoad = targetUser.regionId === currentUser.regionId && 
                ['coordinator', 'agent'].includes(targetUser.role);
    } else if (currentUser.role === 'coordinator') {
      // Coordinators can only load to their agents
      canLoad = targetUser.coordinatorId === currentUser.id && targetUser.role === 'agent';
    }

    if (!canLoad) {
      return res.status(403).json({
        success: false,
        message: 'You can only load balance to your subordinates'
      });
    }

    // Check if current user has sufficient balance (except for superadmin/admin)
    if (currentUser.role !== 'superadmin' && currentUser.role !== 'admin') {
      const currentUserBalance = await prisma.userBalance.findUnique({
        where: { userId: currentUser.id }
      });

      if (!currentUserBalance || currentUserBalance.currentBalance < parseFloat(amount)) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance to perform this transaction'
        });
      }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create or update user balance
      const updatedBalance = await tx.userBalance.upsert({
        where: { userId: userId },
        update: {
          currentBalance: {
            increment: amount
          },
          lastUpdated: require('../utils/philippineTime').now()
        },
        create: {
          userId: userId,
          currentBalance: amount,
          lastUpdated: require('../utils/philippineTime').now()
        }
      });

      // Deduct from current user's balance if not superadmin/admin
      if (currentUser.role !== 'superadmin' && currentUser.role !== 'admin') {
        await tx.userBalance.upsert({
          where: { userId: currentUser.id },
          update: {
            currentBalance: {
              decrement: amount
            },
            lastUpdated: require('../utils/philippineTime').now()
          },
          create: {
            userId: currentUser.id,
            currentBalance: -amount,
            lastUpdated: require('../utils/philippineTime').now()
          }
        });

        // Create deduction transaction for current user
        await tx.balanceTransaction.create({
          data: {
            userId: currentUser.id,
            amount: -amount,
            transactionType: 'deduct',
            description: `Balance transferred to ${targetUser.fullName}`,
            processedById: currentUser.id
          }
        });
      }

      // Create balance transaction record for target user
      await tx.balanceTransaction.create({
        data: {
          userId: userId,
          amount: amount,
          transactionType: 'load',
          description: description || `Balance loaded by ${currentUser.fullName}`,
          processedById: currentUser.id
        }
      });

      return updatedBalance;
    });

    res.json({
      success: true,
      message: amount > 0 ? 'Balance loaded successfully' : 'Balance deducted successfully',
      data: {
        userId: userId,
        newBalance: result.currentBalance,
        amountLoaded: amount
      }
    });

  } catch (error) {
    console.error('Balance load error:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading balance'
    });
  }
});

// @route   GET /api/v1/balance-management/users
// @desc    Get users eligible for balance loading based on role hierarchy
// @access  Area Coordinator and above
router.get('/users', requireAuth, roleCheck(['superadmin', 'admin', 'area_coordinator', 'coordinator']), async (req, res) => {
  try {
    const currentUser = req.user;
    let whereClause = {
      status: 'active'
    };

    // Filter users based on current user's role and hierarchy
    if (currentUser.role === 'superadmin' || currentUser.role === 'admin') {
      // Superadmin and Admin can see all users
      whereClause.role = {
        in: ['area_coordinator', 'coordinator', 'agent']
      };
    } else if (currentUser.role === 'area_coordinator') {
      // Area coordinators can only see coordinators and agents under their supervision
      // Since regionId might be null, we filter by coordinatorId relationship
      whereClause = {
        ...whereClause,
        OR: [
          {
            role: 'coordinator',
            coordinatorId: currentUser.id  // Coordinators assigned to this Area Coordinator
          },
          {
            role: 'agent',
            coordinator: {
              coordinatorId: currentUser.id  // Agents under coordinators assigned to this Area Coordinator
            }
          }
        ]
      };
    } else if (currentUser.role === 'coordinator') {
      // Coordinators can only see their agents
      whereClause = {
        ...whereClause,
        coordinatorId: currentUser.id,
        role: 'agent'
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        balance: true,
        coordinator: {
          select: { id: true, fullName: true }
        },
        region: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { role: 'asc' },
        { fullName: 'asc' }
      ]
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      role: user.role,
      agentId: user.agentId,
      currentBalance: user.balance?.currentBalance || 0,
      coordinator: user.coordinator,
      region: user.region,
      status: user.status
    }));

    res.json({
      success: true,
      data: formattedUsers
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// @route   GET /api/v1/balance-management/transactions/:userId
// @desc    Get balance transaction history for a user
// @access  Coordinator and above
router.get('/transactions/:userId', requireAuth, requireCoordinator, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.balanceTransaction.findMany({
        where: { userId: parseInt(userId) },
        include: {
          processedBy: {
            select: { id: true, fullName: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: skip,
        take: parseInt(limit)
      }),
      prisma.balanceTransaction.count({
        where: { userId: parseInt(userId) }
      })
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
});

// @route   POST /api/v1/balance-management/deduct
// @desc    Deduct balance from user and return to coordinator
// @access  Coordinator and above
router.post('/deduct', requireAuth, requireCoordinator, [
  body('userId').isInt().withMessage('User ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').isString().withMessage('Description is required'),
  body('referenceId').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, amount, description, referenceId } = req.body;
    const currentUser = req.user;

    // Check if target user exists and validate permissions
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { balance: true }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hierarchical permission check
    let canDeduct = false;
    
    if (currentUser.role === 'superadmin' || currentUser.role === 'admin') {
      canDeduct = ['area_coordinator', 'coordinator', 'agent'].includes(targetUser.role);
    } else if (currentUser.role === 'area_coordinator') {
      canDeduct = targetUser.regionId === currentUser.regionId && 
                  ['coordinator', 'agent'].includes(targetUser.role);
    } else if (currentUser.role === 'coordinator') {
      canDeduct = targetUser.coordinatorId === currentUser.id && targetUser.role === 'agent';
    }

    if (!canDeduct) {
      return res.status(403).json({
        success: false,
        message: 'You can only deduct balance from your subordinates'
      });
    }

    // Check user balance
    const userBalance = await prisma.userBalance.findUnique({
      where: { userId: userId }
    });

    if (!userBalance || userBalance.currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct from target user
      const updatedBalance = await tx.userBalance.update({
        where: { userId: userId },
        data: {
          currentBalance: {
            decrement: amount
          },
          lastUpdated: require('../utils/philippineTime').now()
        }
      });

      // Add to current user's balance if not superadmin/admin
      if (currentUser.role !== 'superadmin' && currentUser.role !== 'admin') {
        await tx.userBalance.upsert({
          where: { userId: currentUser.id },
          update: {
            currentBalance: {
              increment: amount
            },
            lastUpdated: require('../utils/philippineTime').now()
          },
          create: {
            userId: currentUser.id,
            currentBalance: amount,
            lastUpdated: require('../utils/philippineTime').now()
          }
        });

        // Create credit transaction for current user
        await tx.balanceTransaction.create({
          data: {
            userId: currentUser.id,
            amount: amount,
            transactionType: 'load',
            description: `Balance recovered from ${targetUser.fullName}`,
            processedById: currentUser.id
          }
        });
      }

      // Create deduction transaction for target user
      await tx.balanceTransaction.create({
        data: {
          userId: userId,
          amount: -amount,
          transactionType: 'deduct',
          description: description || `Balance deducted by ${currentUser.fullName}`,
          referenceId: referenceId,
          processedById: currentUser.id
        }
      });

      return updatedBalance;
    });

    res.json({
      success: true,
      message: 'Balance deducted successfully',
      data: {
        userId: userId,
        newBalance: result.currentBalance,
        amountDeducted: amount
      }
    });

  } catch (error) {
    console.error('Balance deduct error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deducting balance'
    });
  }
});

module.exports = router;
