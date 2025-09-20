const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { requireAdmin, requireSuperAdmin } = require('../middleware/roleCheck');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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

    const { username, password } = req.body;

    // Find user with related data
    const user = await prisma.user.findUnique({
      where: { username },
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

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive or suspended'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user (Admin/SuperAdmin only)
// @access  Private (Admin/SuperAdmin)
router.post('/register', requireAdmin, [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('role').isIn(['area_coordinator', 'coordinator', 'agent', 'operator']).withMessage('Invalid role'),
  body('email').optional().isEmail().withMessage('Invalid email format')
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
      address, 
      role, 
      regionId, 
      coordinatorId 
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

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email }
      });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Validate role hierarchy
    if (req.user.role === 'admin' && ['superadmin', 'admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create this role'
      });
    }

    // Validate region assignment
    if (role === 'area_coordinator' && regionId) {
      const region = await prisma.region.findUnique({
        where: { id: regionId }
      });

      if (!region) {
        return res.status(400).json({
          success: false,
          message: 'Region not found'
        });
      }
    }

    // Validate coordinator assignment for agents
    if (role === 'agent' && coordinatorId) {
      const coordinator = await prisma.user.findUnique({
        where: { id: coordinatorId, role: 'coordinator' }
      });

      if (!coordinator) {
        return res.status(400).json({
          success: false,
          message: 'Coordinator not found'
        });
      }
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        email,
        fullName,
        phone,
        address,
        role,
        regionId: role === 'area_coordinator' ? regionId : null,
        coordinatorId: role === 'agent' ? coordinatorId : null,
        createdById: req.user.id
      },
      include: {
        region: true,
        coordinator: true,
        balance: true
      }
    });

    // Create user balance
    await prisma.userBalance.create({
      data: {
        userId: newUser.id,
        currentBalance: 0.00,
        totalLoaded: 0.00,
        totalUsed: 0.00
      }
    });

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
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

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user info
// @access  Private
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
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
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName,
        email: email || null,
        phone: phone || null
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        currentBalance: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/auth/password
// @desc    Change user password
// @access  Private
router.put('/password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/auth/stats
// @desc    Get user account statistics
// @access  Private
router.get('/stats', requireAuth, async (req, res) => {
  try {
    let stats = {};

    switch (req.user.role) {
      case 'agent':
        // Agent: sales and winnings
        const agentTickets = await prisma.ticket.aggregate({
          where: { agentId: req.user.id },
          _count: { id: true },
          _sum: { totalAmount: true }
        });

        const agentWinnings = await prisma.winningTicket.aggregate({
          where: { ticket: { agentId: req.user.id } },
          _sum: { prizeAmount: true }
        });

        stats = {
          totalTickets: agentTickets._count.id || 0,
          totalSales: agentTickets._sum.totalAmount || 0,
          totalWinnings: agentWinnings._sum.prizeAmount || 0
        };
        break;

      case 'coordinator':
        // Coordinator: agents under them and tickets from those agents
        const coordinatorAgents = await prisma.user.count({
          where: { role: 'agent', coordinatorId: req.user.id }
        });

        const coordinatorTickets = await prisma.ticket.aggregate({
          where: { agent: { coordinatorId: req.user.id } },
          _count: { id: true },
          _sum: { totalAmount: true }
        });

        stats = {
          activeAgents: coordinatorAgents,
          totalTickets: coordinatorTickets._count.id || 0,
          totalSales: coordinatorTickets._sum.totalAmount || 0
        };
        break;

      case 'area_coordinator':
        // Area coordinator: agents under coordinators assigned to this area coordinator
        const areaAgents = await prisma.user.count({
          where: { role: 'agent', coordinator: { coordinatorId: req.user.id } }
        });

        const areaTickets = await prisma.ticket.aggregate({
          where: { agent: { coordinator: { coordinatorId: req.user.id } } },
          _count: { id: true },
          _sum: { totalAmount: true }
        });

        stats = {
          activeAgents: areaAgents,
          totalTickets: areaTickets._count.id || 0,
          totalSales: areaTickets._sum.totalAmount || 0
        };
        break;

      default:
        stats = {};
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Get account stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;


