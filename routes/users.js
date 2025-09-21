const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { 
  requireAdmin, 
  requireAreaCoordinator, 
  requireCoordinator,
  canManageUser 
} = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/users
// @desc    Get all users based on role hierarchy
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, regionId, coordinatorId } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // Role-based filtering
    switch (req.user.role) {
      case 'superadmin':
      case 'admin':
        // Can see all users
        break;
      case 'area_coordinator':
        // Can see coordinators and agents in their region
        // Agents must be assigned to a coordinator in the same region
        whereClause.AND = [
          { regionId: req.user.regionId },
          { 
            OR: [
              { role: 'coordinator' },
              { 
                role: 'agent',
                coordinatorId: { not: null },
                coordinator: {
                  regionId: req.user.regionId
                }
              }
            ]
          }
        ];
        break;
      case 'coordinator':
        // Can see their agents
        whereClause.coordinatorId = req.user.id;
        break;
      case 'agent':
        // Can only see themselves
        whereClause.id = req.user.id;
        break;
    }

    // Additional filters
    if (role) whereClause.role = role;
    if (status) whereClause.status = status;
    if (regionId) whereClause.regionId = parseInt(regionId);
    if (coordinatorId) whereClause.coordinatorId = parseInt(coordinatorId);

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        region: true,
        coordinator: {
          include: {
            region: true
          }
        },
        balance: true,
        createdBy: {
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

    const total = await prisma.user.count({ where: whereClause });

    // Remove passwords from response
    const usersWithoutPasswords = users.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      success: true,
      data: usersWithoutPasswords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Check permissions
    const canAccess = await canManageUser(req.user.id, userId);
    if (!canAccess && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this user'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        region: true,
        coordinator: {
          include: {
            region: true
          }
        },
        balance: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', [
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Invalid phone number'),
  body('address').optional().isLength({ min: 5 }).withMessage('Address too short')
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

    const userId = parseInt(req.params.id);
    const { fullName, email, phone, address, status, regionId, coordinatorId } = req.body;

    // Check permissions
    const canAccess = await canManageUser(req.user.id, userId);
    if (!canAccess && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update this user'
      });
    }

    // Only allow certain fields to be updated by non-admin users
    const updateData = {};
    if (req.user.role === 'superadmin' || req.user.role === 'admin') {
      if (fullName) updateData.fullName = fullName;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = address;
      if (status) updateData.status = status;
      if (regionId) updateData.regionId = regionId;
      if (coordinatorId) updateData.coordinatorId = coordinatorId;
    } else {
      // Regular users can only update their own basic info
      if (fullName) updateData.fullName = fullName;
      if (email) updateData.email = email;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = address;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        region: true,
        coordinator: {
          include: {
            region: true
          }
        },
        balance: true
      }
    });

    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = updatedUser;

    res.json({
      success: true,
      message: 'User updated successfully',
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status
// @access  Private
router.put('/:id/status', requireCoordinator, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { status } = req.body;

    // Validate status
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended'
      });
    }

    // Cannot change own status
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own status'
      });
    }

    // Additional permission checks are handled by the requireCoordinator middleware
    // which includes role-based filtering for area coordinators

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { status }
    });

    res.json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : status === 'suspended' ? 'suspended' : 'deactivated'} successfully`,
      data: { id: updatedUser.id, status: updatedUser.status }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete by default, hard delete with force=true)
// @access  Private (Admin/SuperAdmin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { force } = req.query;

    // Cannot delete self
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Force delete: clean dependencies then delete
    if (force === 'true') {
      await prisma.$transaction(async (tx) => {
        // Clean dependent/owned records safely
        await tx.notification.deleteMany({ where: { userId } });
        await tx.drawResult.deleteMany({ where: { inputById: userId } });
        await tx.balanceTransaction.deleteMany({ where: { OR: [{ userId }, { processedById: userId }] } });
        await tx.userBalance.deleteMany({ where: { userId } });
        await tx.agentTicketTemplate.deleteMany({ where: { agentId: userId } });
        await tx.ticket.updateMany({ where: { agentId: userId }, data: { agentId: 1 } });
        await tx.ticket.updateMany({ where: { userId }, data: { userId: 1 } });
        await tx.sale.deleteMany({ where: { userId } });
        await tx.commission.deleteMany({ where: { userId } });

        // Null out optional relations where applicable
        await tx.ticketTemplate.updateMany({ where: { createdById: userId }, data: { createdById: null } });
        await tx.systemSetting.updateMany({ where: { updatedById: userId }, data: { updatedById: null } });
        await tx.user.updateMany({ where: { coordinatorId: userId }, data: { coordinatorId: null } });
        await tx.region.updateMany({ where: { areaCoordinatorId: userId }, data: { areaCoordinatorId: null } });

        // Finally delete the user
        await tx.user.delete({ where: { id: userId } });
      });

      return res.json({ success: true, message: 'User force-deleted successfully' });
    }

    // Try hard delete first; if blocked by foreign key constraints, fall back to soft delete
    try {
      await prisma.user.delete({
        where: { id: userId }
      });

      return res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (err) {
      // Prisma foreign key constraint error code
      const isFkError = err?.code === 'P2003' || /foreign key constraint/i.test(err?.message || '');
      if (!isFkError) {
        throw err;
      }

      // Soft delete: set status to inactive when there are linked records
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'inactive' }
      });

      return res.json({
        success: true,
        message: 'User deactivated instead of deleted due to linked records'
      });
    }

  } catch (error) {
    console.error('Delete user error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/users/hierarchy
// @desc    Get user hierarchy for management
// @access  Private
router.get('/hierarchy', async (req, res) => {
  try {
    let hierarchy = {};

    switch (req.user.role) {
      case 'superadmin':
      case 'admin':
        // Get all regions with their coordinators and agents
        hierarchy = await prisma.region.findMany({
          include: {
            areaCoordinator: {
              include: {
                agents: {
                  include: {
                    balance: true
                  }
                }
              }
            }
          }
        });
        break;

      case 'area_coordinator':
        // Get coordinators and agents in their region
        hierarchy = await prisma.user.findMany({
          where: {
            regionId: req.user.regionId,
            role: { in: ['coordinator', 'agent'] }
          },
          include: {
            agents: {
              include: {
                balance: true
              }
            },
            balance: true
          },
          orderBy: { role: 'asc' }
        });
        break;

      case 'coordinator':
        // Get their agents
        hierarchy = await prisma.user.findMany({
          where: {
            coordinatorId: req.user.id,
            role: 'agent'
          },
          include: {
            balance: true
          }
        });
        break;

      default:
        hierarchy = [];
    }

    res.json({
      success: true,
      data: hierarchy
    });

  } catch (error) {
    console.error('Get hierarchy error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    let whereClause = {};

    // Role-based filtering
    switch (req.user.role) {
      case 'superadmin':
      case 'admin':
        break;
      case 'area_coordinator':
        whereClause.regionId = req.user.regionId;
        break;
      case 'coordinator':
        whereClause.coordinatorId = req.user.id;
        break;
      case 'agent':
        whereClause.id = req.user.id;
        break;
    }

    const stats = await prisma.user.groupBy({
      by: ['role', 'status'],
      where: whereClause,
      _count: {
        id: true
      }
    });

    const totalUsers = await prisma.user.count({ where: whereClause });
    const activeUsers = await prisma.user.count({ 
      where: { ...whereClause, status: 'active' } 
    });

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole: stats
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;


