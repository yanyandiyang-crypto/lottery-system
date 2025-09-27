/**
 * User Service
 * Business logic for user operations
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { USER_ROLES, AUDIT_ACTIONS } = require('../utils/constants');
const { isValidEmail, validatePassword, isValidUserRole, sanitizeString } = require('../utils/validators');

const prisma = new PrismaClient();

class UserService {
  /**
   * Create a new user
   * @param {Object} userData - User creation data
   * @param {number} createdBy - ID of user creating this user
   * @returns {Promise<Object>} - Created user
   */
  static async createUser(userData, createdBy) {
    const { username, email, password, fullName, role, phone, address } = userData;
    
    // Validate input
    if (!isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    if (!isValidUserRole(role)) {
      throw new Error('Invalid user role');
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: sanitizeString(username) },
          { email: sanitizeString(email) }
        ]
      }
    });
    
    if (existingUser) {
      throw new Error('User with this username or email already exists');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username: sanitizeString(username),
        email: sanitizeString(email),
        passwordHash: hashedPassword,
        fullName: sanitizeString(fullName),
        role,
        phone: sanitizeString(phone),
        address: sanitizeString(address)
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        address: true,
        status: true,
        createdAt: true
      }
    });
    
    // Log audit trail
    await this.logAuditAction(createdBy, AUDIT_ACTIONS.USER_CREATED, {
      createdUserId: user.id,
      username: user.username,
      role: user.role
    });
    
    return user;
  }
  
  /**
   * Authenticate user login
   * @param {string} username - Username or email
   * @param {string} password - Password
   * @param {string} ipAddress - Client IP address
   * @param {string} userAgent - Client user agent
   * @returns {Promise<Object>} - Authentication result
   */
  static async authenticateUser(username, password, ipAddress, userAgent) {
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    
    // Find user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: sanitizeString(username) },
          { email: sanitizeString(username) }
        ],
        status: 'active'
      }
    });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // Log audit trail
    await this.logAuditAction(user.id, AUDIT_ACTIONS.LOGIN, {
      ipAddress,
      userAgent,
      loginTime: new Date()
    }, ipAddress, userAgent);
    
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        address: user.address
      },
      token
    };
  }
  
  /**
   * Update user information
   * @param {number} userId - User ID to update
   * @param {Object} updateData - Data to update
   * @param {number} updatedBy - ID of user making the update
   * @returns {Promise<Object>} - Updated user
   */
  static async updateUser(userId, updateData, updatedBy) {
    const { fullName, email, phone, address, status } = updateData;
    
    // Validate email if provided
    if (email && !isValidEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    // Check for email conflicts
    if (email && email !== existingUser.email) {
      const emailConflict = await prisma.user.findFirst({
        where: {
          email: sanitizeString(email),
          id: { not: userId }
        }
      });
      
      if (emailConflict) {
        throw new Error('Email already in use by another user');
      }
    }
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName && { fullName: sanitizeString(fullName) }),
        ...(email && { email: sanitizeString(email) }),
        ...(phone && { phone: sanitizeString(phone) }),
        ...(address && { address: sanitizeString(address) }),
        ...(status && { status })
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        address: true,
        status: true,
        updatedAt: true
      }
    });
    
    // Log audit trail
    await this.logAuditAction(updatedBy, AUDIT_ACTIONS.USER_UPDATED, {
      updatedUserId: userId,
      changes: updateData
    });
    
    return updatedUser;
  }
  
  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - User data
   */
  static async getUserById(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    const parsedUserId = parseInt(userId);
    
    if (isNaN(parsedUserId)) {
      throw new Error('Invalid user ID format');
    }
    
    const user = await prisma.user.findUnique({
      where: { id: parsedUserId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        address: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }
  
  /**
   * Get users with pagination and filters
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} - Users list with pagination
   */
  static async getUsers(filters = {}, pagination = {}) {
    const { role, isActive, search } = filters;
    const { page = 1, limit = 20, offset = 0 } = pagination;
    
    const where = {};
    
    if (role) {
      where.role = role;
    }
    
    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          phone: true,
          address: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where })
    ]);
    
    return {
      users,
      total,
      page,
      limit
    };
  }
  
  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - Success status
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Verify current password
    const isValidCurrentPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidCurrentPassword) {
      throw new Error('Current password is incorrect');
    }
    
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword }
    });
    
    return true;
  }
  
  /**
   * Check if user has permission for action
   * @param {string} userRole - User role
   * @param {string} requiredRole - Required role
   * @returns {boolean} - Has permission
   */
  static hasPermission(userRole, requiredRole) {
    const roleHierarchy = {
      [USER_ROLES.SUPER_ADMIN]: 5,
      [USER_ROLES.ADMIN]: 4,
      [USER_ROLES.AREA_COORDINATOR]: 3,
      [USER_ROLES.COORDINATOR]: 2,
      [USER_ROLES.AGENT]: 1
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
  
  /**
   * Reset user password (admin function)
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   * @param {number} resetBy - Admin user ID
   * @returns {Promise<boolean>} - Success status
   */
  static async resetPassword(userId, newPassword, resetBy) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword }
    });
    
    // Log audit trail
    await this.logAuditAction(resetBy, AUDIT_ACTIONS.USER_UPDATED, {
      updatedUserId: userId,
      action: 'password_reset',
      resetBy
    });
    
    return true;
  }
  
  /**
   * Delete user (soft delete)
   * @param {number} userId - User ID to delete
   * @param {number} deletedBy - User ID performing deletion
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteUser(userId, deletedBy) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Soft delete by deactivating
    await prisma.user.update({
      where: { id: userId },
      data: { 
        status: 'inactive'
      }
    });
    
    // Log audit trail
    await this.logAuditAction(deletedBy, 'USER_DELETED', {
      deletedUserId: userId,
      username: user.username,
      deletedBy
    });
    
    return true;
  }
  
  /**
   * Get user statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - User statistics
   */
  static async getUserStats(filters = {}) {
    const where = {};
    
    if (filters.regionId) {
      where.regionId = filters.regionId;
    }
    
    if (filters.coordinatorId) {
      where.coordinatorId = filters.coordinatorId;
    }
    
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      coordinatorUsers,
      agentUsers,
      recentUsers
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, status: 'active' } }),
      prisma.user.count({ where: { ...where, status: 'inactive' } }),
      prisma.user.count({ where: { ...where, role: USER_ROLES.ADMIN } }),
      prisma.user.count({ where: { ...where, role: USER_ROLES.COORDINATOR } }),
      prisma.user.count({ where: { ...where, role: USER_ROLES.AGENT } }),
      prisma.user.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);
    
    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersByRole: {
        admin: adminUsers,
        coordinator: coordinatorUsers,
        agent: agentUsers
      },
      recentUsers,
      activityRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(2) : 0
    };
  }
  
  /**
   * Get user hierarchy tree
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Hierarchical user structure
   */
  static async getUserHierarchy(filters = {}) {
    const where = {};
    
    if (filters.regionId) {
      where.regionId = filters.regionId;
    }
    
    if (filters.coordinatorId) {
      where.coordinatorId = filters.coordinatorId;
    }
    
    // Get all users with their relationships
    const users = await prisma.user.findMany({
      where: { ...where, status: 'active' },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        regionId: true,
        coordinatorId: true,
        createdAt: true
      },
      orderBy: [
        { role: 'asc' },
        { fullName: 'asc' }
      ]
    });
    
    // Build hierarchy tree
    const hierarchy = {
      admins: [],
      areaCoordinators: [],
      coordinators: [],
      agents: []
    };
    
    users.forEach(user => {
      const userNode = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        regionId: user.regionId,
        coordinatorId: user.coordinatorId,
        createdAt: user.createdAt,
        subordinates: []
      };
      
      switch (user.role) {
        case USER_ROLES.SUPER_ADMIN:
        case USER_ROLES.ADMIN:
          hierarchy.admins.push(userNode);
          break;
        case USER_ROLES.AREA_COORDINATOR:
          hierarchy.areaCoordinators.push(userNode);
          break;
        case USER_ROLES.COORDINATOR:
          hierarchy.coordinators.push(userNode);
          break;
        case USER_ROLES.AGENT:
          hierarchy.agents.push(userNode);
          break;
      }
    });
    
    // Link coordinators to their agents
    hierarchy.coordinators.forEach(coordinator => {
      coordinator.subordinates = hierarchy.agents.filter(
        agent => agent.coordinatorId === coordinator.id
      );
    });
    
    // Link area coordinators to their coordinators
    hierarchy.areaCoordinators.forEach(areaCoordinator => {
      areaCoordinator.subordinates = hierarchy.coordinators.filter(
        coordinator => coordinator.regionId === areaCoordinator.regionId
      );
    });
    
    return hierarchy;
  }
  
  /**
   * Enhanced getUsers with role-based filtering
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} - Users list with pagination
   */
  static async getUsers(filters = {}, pagination = {}) {
    const { role, status, search, regionId, coordinatorId, allowedRoles, userId } = filters;
    const { page = 1, limit = 20, offset = 0 } = pagination;
    
    const where = {};
    
    // Direct user filter (for agents viewing themselves)
    if (userId) {
      where.id = userId;
    }
    
    // Role-based filtering
    if (allowedRoles && allowedRoles.length > 0) {
      where.role = { in: allowedRoles };
    } else if (role) {
      where.role = role;
    }
    
    // Region filtering
    if (regionId) {
      where.regionId = regionId;
    }
    
    // Coordinator filtering
    if (coordinatorId) {
      where.coordinatorId = coordinatorId;
    }
    
    // Status filtering
    if (status) {
      where.status = status;
    }
    
    // Search filtering
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          phone: true,
          address: true,
          status: true,
          regionId: true,
          coordinatorId: true,
          createdAt: true,
          coordinator: {
            select: {
              id: true,
              fullName: true,
              username: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where })
    ]);
    
    return {
      users,
      total,
      page,
      limit
    };
  }

  /**
   * Log audit action
   * @param {number} userId - User ID
   * @param {string} action - Action type
   * @param {Object} details - Action details
   * @param {string} ipAddress - IP address
   * @param {string} userAgent - User agent
   */
  static async logAuditAction(userId, action, details, ipAddress = '127.0.0.1', userAgent = 'System') {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          details: JSON.stringify(details),
          ipAddress,
          userAgent
        }
      });
    } catch (error) {
      console.error('Audit logging failed:', error.message);
    }
  }
}

module.exports = UserService;
