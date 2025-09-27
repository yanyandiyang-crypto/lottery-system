/**
 * Users Routes (Clean Architecture)
 * Handles user management operations
 */

const express = require('express');
const router = express.Router();

// Services
const UserService = require('../services/UserService');

// Middleware
const { requireAuth } = require('../middleware/auth');
const { 
  requireAdmin, 
  requireAreaCoordinator, 
  requireCoordinator,
  canManageUser 
} = require('../middleware/roleCheck');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateUserCreation, 
  validatePaginationParams,
  validatePasswordChange,
  sanitizeBody 
} = require('../middleware/validation');

// Utils
const { sendSuccess, sendError, sendPaginatedResponse, sendNotFound } = require('../utils/responseHelper');
const { USER_ROLES } = require('../utils/constants');

/**
 * @route   GET /api/v1/users
 * @desc    Get all users based on role hierarchy
 * @access  Private (Role-based filtering)
 */
router.get('/',
  requireAuth,
  validatePaginationParams,
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = req.pagination;
    const { role, status, search, regionId, coordinatorId } = req.query;
    const currentUser = req.user;

    // Build filters based on user role and permissions
    const filters = {
      role,
      status,
      search,
      regionId: regionId ? parseInt(regionId) : undefined,
      coordinatorId: coordinatorId ? parseInt(coordinatorId) : undefined
    };

    // Apply role-based filtering
    if (currentUser.role === USER_ROLES.AREA_COORDINATOR) {
      filters.regionId = currentUser.regionId;
      filters.allowedRoles = [USER_ROLES.COORDINATOR, USER_ROLES.AGENT];
    } else if (currentUser.role === USER_ROLES.COORDINATOR) {
      filters.coordinatorId = currentUser.id;
      filters.allowedRoles = [USER_ROLES.AGENT];
    } else if (currentUser.role === USER_ROLES.AGENT) {
      // Agents can only see themselves
      filters.userId = currentUser.id;
    }

    const result = await UserService.getUsers(filters, { page, limit, offset });

    return sendPaginatedResponse(res, result.users, result.total, page, limit);
  })
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Role-based access)
 */
router.get('/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const currentUser = req.user;

    // Check if user can access this user's data
    if (currentUser.role === USER_ROLES.AGENT && currentUser.id !== userId) {
      return sendError(res, 'Access denied', 403);
    }

    const user = await UserService.getUserById(userId);

    // Additional role-based checks
    if (currentUser.role === USER_ROLES.COORDINATOR) {
      // Coordinators can only see their agents
      if (user.coordinatorId !== currentUser.id && user.id !== currentUser.id) {
        return sendError(res, 'Access denied', 403);
      }
    }

    return sendSuccess(res, { user }, 'User retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (Admin+ or role-based creation)
 */
router.post('/',
  requireAuth,
  sanitizeBody,
  validateUserCreation,
  asyncHandler(async (req, res) => {
    const userData = req.body;
    const currentUser = req.user;

    // Role-based creation permissions
    const canCreate = UserService.hasPermission(currentUser.role, userData.role);
    if (!canCreate) {
      return sendError(res, 'Insufficient permissions to create this user role', 403);
    }

    // Additional validations based on role
    if (currentUser.role === USER_ROLES.AREA_COORDINATOR) {
      // Area coordinators can only create users in their region
      userData.regionId = currentUser.regionId;
      
      if (![USER_ROLES.COORDINATOR, USER_ROLES.AGENT].includes(userData.role)) {
        return sendError(res, 'Area coordinators can only create coordinators and agents', 403);
      }
    }

    if (currentUser.role === USER_ROLES.COORDINATOR) {
      // Coordinators can only create agents under them
      userData.coordinatorId = currentUser.id;
      userData.regionId = currentUser.regionId;
      
      if (userData.role !== USER_ROLES.AGENT) {
        return sendError(res, 'Coordinators can only create agents', 403);
      }
    }

    const user = await UserService.createUser(userData, currentUser.id);

    return sendSuccess(res, { user }, 'User created successfully', 201);
  })
);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Role-based permissions)
 */
router.put('/:id',
  requireAuth,
  sanitizeBody,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const updateData = req.body;
    const currentUser = req.user;

    // Check if user can manage this user
    const canManage = await canManageUser(currentUser, userId);
    if (!canManage) {
      return sendError(res, 'Insufficient permissions to update this user', 403);
    }

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.role; // Role changes should be separate endpoint
    delete updateData.id;

    const user = await UserService.updateUser(userId, updateData, currentUser.id);

    return sendSuccess(res, { user }, 'User updated successfully');
  })
);

/**
 * @route   PUT /api/v1/users/:id/status
 * @desc    Update user status (activate/deactivate)
 * @access  Private (Admin+ or role-based permissions)
 */
router.put('/:id/status',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { status } = req.body;
    const currentUser = req.user;

    if (!['active', 'inactive'].includes(status)) {
      return sendError(res, 'Status must be either "active" or "inactive"', 400);
    }

    // Check permissions
    const canManage = await canManageUser(currentUser, userId);
    if (!canManage) {
      return sendError(res, 'Insufficient permissions to update user status', 403);
    }

    // Prevent self-deactivation
    if (userId === currentUser.id && status === 'inactive') {
      return sendError(res, 'Cannot deactivate your own account', 400);
    }

    const user = await UserService.updateUser(userId, { status }, currentUser.id);

    return sendSuccess(res, { user }, `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
  })
);

/**
 * @route   PUT /api/v1/users/:id/role
 * @desc    Update user role
 * @access  Private (Admin+ only)
 */
router.put('/:id/role',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { role } = req.body;
    const currentUser = req.user;

    if (!Object.values(USER_ROLES).includes(role)) {
      return sendError(res, 'Invalid role specified', 400);
    }

    // Prevent role changes that would break hierarchy
    if (userId === currentUser.id) {
      return sendError(res, 'Cannot change your own role', 400);
    }

    const user = await UserService.updateUser(userId, { role }, currentUser.id);

    return sendSuccess(res, { user }, 'User role updated successfully');
  })
);

/**
 * @route   POST /api/v1/users/:id/change-password
 * @desc    Change user password
 * @access  Private (Self or Admin+)
 */
router.post('/:id/change-password',
  requireAuth,
  validatePasswordChange,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const { currentPassword, newPassword } = req.body;
    const currentUser = req.user;

    // Users can change their own password, or admins can change any password
    if (userId !== currentUser.id && !UserService.hasPermission(currentUser.role, USER_ROLES.ADMIN)) {
      return sendError(res, 'Insufficient permissions to change this password', 403);
    }

    // For self password change, verify current password
    if (userId === currentUser.id) {
      await UserService.changePassword(userId, currentPassword, newPassword);
    } else {
      // Admin changing another user's password - no current password needed
      await UserService.resetPassword(userId, newPassword, currentUser.id);
    }

    return sendSuccess(res, null, 'Password changed successfully');
  })
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user (soft delete)
 * @access  Private (Admin+ only)
 */
router.delete('/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const currentUser = req.user;

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return sendError(res, 'Cannot delete your own account', 400);
    }

    await UserService.deleteUser(userId, currentUser.id);

    return sendSuccess(res, null, 'User deleted successfully');
  })
);

/**
 * @route   GET /api/v1/users/stats/summary
 * @desc    Get user statistics summary
 * @access  Private (Admin+ or role-based stats)
 */
router.get('/stats/summary',
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const filters = {};

    // Apply role-based filtering for stats
    if (currentUser.role === USER_ROLES.AREA_COORDINATOR) {
      filters.regionId = currentUser.regionId;
    } else if (currentUser.role === USER_ROLES.COORDINATOR) {
      filters.coordinatorId = currentUser.id;
    } else if (currentUser.role === USER_ROLES.AGENT) {
      return sendError(res, 'Agents cannot access user statistics', 403);
    }

    const stats = await UserService.getUserStats(filters);

    return sendSuccess(res, stats, 'User statistics retrieved successfully');
  })
);

/**
 * @route   GET /api/v1/users/hierarchy
 * @desc    Get user hierarchy tree
 * @access  Private (Admin+ or role-based hierarchy)
 */
router.get('/hierarchy',
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const filters = {};

    // Apply role-based filtering
    if (currentUser.role === USER_ROLES.AREA_COORDINATOR) {
      filters.regionId = currentUser.regionId;
    } else if (currentUser.role === USER_ROLES.COORDINATOR) {
      filters.coordinatorId = currentUser.id;
    } else if (currentUser.role === USER_ROLES.AGENT) {
      return sendError(res, 'Agents cannot access hierarchy data', 403);
    }

    const hierarchy = await UserService.getUserHierarchy(filters);

    return sendSuccess(res, hierarchy, 'User hierarchy retrieved successfully');
  })
);

module.exports = router;
