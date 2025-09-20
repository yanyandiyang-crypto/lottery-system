const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/ticket-templates
// @desc    Get all ticket templates
// @access  Private (Admin/SuperAdmin)
router.get('/', requireAuth, async (req, res) => {
  try {
    const templates = await prisma.ticketTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/ticket-templates
// @desc    Create new ticket template
// @access  Private (Admin/SuperAdmin)
router.post('/', requireAuth, [
  body('name').notEmpty().withMessage('Template name is required'),
  body('design').isObject().withMessage('Design configuration is required')
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

    const { name, design } = req.body;

    // Check if template name already exists
    const existingTemplate = await prisma.ticketTemplate.findUnique({
      where: { name }
    });

    if (existingTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Template name already exists'
      });
    }

    const template = await prisma.ticketTemplate.create({
      data: {
        name,
        design,
        createdById: req.user?.id || 1
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });

  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/ticket-templates/:id
// @desc    Update ticket template
// @access  Private (Admin/SuperAdmin)
router.put('/:id', requireAuth, [
  body('name').notEmpty().withMessage('Template name is required'),
  body('design').isObject().withMessage('Design configuration is required')
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

    const templateId = parseInt(req.params.id);
    const { name, design } = req.body;

    // Check if template exists
    const existingTemplate = await prisma.ticketTemplate.findUnique({
      where: { id: templateId }
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if new name conflicts with another template
    if (name !== existingTemplate.name) {
      const nameConflict = await prisma.ticketTemplate.findUnique({
        where: { name }
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          message: 'Template name already exists'
        });
      }
    }

    const updatedTemplate = await prisma.ticketTemplate.update({
      where: { id: templateId },
      data: {
        name,
        design,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Template updated successfully',
      data: updatedTemplate
    });

  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/ticket-templates/:id
// @desc    Delete ticket template
// @access  Private (Admin/SuperAdmin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);

    // Check if template exists
    const existingTemplate = await prisma.ticketTemplate.findUnique({
      where: { id: templateId }
    });

    if (!existingTemplate) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if template is being used by any agents
    const agentAssignments = await prisma.agentTicketTemplate.count({
      where: { templateId }
    });

    if (agentAssignments > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete template that is assigned to agents'
      });
    }

    await prisma.ticketTemplate.delete({
      where: { id: templateId }
    });

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/ticket-templates/:id/toggle-active
// @desc    Toggle template active status
// @access  Private (Admin/SuperAdmin)
router.put('/:id/toggle-active', requireAuth, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);

    const template = await prisma.ticketTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    const updatedTemplate = await prisma.ticketTemplate.update({
      where: { id: templateId },
      data: {
        isActive: !template.isActive
      }
    });

    res.json({
      success: true,
      message: `Template ${updatedTemplate.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedTemplate
    });

  } catch (error) {
    console.error('Toggle template status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/ticket-templates/assignments
// @desc    Get all template assignments
// @access  Private (Admin/SuperAdmin)
router.get('/assignments', requireAuth, async (req, res) => {
  try {
    const assignments = await prisma.agentTicketTemplate.findMany({
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    res.json({
      success: true,
      data: assignments
    });

  } catch (error) {
    console.error('Get template assignments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/ticket-templates/assign
// @desc    Assign template to user
// @access  Private (Admin/SuperAdmin)
router.post('/assign', requireAuth, [
  body('userId').isInt().withMessage('Valid user ID is required'),
  body('templateId').isInt().withMessage('Valid template ID is required')
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

    const { userId, templateId } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if template exists
    const template = await prisma.ticketTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.agentTicketTemplate.findUnique({
      where: {
        agentId_templateId: {
          agentId: userId,
          templateId
        }
      }
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: 'Template already assigned to this user'
      });
    }

    const assignment = await prisma.agentTicketTemplate.create({
      data: {
        agentId: userId,
        templateId
      },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Template assigned successfully',
      data: assignment
    });

  } catch (error) {
    console.error('Assign template error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   DELETE /api/ticket-templates/assignments/:id
// @desc    Remove template assignment
// @access  Private (Admin/SuperAdmin)
router.delete('/assignments/:id', requireAuth, async (req, res) => {
  try {
    const assignmentId = parseInt(req.params.id);

    // Check if assignment exists
    const assignment = await prisma.agentTicketTemplate.findUnique({
      where: { id: assignmentId }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    await prisma.agentTicketTemplate.delete({
      where: { id: assignmentId }
    });

    res.json({
      success: true,
      message: 'Template assignment removed successfully'
    });

  } catch (error) {
    console.error('Remove template assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/ticket-templates/agent/:agentId
// @desc    Get templates assigned to specific agent
// @access  Private
router.get('/agent/:agentId', requireAuth, async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);

    // Check if user exists and is an agent
    const agent = await prisma.user.findUnique({
      where: { id: agentId }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found'
      });
    }

    // Get assigned templates for this agent
    const assignments = await prisma.agentTicketTemplate.findMany({
      where: { agentId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            design: true,
            isActive: true
          }
        }
      }
    });

    // Extract active templates
    const activeTemplates = assignments
      .filter(assignment => assignment.template.isActive)
      .map(assignment => assignment.template);

    // If no templates assigned, get default template (ID: 1)
    if (activeTemplates.length === 0) {
      const defaultTemplate = await prisma.ticketTemplate.findUnique({
        where: { id: 1 }
      });
      
      if (defaultTemplate) {
        activeTemplates.push(defaultTemplate);
      }
    }

    res.json({
      success: true,
      data: activeTemplates
    });

  } catch (error) {
    console.error('Get agent templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
