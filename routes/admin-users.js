const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// Get all administrators and operators (filtered based on user role)
router.get('/admins', auth, roleCheck(['superadmin']), async (req, res) => {
  try {
    const { role } = req.user;
    
    // Build where clause based on user role
    const whereClause = {
      role: {
        in: role === 'superadmin' 
          ? ['admin', 'superadmin', 'operator'] 
          : ['admin'] // Regular admins can't see SuperAdmins or Operators
      }
    };

    const admins = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { role: 'desc' }, // SuperAdmin first
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: admins
    });
  } catch (error) {
    console.error('Error fetching administrators:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch administrators'
    });
  }
});

// Create new administrator or operator
router.post('/admin', auth, roleCheck(['superadmin']), async (req, res) => {
  try {
    const { username, email, password, fullName, role, isActive } = req.body;
    const currentUserRole = req.user.role;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Only SuperAdmin can create SuperAdmin accounts
    if (role === 'superadmin' && currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can create SuperAdmin accounts'
      });
    }

    // Only SuperAdmin can create Operator accounts
    if (role === 'operator' && currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can create Operator accounts'
      });
    }

    // Check if operator already exists (only one operator allowed)
    if (role === 'operator') {
      const existingOperator = await prisma.user.findFirst({
        where: { role: 'operator' }
      });
      
      if (existingOperator) {
        return res.status(400).json({
          success: false,
          message: 'An operator account already exists. Only one operator account is allowed.'
        });
      }
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new admin
    const newAdmin = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash: hashedPassword,
        fullName: fullName || null,
        role: role || 'admin',
        status: isActive !== undefined ? (isActive ? 'active' : 'inactive') : 'active'
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      success: true,
      data: newAdmin,
      message: `${role === 'operator' ? 'Operator' : 'Administrator'} created successfully`
    });
  } catch (error) {
    console.error('Error creating administrator:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create administrator'
    });
  }
});

// Update administrator
router.put('/:id', auth, roleCheck(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, fullName, role, isActive } = req.body;
    const currentUserRole = req.user.role;
    const currentUserId = req.user.id;

    // Get the user being updated
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Administrator not found'
      });
    }

    // Only SuperAdmin can modify SuperAdmin accounts
    if (targetUser.role === 'superadmin' && currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can modify SuperAdmin accounts'
      });
    }

    // Only SuperAdmin can modify Operator accounts
    if (targetUser.role === 'operator' && currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can modify Operator accounts'
      });
    }

    // Only SuperAdmin can promote to SuperAdmin
    if (role === 'superadmin' && currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can promote users to SuperAdmin'
      });
    }

    // Only SuperAdmin can promote to Operator
    if (role === 'operator' && currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can promote users to Operator'
      });
    }

    // Check if trying to change to operator role and operator already exists
    if (role === 'operator' && targetUser.role !== 'operator') {
      const existingOperator = await prisma.user.findFirst({
        where: { role: 'operator' }
      });
      
      if (existingOperator) {
        return res.status(400).json({
          success: false,
          message: 'An operator account already exists. Only one operator account is allowed.'
        });
      }
    }

    // Prevent self-demotion from SuperAdmin
    if (currentUserId === parseInt(id) && currentUserRole === 'superadmin' && role !== 'superadmin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot demote yourself from SuperAdmin role'
      });
    }

    // Check for duplicate username/email (excluding current user)
    if (username || email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: parseInt(id) } },
            {
              OR: [
                username ? { username } : {},
                email ? { email } : {}
              ].filter(obj => Object.keys(obj).length > 0)
            }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username or email already exists'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.status = isActive ? 'active' : 'inactive';

    // Hash password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    // Update admin
    const updatedAdmin = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: updatedAdmin,
      message: 'Administrator updated successfully'
    });
  } catch (error) {
    console.error('Error updating administrator:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update administrator'
    });
  }
});

// Toggle administrator status
router.put('/:id/status', auth, roleCheck(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const currentUserRole = req.user.role;
    const currentUserId = req.user.id;

    // Get the user being updated
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Administrator not found'
      });
    }

    // Only SuperAdmin can modify SuperAdmin accounts
    if (targetUser.role === 'superadmin' && currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can modify SuperAdmin accounts'
      });
    }

    // Only SuperAdmin can modify Operator accounts
    if (targetUser.role === 'operator' && currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can modify Operator accounts'
      });
    }

    // Prevent self-deactivation
    if (currentUserId === parseInt(id) && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    // Update status
    const updatedAdmin = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status: isActive ? 'active' : 'inactive' },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: updatedAdmin,
      message: `Administrator ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error updating administrator status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update administrator status'
    });
  }
});

// Delete administrator
router.delete('/:id', auth, roleCheck(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    const currentUserRole = req.user.role;
    const currentUserId = req.user.id;

    // Get the user being deleted
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Administrator not found'
      });
    }

    // Only SuperAdmin can delete SuperAdmin accounts
    if (targetUser.role === 'superadmin' && currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can delete SuperAdmin accounts'
      });
    }

    // Only SuperAdmin can delete Operator accounts
    if (targetUser.role === 'operator' && currentUserRole !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only SuperAdmin can delete Operator accounts'
      });
    }

    // Prevent self-deletion
    if (currentUserId === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Prevent deleting the last SuperAdmin
    if (targetUser.role === 'superadmin') {
      const superAdminCount = await prisma.user.count({
        where: { 
          role: 'superadmin',
          status: 'active'
        }
      });

      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the last active SuperAdmin account'
        });
      }
    }

    // Force-delete path for superadmin: clean dependencies then delete
    if (force === 'true') {
      await prisma.$transaction(async (tx) => {
        const userId = parseInt(id);

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

      return res.json({ success: true, message: 'Administrator force-deleted successfully' });
    }

    // Try hard delete first; if blocked by foreign key constraints, fall back to soft delete (deactivate)
    try {
      await prisma.user.delete({
        where: { id: parseInt(id) }
      });

      return res.json({
        success: true,
        message: 'Administrator deleted successfully'
      });
    } catch (err) {
      // Prisma foreign key constraint error code
      const isFkError = err?.code === 'P2003' || /foreign key constraint/i.test(err?.message || '');
      if (!isFkError) {
        throw err;
      }

      // Soft delete: set status to inactive when there are linked records
      const deactivated = await prisma.user.update({
        where: { id: parseInt(id) },
        data: { status: 'inactive' }
      });

      return res.json({
        success: true,
        message: 'Administrator deactivated instead of deleted due to linked records',
        data: { id: deactivated.id, status: deactivated.status }
      });
    }
  } catch (error) {
    console.error('Error deleting administrator:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete administrator'
    });
  }
});

module.exports = router;
