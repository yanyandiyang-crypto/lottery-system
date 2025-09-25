const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { requireAdmin, requireSuperAdmin } = require('../middleware/roleCheck');
const { requireAuth } = require('../middleware/auth');
const transactionService = require('../services/transactionService');
const PasswordValidator = require('../utils/passwordValidator');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiting');
const rateLimit = require('express-rate-limit');

const router = express.Router();
const prisma = new PrismaClient();

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
// Per-username limiter: adds a username-based cap separate from IP
const usernameLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 5,
  keyGenerator: (req) => req.body?.username || req.ip,
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/login', [authLimiter, usernameLimiter], [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 1 }).withMessage('Password is required')
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
      // Log failed login attempt
      await transactionService.logLoginAttempt(
        null, // No user ID for failed login
        req.ip,
        req.get('User-Agent'),
        false,
        'User not found'
      );
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.status !== 'active') {
      // Log failed login attempt
      await transactionService.logLoginAttempt(
        user.id,
        req.ip,
        req.get('User-Agent'),
        false,
        'Account inactive or suspended'
      );
      
      return res.status(401).json({
        success: false,
        message: 'Account is inactive or suspended'
      });
    }

    // Enforce incremental policy before password check
    const { recentFailures, totalFailures } = await transactionService.getRecentLoginFailures(user.id);
    if (totalFailures >= 10) {
      await prisma.user.update({ where: { id: user.id }, data: { status: 'suspended' } });
      await transactionService.logLoginAttempt(
        user.id,
        req.ip,
        req.get('User-Agent'),
        false,
        'Account locked after 10 failed attempts'
      );
      return res.status(423).json({ success: false, message: 'Account locked. Contact admin to unlock.' });
    }
    if (recentFailures >= 5) {
      return res.status(429).json({ success: false, message: 'Too many attempts. Please wait 30 seconds.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      // Log failed login attempt
      await transactionService.logLoginAttempt(
        user.id,
        req.ip,
        req.get('User-Agent'),
        false,
        'Invalid password'
      );
      
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

    // Log successful login attempt
    await transactionService.logLoginAttempt(
      user.id,
      req.ip,
      req.get('User-Agent'),
      true,
      null
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

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', requireAuth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
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
    const userId = req.user.userId;

    // Validate new password strength
    const passwordValidation = PasswordValidator.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordValidation.errors,
        strength: passwordValidation.strength
      });
    }

    // Get current user
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
    const isCurrentPasswordValid = await PasswordValidator.comparePassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      // Log failed password change attempt
      await transactionService.logLoginAttempt(
        userId,
        req.ip,
        req.get('User-Agent'),
        false,
        'Invalid current password for password change'
      );

      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedNewPassword = await PasswordValidator.hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword }
    });

    // Log successful password change
    await transactionService.logLoginAttempt(
      userId,
      req.ip,
      req.get('User-Agent'),
      true,
      'Password changed successfully'
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
      strength: passwordValidation.strength
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset user password (admin only)
// @access  Private (Admin/SuperAdmin)
router.post('/reset-password', requireAuth, requireAdmin, passwordResetLimiter, [
  body('userId').isInt().withMessage('User ID is required'),
  body('newPassword').optional().isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
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

    const { userId, newPassword } = req.body;
    const adminId = req.user.userId;

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate new password if not provided
    const finalPassword = newPassword || PasswordValidator.generateSecurePassword(12);

    // Validate password strength
    const passwordValidation = PasswordValidator.validatePassword(finalPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Generated password does not meet security requirements',
        errors: passwordValidation.errors
      });
    }

    // Hash new password
    const hashedPassword = await PasswordValidator.hashPassword(finalPassword);

    // Update password
    await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { passwordHash: hashedPassword }
    });

    // Log password reset
    await transactionService.logLoginAttempt(
      adminId,
      req.ip,
      req.get('User-Agent'),
      true,
      `Password reset for user ${targetUser.username}`
    );

    res.json({
      success: true,
      message: 'Password reset successfully',
      newPassword: newPassword ? undefined : finalPassword, // Only return if generated
      strength: passwordValidation.strength
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/auth/validate-password
// @desc    Validate password strength
// @access  Public
router.post('/validate-password', [
  body('password').notEmpty().withMessage('Password is required')
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

    const { password } = req.body;
    const validation = PasswordValidator.validatePassword(password);
    const strengthInfo = PasswordValidator.getStrengthDescription(validation.strength);

    res.json({
      success: true,
      isValid: validation.isValid,
      errors: validation.errors,
      strength: validation.strength,
      strengthInfo: strengthInfo,
      isCompromised: PasswordValidator.isCompromised(password)
    });

  } catch (error) {
    console.error('Password validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;


