/**
 * Authentication Routes (Clean Architecture)
 * Handles user authentication and authorization
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Services
const UserService = require('../services/UserService');

// Middleware
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin } = require('../middleware/roleCheck');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateLogin, 
  validatePasswordChange,
  sanitizeBody 
} = require('../middleware/validation');

// Utils
const { sendSuccess, sendError, sendUnauthorized } = require('../utils/responseHelper');

// Rate limiting for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.'
  }
});

const usernameLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 5, // 5 attempts per username
  keyGenerator: (req) => req.body?.username || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts for this username. Please try again later.'
  }
});

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticate user and return JWT token
 * @access  Public
 */
router.post('/login',
  authLimiter,
  usernameLimiter,
  sanitizeBody,
  validateLogin,
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    const authResult = await UserService.authenticateUser(
      username, 
      password, 
      ipAddress, 
      userAgent
    );

    return sendSuccess(res, authResult, 'Login successful');
  })
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate token on client side)
 * @access  Private
 */
router.post('/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Log logout action
    await UserService.logAuditAction(userId, 'LOGOUT', {
      logoutTime: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    }, req.ip, req.get('User-Agent'));

    return sendSuccess(res, null, 'Logout successful');
  })
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    if (!userId) {
      return sendError(res, 'User ID not found in token', 400);
    }
    
    const user = await UserService.getUserById(userId);
    
    return sendSuccess(res, { user }, 'Profile retrieved successfully');
  })
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put('/profile',
  requireAuth,
  sanitizeBody,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { fullName, email, phone, address } = req.body;

    // Users can only update their own profile
    const updateData = { fullName, email, phone, address };
    
    const user = await UserService.updateUser(userId, updateData, userId);
    
    return sendSuccess(res, { user }, 'Profile updated successfully');
  })
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change current user password
 * @access  Private
 */
router.post('/change-password',
  requireAuth,
  validatePasswordChange,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    await UserService.changePassword(userId, currentPassword, newPassword);
    
    return sendSuccess(res, null, 'Password changed successfully');
  })
);

/**
 * @route   POST /api/v1/auth/verify-token
 * @desc    Verify JWT token validity
 * @access  Private
 */
router.post('/verify-token',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = req.user;
    
    return sendSuccess(res, { 
      valid: true,
      user: {
        id: user.userId,
        username: user.username,
        role: user.role
      }
    }, 'Token is valid');
  })
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh JWT token (extend expiry)
 * @access  Private
 */
router.post('/refresh-token',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // Get fresh user data
    const user = await UserService.getUserById(userId);
    
    // Generate new token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    return sendSuccess(res, { 
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    }, 'Token refreshed successfully');
  })
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset user password (Admin only)
 * @access  Private (Admin+)
 */
router.post('/reset-password',
  requireAuth,
  requireAdmin,
  sanitizeBody,
  asyncHandler(async (req, res) => {
    const { userId, newPassword } = req.body;
    const adminId = req.user.id;

    if (!userId || !newPassword) {
      return sendError(res, 'User ID and new password are required', 400);
    }

    await UserService.resetPassword(parseInt(userId), newPassword, adminId);
    
    return sendSuccess(res, null, 'Password reset successfully');
  })
);

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get active user sessions (placeholder for future session management)
 * @access  Private
 */
router.get('/sessions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // For now, return current session info
    // In future, implement proper session tracking
    const currentSession = {
      id: 'current',
      userId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      loginTime: new Date(),
      isActive: true
    };
    
    return sendSuccess(res, { 
      sessions: [currentSession],
      total: 1
    }, 'Sessions retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/auth/validate-permissions
 * @desc    Validate user permissions for specific actions
 * @access  Private
 */
router.post('/validate-permissions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { requiredRole, action } = req.body;
    const currentUser = req.user;

    if (!requiredRole) {
      return sendError(res, 'Required role is needed for validation', 400);
    }

    const hasPermission = UserService.hasPermission(currentUser.role, requiredRole);
    
    return sendSuccess(res, { 
      hasPermission,
      currentRole: currentUser.role,
      requiredRole,
      action: action || 'unknown'
    }, 'Permission validation completed');
  })
);

/**
 * @route   GET /api/v1/auth/stats
 * @desc    Get user account statistics
 * @access  Private
 */
router.get('/stats',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Basic stats that all users can see
    const stats = {
      userId,
      username: req.user.username,
      role: userRole,
      accountCreated: req.user.createdAt,
      lastLogin: new Date(), // This could be tracked in a separate table
      isActive: req.user.status === 'active'
    };
    
    // Add role-specific stats
    if (userRole === 'agent') {
      // Agent-specific stats could be added here
      stats.agentStats = {
        totalTickets: 0, // This would come from TicketService
        totalSales: 0,
        thisMonth: {
          tickets: 0,
          sales: 0
        }
      };
    }
    
    return sendSuccess(res, stats, 'Account statistics retrieved successfully');
  })
);

module.exports = router;
