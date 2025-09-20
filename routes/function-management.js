const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// Get all system functions with role permissions
router.get('/functions', auth, roleCheck(['superadmin', 'area_coordinator']), async (req, res) => {
  try {
    const functions = await prisma.systemFunction.findMany({
      include: {
        rolePermissions: true
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: functions
    });
  } catch (error) {
    console.error('Error fetching functions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch functions'
    });
  }
});

// Get role permissions for sidebar (used by frontend)
router.get('/permissions/:role', auth, async (req, res) => {
  try {
    const { role } = req.params;
    
    // Only allow users to get permissions for their own role or lower
    const allowedRoles = {
      'superadmin': ['admin', 'area_coordinator', 'coordinator', 'agent', 'operator'],
      'admin': ['admin', 'area_coordinator', 'coordinator', 'agent'],
      'area_coordinator': ['area_coordinator', 'coordinator', 'agent'],
      'coordinator': ['coordinator', 'agent'],
      'agent': ['agent'],
      'operator': ['operator']
    };

    if (!allowedRoles[req.user.role]?.includes(role) && req.user.role !== role) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    const permissions = await prisma.roleFunctionPermission.findMany({
      where: { 
        role: role,
        isEnabled: true,
        function: {
          isActive: true
        }
      },
      include: {
        function: true
      }
    });

    const enabledFunctions = permissions.map(p => p.function.key);

    res.json({
      success: true,
      data: enabledFunctions
    });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role permissions'
    });
  }
});

// Create new system function
router.post('/functions', auth, roleCheck(['superadmin']), async (req, res) => {
  try {
    const { name, key, description, category } = req.body;

    if (!name || !key) {
      return res.status(400).json({
        success: false,
        message: 'Name and key are required'
      });
    }

    const newFunction = await prisma.systemFunction.create({
      data: {
        name,
        key,
        description,
        category
      }
    });

    res.status(201).json({
      success: true,
      data: newFunction,
      message: 'Function created successfully'
    });
  } catch (error) {
    console.error('Error creating function:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create function'
    });
  }
});

// Update system function
router.put('/functions/:id', auth, roleCheck(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, key, description, category, isActive } = req.body;

    const updatedFunction = await prisma.systemFunction.update({
      where: { id: parseInt(id) },
      data: {
        name,
        key,
        description,
        category,
        isActive
      }
    });

    res.json({
      success: true,
      data: updatedFunction,
      message: 'Function updated successfully'
    });
  } catch (error) {
    console.error('Error updating function:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update function'
    });
  }
});

// Update role permissions for a function
router.put('/permissions', auth, roleCheck(['superadmin', 'area_coordinator']), async (req, res) => {
  try {
    const { functionId, rolePermissions } = req.body;

    if (!functionId || !rolePermissions) {
      return res.status(400).json({
        success: false,
        message: 'Function ID and role permissions are required'
      });
    }

    // Delete existing permissions for this function
    await prisma.roleFunctionPermission.deleteMany({
      where: { functionId: parseInt(functionId) }
    });

    // Create new permissions
    const permissionsToCreate = [];
    for (const [role, isEnabled] of Object.entries(rolePermissions)) {
      if (['admin', 'area_coordinator', 'coordinator'].includes(role)) {
        permissionsToCreate.push({
          role,
          functionId: parseInt(functionId),
          isEnabled: Boolean(isEnabled)
        });
      }
    }

    if (permissionsToCreate.length > 0) {
      await prisma.roleFunctionPermission.createMany({
        data: permissionsToCreate
      });
    }

    res.json({
      success: true,
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update permissions'
    });
  }
});

// Initialize default functions (run once)
router.post('/initialize', auth, roleCheck(['superadmin']), async (req, res) => {
  try {
    const defaultFunctions = [
      { name: 'Users', key: 'users', category: 'Management', description: 'User management interface' },
      { name: 'Agent Management', key: 'agent_management', category: 'User Management', description: 'Manage agent accounts' },
      { name: 'Coordinator Management', key: 'coordinator_management', category: 'User Management', description: 'Manage coordinator accounts' },
      { name: 'Area Coordinator Management', key: 'area_coordinator_management', category: 'User Management', description: 'Manage area coordinator accounts' },
      { name: 'Balance Management', key: 'balance_management', category: 'System Management', description: 'Manage user balances' },
      { name: 'Bet Limits', key: 'bet_limits', category: 'System Management', description: 'Configure betting limits' },
      { name: 'Draw Results', key: 'draw_results', category: 'System Management', description: 'Input and manage draw results' },
      { name: 'Ticket Templates', key: 'ticket_templates', category: 'System Management', description: 'Design ticket templates' },
      { name: 'Tickets', key: 'tickets', category: 'Operations', description: 'View and manage tickets' },
      { name: 'Agent Tickets', key: 'agent_tickets', category: 'Ticket Management', description: 'View and manage agent lottery tickets with reprint functionality' },
      { name: 'Sales', key: 'sales', category: 'Operations', description: 'View sales data' },
      { name: 'Sales per Draw', key: 'sales_per_draw', category: 'Reports', description: 'View sales data per draw' },
      { name: 'Winning Tickets', key: 'winning_tickets', category: 'Operations', description: 'View winning tickets and prizes' },
      { name: 'Reports', key: 'reports', category: 'Reports', description: 'Generate reports' },
      { name: 'Sales Reports', key: 'sales_reports', category: 'Reports', description: 'Generate sales reports' },
      { name: 'Notifications', key: 'notifications', category: 'General', description: 'View notifications' }
    ];

    // Check if functions already exist
    const existingFunctions = await prisma.systemFunction.findMany();
    if (existingFunctions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Functions already initialized'
      });
    }

    // Create functions
    const createdFunctions = await prisma.systemFunction.createMany({
      data: defaultFunctions
    });

    // Create default permissions based on role
    const functions = await prisma.systemFunction.findMany();
    const defaultPermissions = [];
    
    functions.forEach(func => {
      // Define which functions each role should have access to
      const rolePermissions = {
        'admin': true, // Admin has access to all functions
        'area_coordinator': true, // Area coordinator has access to all functions
        'coordinator': true, // Coordinator has access to all functions
        'agent': ['sales_per_draw', 'winning_tickets', 'tickets', 'agent_tickets', 'sales', 'notifications'].includes(func.key),
        'operator': ['tickets', 'agent_tickets', 'sales', 'notifications'].includes(func.key)
      };
      
      Object.entries(rolePermissions).forEach(([role, hasAccess]) => {
        if (hasAccess) {
          defaultPermissions.push({
            role,
            functionId: func.id,
            isEnabled: true
          });
        }
      });
    });

    await prisma.roleFunctionPermission.createMany({
      data: defaultPermissions
    });

    res.json({
      success: true,
      message: 'Functions initialized successfully',
      data: { functionsCreated: createdFunctions.count }
    });
  } catch (error) {
    console.error('Error initializing functions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize functions'
    });
  }
});

// Delete system function
router.delete('/functions/:id', auth, roleCheck(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated permissions first
    await prisma.roleFunctionPermission.deleteMany({
      where: { functionId: parseInt(id) }
    });

    // Delete function
    await prisma.systemFunction.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Function deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting function:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete function'
    });
  }
});

module.exports = router;
