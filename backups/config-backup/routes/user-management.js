const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin, requireAreaCoordinator } = require('../middleware/roleCheck');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/v1/user-management
// @desc    Get users with filtering
// @access  Admin/SuperAdmin/Area Coordinator/Coordinator
router.get('/', requireAuth, requireAreaCoordinator, async (req, res) => {
  try {
    console.log('User management GET route called by:', req.user.role, req.user.id);
    console.log('Area Coordinator regionId:', req.user.regionId);
    const { role, status, coordinatorId, areaCoordinatorId } = req.query;
    
    let whereClause = {};
    
    // Role-based filtering (this takes precedence over query parameters)
    if (req.user.role === 'superadmin' || req.user.role === 'admin') {
      // Superadmin and Admin can see all users
      // No additional filtering needed
    } else if (req.user.role === 'area_coordinator') {
      // Area coordinators can only see coordinators and agents in their region
      whereClause = {
        ...whereClause,
        regionId: req.user.regionId,
        OR: [
          {
            role: 'coordinator'
          },
          {
            role: 'agent'
          }
        ]
      };
    } else if (req.user.role === 'coordinator') {
      // Coordinators can only see their assigned agents
      whereClause = {
        ...whereClause,
        coordinatorId: req.user.id,
        role: 'agent'
      };
    }
    
    // Additional filters (only applied if they don't conflict with role-based filtering)
    if (role && (req.user.role === 'superadmin' || req.user.role === 'admin')) {
      whereClause.role = role;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    // Only apply coordinatorId filter if user has permission to see that coordinator's agents
    if (coordinatorId && (req.user.role === 'superadmin' || req.user.role === 'admin')) {
      whereClause.coordinatorId = parseInt(coordinatorId);
    }

    // Only apply areaCoordinatorId filter if user has permission to see that area coordinator's users
    if (areaCoordinatorId && (req.user.role === 'superadmin' || req.user.role === 'admin')) {
      whereClause.coordinatorId = parseInt(areaCoordinatorId);
    }

    console.log('Final where clause:', JSON.stringify(whereClause, null, 2));

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        coordinator: {
          select: { id: true, fullName: true, regionId: true }
        },
        region: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('Users found:', users.length);

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// @route   POST /api/v1/users
// @desc    Create new user
// @access  Admin/SuperAdmin only
router.post('/', requireAuth, requireAdmin, [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('role').isIn(['agent', 'coordinator', 'area_coordinator', 'admin', 'superadmin']).withMessage('Invalid role'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isString(),
  body('regionName').optional().isString().withMessage('Region name must be a string'),
  body('coordinatorId').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return Number.isInteger(parseInt(value));
  }).withMessage('Coordinator ID must be a valid integer or null'),
  body('areaCoordinatorId').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return Number.isInteger(parseInt(value));
  }).withMessage('Area Coordinator ID must be a valid integer or null'),
  body('assignedCoordinators').optional().isArray(),
  body('assignedAgents').optional().isArray()
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

    const { 
      username, 
      password, 
      fullName, 
      email, 
      phone, 
      role, 
      coordinatorId, 
      areaCoordinatorId,
      assignedCoordinators,
      assignedAgents,
      status = 'active',
      regionName 
    } = req.body;

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user data
    const userData = {
      username,
      passwordHash: hashedPassword,
      fullName,
      email,
      phone,
      role,
      status,
      createdById: req.user.id
    };

    // Add hierarchical assignments based on role
    if (role === 'agent' && coordinatorId) {
      userData.coordinatorId = parseInt(coordinatorId);
    }
    
    if (role === 'coordinator' && areaCoordinatorId) {
      userData.coordinatorId = parseInt(areaCoordinatorId); // coordinators are assigned to area coordinators via coordinatorId
    }

    // Create user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // If creating an area coordinator and a regionName is provided, create or link region
      if (role === 'area_coordinator' && regionName && regionName.trim().length > 0) {
        const normalizedName = regionName.trim();
        let region = await tx.region.findUnique({ where: { name: normalizedName } });
        if (!region) {
          region = await tx.region.create({ data: { name: normalizedName } });
        }
        userData.regionId = region.id;
      }

      // Create the user
      const newUser = await tx.user.create({
        data: userData,
        include: {
          coordinator: {
            select: { id: true, fullName: true }
          }
        }
      });

      // If we created/linked a region for area coordinator, set the area's areaCoordinatorId to this new user
      if (role === 'area_coordinator' && userData.regionId) {
        await tx.region.update({
          where: { id: userData.regionId },
          data: { areaCoordinatorId: newUser.id }
        });
      }

      // Handle coordinator assignments for area coordinators
      if (role === 'area_coordinator' && assignedCoordinators && assignedCoordinators.length > 0) {
        await tx.user.updateMany({
          where: {
            id: { in: assignedCoordinators.map(id => parseInt(id)) },
            role: 'coordinator'
          },
          data: {
            coordinatorId: newUser.id
          }
        });
      }

      // Handle agent assignments for coordinators
      if (role === 'coordinator' && assignedAgents && assignedAgents.length > 0) {
        await tx.user.updateMany({
          where: {
            id: { in: assignedAgents.map(id => parseInt(id)) },
            role: 'agent'
          },
          data: {
            coordinatorId: newUser.id
          }
        });
      }

      // Create initial balance for agents and coordinators
      if (['agent', 'coordinator', 'area_coordinator'].includes(role)) {
        await tx.userBalance.create({
          data: {
            userId: newUser.id,
            currentBalance: 0,
            lastUpdated: new Date()
          }
        });
      }

      return newUser;
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: result
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

// @route   PUT /api/v1/users/:id
// @desc    Update user
// @access  Admin/SuperAdmin only
router.put('/:id', requireAuth, requireAdmin, [
  body('username').optional().notEmpty().withMessage('Username cannot be empty'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isString(),
  body('coordinatorId').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return Number.isInteger(parseInt(value));
  }).withMessage('Coordinator ID must be a valid integer or null'),
  body('areaCoordinatorId').optional().custom((value) => {
    if (value === null || value === undefined || value === '') return true;
    return Number.isInteger(parseInt(value));
  }).withMessage('Area Coordinator ID must be a valid integer or null'),
  body('assignedCoordinators').optional().isArray(),
  body('assignedAgents').optional().isArray(),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('PUT Validation errors:', errors.array());
      console.log('PUT Request body:', req.body);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { 
      username, 
      password, 
      fullName, 
      email, 
      phone, 
      coordinatorId, 
      areaCoordinatorId,
      assignedCoordinators,
      assignedAgents,
      status 
    } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if username is taken by another user
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username }
      });

      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (username) updateData.username = username;
    if (fullName) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (status) updateData.status = status;
    
    // Hash password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    // Handle hierarchical assignments
    // Agent ⇄ Coordinator assignment via coordinatorId
    if (coordinatorId !== undefined) {
      updateData.coordinatorId = coordinatorId ? parseInt(coordinatorId) : null;
    }

    // Coordinator ⇄ Area Coordinator assignment via areaCoordinatorId
    // We store area coordinator on the same coordinatorId field for coordinators
    if (areaCoordinatorId !== undefined && existingUser.role === 'coordinator') {
      updateData.coordinatorId = areaCoordinatorId ? parseInt(areaCoordinatorId) : null;
    }

    // Update user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the user
      const updatedUser = await tx.user.update({
        where: { id: parseInt(id) },
        data: updateData,
        include: {
          coordinator: {
            select: { id: true, fullName: true }
          }
        }
      });

      // Handle coordinator assignments for area coordinators
      if (existingUser.role === 'area_coordinator' && assignedCoordinators !== undefined) {
        // First, remove this area coordinator from all coordinators
        await tx.user.updateMany({
          where: {
            coordinatorId: parseInt(id),
            role: 'coordinator'
          },
          data: {
            coordinatorId: null
          }
        });

        // Then assign selected coordinators
        if (assignedCoordinators.length > 0) {
          await tx.user.updateMany({
            where: {
              id: { in: assignedCoordinators.map(cId => parseInt(cId)) },
              role: 'coordinator'
            },
            data: {
              coordinatorId: parseInt(id)
            }
          });
        }
      }

      // Handle agent assignments for coordinators
      if (existingUser.role === 'coordinator' && assignedAgents !== undefined) {
        // First, unassign this coordinator from all agents
        await tx.user.updateMany({
          where: { coordinatorId: parseInt(id), role: 'agent' },
          data: { coordinatorId: null }
        });

        // Then assign selected agents to this coordinator
        if (assignedAgents.length > 0) {
          await tx.user.updateMany({
            where: {
              id: { in: assignedAgents.map(aid => parseInt(aid)) },
              role: 'agent'
            },
            data: { coordinatorId: parseInt(id) }
          });
        }
      }

      return updatedUser;
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: result
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// @route   DELETE /api/v1/users/:id
// @desc    Delete user (soft delete by default, hard delete with force=true)
// @access  Admin/SuperAdmin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
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
        const userId = parseInt(id);
        console.log(`Starting force delete for user ID: ${userId}`);

        try {
          // Clean dependent/owned records safely
          console.log('Deleting notifications...');
          await tx.notification.deleteMany({ where: { userId } });
          
          console.log('Deleting draw results...');
          await tx.drawResult.deleteMany({ where: { inputById: userId } });
          
          console.log('Deleting balance transactions...');
          await tx.balanceTransaction.deleteMany({ where: { OR: [{ userId }, { processedById: userId }] } });
          
          console.log('Deleting user balance...');
          await tx.userBalance.deleteMany({ where: { userId } });
          
          console.log('Deleting agent ticket templates...');
          await tx.agentTicketTemplate.deleteMany({ where: { agentId: userId } });
          
          console.log('Deleting sales...');
          await tx.sale.deleteMany({ where: { userId } });
          
          console.log('Deleting commissions...');
          await tx.commission.deleteMany({ where: { userId } });
          
          console.log('Deleting ticket reprints...');
          await tx.ticketReprint.deleteMany({ where: { reprintedById: userId } });
          
          console.log('Deleting bet limits...');
          await tx.betLimit.deleteMany({ where: { createdById: userId } });

          // Remove audit-related records that have FK to users (not modeled in Prisma)
          console.log('Deleting audit logs...');
          try {
            await tx.$executeRawUnsafe('DELETE FROM audit_log WHERE user_id = $1', userId);
          } catch (e) {
            console.log('Audit log table not found or error:', e.message);
          }
          try {
            await tx.$executeRawUnsafe('DELETE FROM login_audit WHERE user_id = $1', userId);
          } catch (e) {
            console.log('Login audit table not found or error:', e.message);
          }

          // Handle tickets - reassign to system user (ID 1) or delete if no system user exists
          console.log('Reassigning tickets...');
          // Determine a safe fallback user to reassign ownership (prefer superadmin/admin)
          const fallbackOwner = await tx.user.findFirst({
            where: { role: { in: ['superadmin', 'admin'] }, status: 'active', id: { not: userId } },
            select: { id: true }
          });
          if (fallbackOwner && fallbackOwner.id) {
            await tx.ticket.updateMany({ where: { agentId: userId }, data: { agentId: fallbackOwner.id } });
            await tx.ticket.updateMany({ where: { userId }, data: { userId: fallbackOwner.id } });
          } else {
            console.log('No fallback admin/superadmin found for ticket reassignment; skipping reassignment');
          }

          // Null out optional relations where applicable
          console.log('Nullifying optional relations...');
          await tx.ticketTemplate.updateMany({ where: { createdById: userId }, data: { createdById: null } });
          await tx.systemSetting.updateMany({ where: { updatedById: userId }, data: { updatedById: null } });
          await tx.user.updateMany({ where: { coordinatorId: userId }, data: { coordinatorId: null } });
          await tx.region.updateMany({ where: { areaCoordinatorId: userId }, data: { areaCoordinatorId: null } });
          // Prize configuration adjustments may fail if table/relations do not exist; guard safely
          try {
            // Check table existence via information_schema
            const pcExistsRows = await tx.$queryRawUnsafe(
              "SELECT COUNT(*)::int AS count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'prize_configurations'"
            );
            const hasPc = Array.isArray(pcExistsRows) && pcExistsRows[0] && pcExistsRows[0].count > 0;
            if (hasPc) {
              if (fallbackOwner && fallbackOwner.id) {
                await tx.prizeConfiguration.updateMany({ where: { createdById: userId }, data: { createdById: fallbackOwner.id } });
              }
              await tx.prizeConfiguration.updateMany({ where: { updatedById: userId }, data: { updatedById: null } });
            } else {
              console.log('PrizeConfiguration table not found; skipping related updates');
            }
          } catch (e) {
            console.log('Skipping prize configuration updates due to error:', e.message);
          }

          // Finally delete the user
          console.log('Deleting user...');
          await tx.user.delete({ where: { id: userId } });
          console.log(`Successfully deleted user ID: ${userId}`);
        } catch (error) {
          console.error(`Error during force delete transaction for user ${userId}:`, error);
          throw error;
        }
      });

      // Emit dashboard refresh event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.emit('dashboard-refresh', {
          type: 'user-deleted',
          userId: parseInt(id),
          timestamp: new Date().toISOString()
        });
      }

      return res.json({ success: true, message: 'User force-deleted successfully' });
    }

    // Try hard delete first; if blocked by foreign key constraints, fall back to soft delete
    try {
      await prisma.user.delete({
        where: { id: parseInt(id) }
      });

      // Emit dashboard refresh event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.emit('dashboard-refresh', {
          type: 'user-deleted',
          userId: parseInt(id),
          timestamp: new Date().toISOString()
        });
      }

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
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { status: 'inactive' },
        select: {
          id: true,
          username: true,
          fullName: true,
          status: true
        }
      });

      console.log('User deactivated:', updatedUser);

      // Emit dashboard refresh event for real-time updates
      const io = req.app.get('io');
      if (io) {
        io.emit('dashboard-refresh', {
          type: 'user-deactivated',
          userId: parseInt(id),
          timestamp: new Date().toISOString()
        });
      }

      return res.json({
        success: true,
        message: 'User deactivated instead of deleted due to linked records',
        data: updatedUser
      });
    }

  } catch (error) {
    console.error('Delete user error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      userId: req.params.id,
      force: req.query.force
    });
    
    // Provide more specific error messages
    let errorMessage = 'Error deleting user';
    if (error.code === 'P2003') {
      errorMessage = 'Cannot delete user due to foreign key constraints. Try soft delete instead.';
    } else if (error.code === 'P2025') {
      errorMessage = 'User not found or already deleted';
    } else if (error.message.includes('transaction')) {
      errorMessage = 'Database transaction failed during user deletion';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error.code
    });
  }
});

// @route   GET /api/v1/users/:id
// @desc    Get single user
// @access  Admin/SuperAdmin only
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: {
        coordinator: {
          select: { id: true, fullName: true }
        },
        areaCoordinator: {
          select: { id: true, fullName: true }
        },
        agents: {
          select: { id: true, fullName: true, status: true }
        },
        coordinators: {
          select: { id: true, fullName: true, status: true }
        },
        balance: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

module.exports = router;
