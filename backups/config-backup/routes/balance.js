const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { requireAdmin, requireAreaCoordinator, requireCoordinator, requireAgent } = require('../middleware/roleCheck');
const { emitBalanceUpdate } = require('../utils/socket');

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/balance/current
// @desc    Get current user's balance
// @access  Private
router.get('/current', requireAgent, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    const userId = parseInt(req.user.id);

    const balance = await prisma.userBalance.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true
          }
        }
      }
    });

    if (!balance) {
      // Create balance if it doesn't exist
      const newBalance = await prisma.userBalance.create({
        data: {
          userId,
          currentBalance: 0
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              role: true
            }
          }
        }
      });

      return res.json({
        success: true,
        data: newBalance,
        currentBalance: newBalance.currentBalance
      });
    }

    res.json({
      success: true,
      data: balance,
      currentBalance: balance.currentBalance
    });

  } catch (error) {
    console.error('Get current balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/balance/:userId
// @desc    Get user balance
// @access  Private
router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    // Check permissions
    if (req.user.role === 'agent' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view this balance'
      });
    }

    const balance = await prisma.userBalance.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true
          }
        }
      }
    });

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'Balance not found'
      });
    }

    res.json({
      success: true,
      data: balance,
      currentBalance: balance.currentBalance
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/balance/:userId/load
// @desc    Load credits to user balance
// @access  Private (Admin/AreaCoordinator/Coordinator)
router.post('/:userId/load', requireAreaCoordinator, [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least 1 peso'),
  body('description').optional().isLength({ min: 5 }).withMessage('Description too short')
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

    const userId = parseInt(req.params.userId);
    const { amount, description } = req.body;

    // Check if user exists and can be managed
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        region: true,
        coordinator: true
      }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions based on role
    let canManage = false;
    switch (req.user.role) {
      case 'superadmin':
      case 'admin':
        canManage = true;
        break;
      case 'area_coordinator':
        canManage = targetUser.regionId === req.user.regionId;
        break;
      case 'coordinator':
        canManage = targetUser.coordinatorId === req.user.id;
        break;
    }

    if (!canManage) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to load balance for this user'
      });
    }

    // Get or create user balance
    let userBalance = await prisma.userBalance.findUnique({
      where: { userId }
    });

    if (!userBalance) {
      userBalance = await prisma.userBalance.create({
        data: {
          userId,
          currentBalance: 0,
          totalLoaded: 0,
          totalUsed: 0
        }
      });
    }

    // Update balance
    const updatedBalance = await prisma.userBalance.update({
      where: { userId },
      data: {
        currentBalance: userBalance.currentBalance + amount,
        totalLoaded: userBalance.totalLoaded + amount
      }
    });

    // Create transaction record
    const transaction = await prisma.balanceTransaction.create({
      data: {
        userId,
        amount,
        transactionType: 'load',
        referenceNumber: generateReferenceNumber(),
        description: description || `Balance loaded by ${req.user.fullName}`,
        processedById: req.user.id
      }
    });

    // Emit real-time balance update
    emitBalanceUpdate(userId, updatedBalance);

    res.json({
      success: true,
      message: 'Balance loaded successfully',
      data: {
        balance: updatedBalance,
        transaction
      }
    });

  } catch (error) {
    console.error('Load balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/balance/:userId/transactions
// @desc    Get user balance transactions
// @access  Private
router.get('/:userId/transactions', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    // Check permissions
    if (req.user.role === 'agent' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view these transactions'
      });
    }

    let whereClause = { userId };

    // Additional filters
    if (type) whereClause.transactionType = type;
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const transactions = await prisma.balanceTransaction.findMany({
      where: whereClause,
      include: {
        processedBy: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      },
      skip: offset,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.balanceTransaction.count({ where: whereClause });

    res.json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/balance/summary
// @desc    Get balance summary for user hierarchy
// @access  Private
router.get('/summary', async (req, res) => {
  try {
    let whereClause = {};

    // Role-based filtering
    switch (req.user.role) {
      case 'superadmin':
      case 'admin':
        // Can see all balances
        break;
      case 'area_coordinator':
        // Can see balances in their region
        whereClause.user = {
          regionId: req.user.regionId
        };
        break;
      case 'coordinator':
        // Can see balances of their agents
        whereClause.user = {
          coordinatorId: req.user.id
        };
        break;
      case 'agent':
        // Can only see their own balance
        whereClause.userId = req.user.id;
        break;
    }

    const balances = await prisma.userBalance.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true,
            region: {
              select: {
                id: true,
                name: true
              }
            },
            coordinator: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      },
      orderBy: { currentBalance: 'desc' }
    });

    // Calculate summary statistics
    const totalBalance = balances.reduce((sum, balance) => sum + balance.currentBalance, 0);
    const totalLoaded = balances.reduce((sum, balance) => sum + balance.totalLoaded, 0);
    const totalUsed = balances.reduce((sum, balance) => sum + balance.totalUsed, 0);

    res.json({
      success: true,
      data: {
        balances,
        summary: {
          totalUsers: balances.length,
          totalBalance,
          totalLoaded,
          totalUsed
        }
      }
    });

  } catch (error) {
    console.error('Get balance summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/balance/:userId/refund
// @desc    Refund amount to user balance
// @access  Private (Admin/AreaCoordinator/Coordinator)
router.post('/:userId/refund', requireAreaCoordinator, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').notEmpty().withMessage('Description is required')
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

    const userId = parseInt(req.params.userId);
    const { amount, description } = req.body;

    // Check if user exists and can be managed
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        region: true,
        coordinator: true
      }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions based on role
    let canManage = false;
    switch (req.user.role) {
      case 'superadmin':
      case 'admin':
        canManage = true;
        break;
      case 'area_coordinator':
        canManage = targetUser.regionId === req.user.regionId;
        break;
      case 'coordinator':
        canManage = targetUser.coordinatorId === req.user.id;
        break;
    }

    if (!canManage) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to refund balance for this user'
      });
    }

    // Get user balance
    const userBalance = await prisma.userBalance.findUnique({
      where: { userId }
    });

    if (!userBalance) {
      return res.status(404).json({
        success: false,
        message: 'User balance not found'
      });
    }

    // Update balance
    const updatedBalance = await prisma.userBalance.update({
      where: { userId },
      data: {
        currentBalance: userBalance.currentBalance + amount,
        totalLoaded: userBalance.totalLoaded + amount
      }
    });

    // Create transaction record
    const transaction = await prisma.balanceTransaction.create({
      data: {
        userId,
        amount,
        transactionType: 'refund',
        referenceNumber: generateReferenceNumber(),
        description: `Refund: ${description}`,
        processedById: req.user.id
      }
    });

    // Emit real-time balance update
    emitBalanceUpdate(userId, updatedBalance);

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        balance: updatedBalance,
        transaction
      }
    });

  } catch (error) {
    console.error('Refund balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to generate reference number
function generateReferenceNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `REF${timestamp.slice(-8)}${random}`;
}

module.exports = router;


