const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Role hierarchy: superadmin > admin > area_coordinator > coordinator > agent > operator
const roleHierarchy = {
  'superadmin': 6,
  'admin': 5,
  'area_coordinator': 4,
  'coordinator': 3,
  'agent': 2,
  'operator': 1
};

const roleCheck = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.'
        });
      }

      const userRole = req.user.role;
      
      // Check if user role is in allowed roles
      if (!allowedRoles.includes(userRole)) {
        console.log('Role check failed:', {
          userRole,
          allowedRoles,
          userId: req.user.id,
          endpoint: req.path
        });
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions for this action.'
        });
      }

      // Additional checks for specific roles (skip for superadmin and admin)
      if (userRole === 'agent') {
        // Agents can only access their own data or data they created
        if (req.params.userId && parseInt(req.params.userId) !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Agents can only access their own data.'
          });
        }
      }

      if (userRole === 'coordinator') {
        // Coordinators can only access their agents' data
        const targetUserId = req.params.userId || req.params.id;
        if (targetUserId) {
          const targetUser = await prisma.user.findUnique({
            where: { id: parseInt(targetUserId) },
            select: { coordinatorId: true }
          });

          if (!targetUser || targetUser.coordinatorId !== req.user.id) {
            return res.status(403).json({
              success: false,
              message: 'Coordinators can only access their assigned agents.'
            });
          }
        }
      }

      if (userRole === 'area_coordinator') {
        // Area coordinators can access coordinators and agents in their region
        const targetUserId = req.params.userId || req.params.id;
        if (targetUserId) {
          const targetUser = await prisma.user.findUnique({
            where: { id: parseInt(targetUserId) },
            include: {
              coordinator: true,
              region: true
            }
          });

          console.log('Area coordinator check:', {
            areaCoordinatorId: req.user.id,
            areaCoordinatorRegionId: req.user.regionId,
            targetUserId: parseInt(targetUserId),
            targetUser: targetUser ? {
              id: targetUser.id,
              username: targetUser.username,
              role: targetUser.role,
              regionId: targetUser.regionId
            } : null
          });

          if (!targetUser || targetUser.regionId !== req.user.regionId) {
            return res.status(403).json({
              success: false,
              message: 'Area coordinators can only access users in their region.'
            });
          }
        }
        // For endpoints without specific user IDs (like /users list), allow access
        // The endpoint itself will handle filtering based on region
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during authorization.'
      });
    }
  };
};

// Specific role checkers
const requireSuperAdmin = roleCheck(['superadmin']);
const requireAdmin = roleCheck(['superadmin', 'admin']);
const requireAreaCoordinator = roleCheck(['superadmin', 'admin', 'area_coordinator']);
const requireCoordinator = roleCheck(['superadmin', 'admin', 'area_coordinator', 'coordinator']);
const requireAgent = roleCheck(['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent']);
const requireOperator = roleCheck(['superadmin', 'admin', 'operator']);

// Check if user can manage another user
const canManageUser = async (managerId, targetUserId) => {
  try {
    const manager = await prisma.user.findUnique({
      where: { id: managerId },
      include: { region: true }
    });

    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { coordinator: true, region: true }
    });

    if (!manager || !target) return false;

    // SuperAdmin and Admin can manage everyone
    if (['superadmin', 'admin'].includes(manager.role)) return true;

    // Area coordinators can manage users in their region
    if (manager.role === 'area_coordinator') {
      return target.regionId === manager.regionId;
    }

    // Coordinators can manage their agents
    if (manager.role === 'coordinator') {
      return target.coordinatorId === managerId;
    }

    return false;
  } catch (error) {
    console.error('Can manage user check error:', error);
    return false;
  }
};

module.exports = {
  roleCheck,
  requireSuperAdmin,
  requireAdmin,
  requireAreaCoordinator,
  requireCoordinator,
  requireAgent,
  requireOperator,
  canManageUser,
  roleHierarchy
};


