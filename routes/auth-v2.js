const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { requireAdmin, requireSuperAdmin } = require('../middleware/roleCheck');
const { createEndpointRateLimit } = require('../middleware/security');

const router = express.Router();
const prisma = new PrismaClient();

// Enhanced rate limiting for v2
const loginRateLimit = createEndpointRateLimit('/auth/login', 'v2');
const registerRateLimit = createEndpointRateLimit('/auth/register', 'v2');

// @route   POST /api/v2/auth/login
// @desc    Enhanced login with additional security
// @access  Public
router.post('/login', loginRateLimit, [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('deviceId').optional().isLength({ min: 10 }).withMessage('Device ID must be at least 10 characters'),
  body('userAgent').optional().isLength({ min: 10 }).withMessage('User agent is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        apiVersion: 'v2'
      });
    }

    const { username, password, deviceId, userAgent } = req.body;

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
        message: 'Invalid credentials',
        apiVersion: 'v2'
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive or suspended',
        apiVersion: 'v2'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        apiVersion: 'v2'
      });
    }

    // Generate JWT token with enhanced claims including regionId
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        regionId: user.regionId, // Include regionId for hierarchy filtering
        deviceId: deviceId || 'unknown',
        loginTime: new Date().toISOString(),
        apiVersion: 'v2'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Log login attempt
    await prisma.balanceTransaction.create({
      data: {
        userId: user.id,
        amount: 0,
        transactionType: 'login',
        description: `Login from device: ${deviceId || 'unknown'}`,
        processedById: user.id
      }
    });

    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword,
      apiVersion: 'v2',
      security: {
        tokenExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
        requiresMFA: false, // Future feature
        lastLogin: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      apiVersion: 'v2'
    });
  }
});

// @route   POST /api/v2/auth/register
// @desc    Enhanced user registration with additional validation
// @access  Private (Admin/SuperAdmin)
router.post('/register', registerRateLimit, requireAdmin, [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('password').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('role').isIn(['area_coordinator', 'coordinator', 'agent', 'operator']).withMessage('Invalid role'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        apiVersion: 'v2'
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

    // Enhanced validation for v2
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters for API v2',
        apiVersion: 'v2'
      });
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username already exists',
        apiVersion: 'v2'
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
          message: 'Email already exists',
          apiVersion: 'v2'
        });
      }
    }

    // Validate role hierarchy
    if (req.user.role === 'admin' && ['superadmin', 'admin'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create this role',
        apiVersion: 'v2'
      });
    }

    // Enhanced password hashing for v2
    const saltRounds = 14; // Increased from 12 for v2
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

    // Log user creation
    await prisma.balanceTransaction.create({
      data: {
        userId: newUser.id,
        amount: 0,
        transactionType: 'user_created',
        description: `User created by ${req.user.fullName}`,
        processedById: req.user.id
      }
    });

    // Remove password from response
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userWithoutPassword,
      apiVersion: 'v2',
      security: {
        passwordStrength: 'strong',
        requiresEmailVerification: !!email,
        createdBy: req.user.fullName
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      apiVersion: 'v2'
    });
  }
});

// @route   POST /api/v2/auth/change-password
// @desc    Enhanced password change with additional security
// @access  Private
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  body('newPassword').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Password confirmation does not match');
    }
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        apiVersion: 'v2'
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
        message: 'User not found',
        apiVersion: 'v2'
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
        apiVersion: 'v2'
      });
    }

    // Enhanced password hashing for v2
    const saltRounds = 14;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    // Log password change
    await prisma.balanceTransaction.create({
      data: {
        userId: userId,
        amount: 0,
        transactionType: 'password_change',
        description: 'Password changed successfully',
        processedById: userId
      }
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
      apiVersion: 'v2',
      security: {
        passwordStrength: 'strong',
        changedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      apiVersion: 'v2'
    });
  }
});

// @route   GET /api/v2/auth/me
// @desc    Get current user info with enhanced data
// @access  Private
router.get('/me', async (req, res) => {
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
        message: 'User not found',
        apiVersion: 'v2'
      });
    }

    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: userWithoutPassword,
      apiVersion: 'v2',
      security: {
        lastLogin: new Date().toISOString(),
        sessionExpires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        requiresMFA: false // Future feature
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      apiVersion: 'v2'
    });
  }
});

module.exports = router;




