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
    const existingAssignment = await prisma.agentTicketTemplate.findFirst({
      where: {
        agentId: userId,
        templateId
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

// @route   POST /api/ticket-templates/assignments
// @desc    Assign template to user (alternative endpoint)
// @access  Private (Admin/SuperAdmin)
router.post('/assignments', requireAuth, [
  body('userId').isInt().withMessage('Valid user ID is required'),
  body('templateId').isInt().withMessage('Valid template ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors.array()
      });
    }

    const { userId, templateId } = req.body;

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

    // Check if user exists and is an agent
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'agent') {
      return res.status(400).json({
        success: false,
        message: 'User not found or is not an agent'
      });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.agentTicketTemplate.findFirst({
      where: {
        agentId: userId,
        templateId
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
            fullName: true
          }
        },
        template: {
          select: {
            id: true,
            name: true
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

// @route   DELETE /api/ticket-templates/assignments
// @desc    Remove template assignment (alternative endpoint)
// @access  Private (Admin/SuperAdmin)
router.delete('/assignments', requireAuth, async (req, res) => {
  try {
    const { userId, templateId } = req.body;

    if (!userId || !templateId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Template ID are required'
      });
    }

    // Find assignment by userId and templateId
    const assignment = await prisma.agentTicketTemplate.findFirst({
      where: {
        agentId: parseInt(userId),
        templateId: parseInt(templateId)
      }
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    await prisma.agentTicketTemplate.delete({
      where: { id: assignment.id }
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

    // Extract active templates and ensure isActive property is set correctly
    const activeTemplates = assignments
      .filter(assignment => assignment.template.isActive)
      .map(assignment => ({
        ...assignment.template,
        isActive: true // Ensure isActive is explicitly set
      }));

    // If no templates assigned, get default template (ID: 1)
    if (activeTemplates.length === 0) {
      const defaultTemplate = await prisma.ticketTemplate.findFirst({
        where: { 
          id: 1,
          isActive: true 
        }
      });
      
      if (defaultTemplate) {
        activeTemplates.push({
          ...defaultTemplate,
          isActive: true
        });
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

// @route   GET /api/ticket-templates/generate
// @desc    Generate ticket HTML from template
// @access  Private
router.get('/generate', requireAuth, async (req, res) => {
  try {
    const { ticketId, templateId } = req.query;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID is required'
      });
    }

    // Get ticket data - support both ID and ticket number
    const ticket = await prisma.ticket.findFirst({
      where: isNaN(parseInt(ticketId)) 
        ? { ticketNumber: ticketId }
        : { id: parseInt(ticketId) },
      include: {
        bets: true,
        draw: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Use single Umatik template (no database template lookup needed)
    const { generateUmatikCenterTicketHTML } = require('../utils/umatikTicketTemplate');
    const ticketHtml = await generateUmatikCenterTicketHTML(ticket, ticket.user);

    res.json({
      success: true,
      data: {
        html: ticketHtml,
        template: {
          id: 'umatik-center',
          name: 'Umatik Center Template',
          type: 'mobile-pos'
        }
      }
    });

  } catch (error) {
    console.error('Generate ticket HTML error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/ticket-templates/user-assignment/:userId
// @desc    Get template assignment for a specific user
// @access  Private
router.get('/user-assignment/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get template assignment for user with active template only
    const assignment = await prisma.agentTicketTemplate.findFirst({
      where: { 
        agentId: parseInt(userId),
        template: { isActive: true }
      },
      include: {
        template: true
      }
    });

    if (!assignment) {
      // If no active template assigned, return default template (Design 1)
      const defaultTemplate = await prisma.ticketTemplate.findFirst({
        where: { 
          design: { path: ['templateDesign'], equals: 1 },
          isActive: true 
        }
      });
      
      return res.json({
        success: true,
        data: { 
          template: defaultTemplate,
          assignment: null
        }
      });
    }

    res.json({
      success: true,
      data: {
        template: assignment.template,
        assignment: {
          id: assignment.id,
          assignedAt: assignment.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get user template assignment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/ticket-templates/assign-design
// @desc    Assign template design (1-5) to agent
// @access  Private (Admin/SuperAdmin)
router.post('/assign-design', requireAuth, [
  body('userId').isInt().withMessage('Valid user ID is required'),
  body('templateDesign').isInt({ min: 1, max: 5 }).withMessage('Template design must be between 1 and 5')
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

    const { userId, templateDesign } = req.body;

    // Check if user exists and is an agent
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || user.role !== 'agent') {
      return res.status(400).json({
        success: false,
        message: 'User not found or is not an agent'
      });
    }

    // Find template with the specified design number (safe JS-side filter to avoid JSON path issues)
    let template = null;
    const activeTemplates = await prisma.ticketTemplate.findMany({ where: { isActive: true } });
    if (Array.isArray(activeTemplates)) {
      template = activeTemplates.find(t => {
        try {
          const d = t.design || {};
          return Number(d.templateDesign) === Number(templateDesign);
        } catch (_) {
          return false;
        }
      }) || null;
    }

    if (!template) {
      // Auto-create minimal template when missing
      const now = new Date();
      const isUmatik = Number(templateDesign) === 3;
      const name = isUmatik ? 'Umatik Ticket Template' : `Default Ticket Template`;
      const design = {
        templateDesign: Number(templateDesign),
        templateType: isUmatik ? 'umatik' : 'standard',
        backgroundColor: '#ffffff',
        canvasWidth: 600,
        canvasHeight: 900,
        dynamicHeight: true
      };
      template = await prisma.ticketTemplate.create({
        data: {
          name,
          design,
          isActive: true,
          createdById: req.user?.id || null,
          createdAt: now
        }
      });
    }

    // Remove existing assignments for this agent
    await prisma.agentTicketTemplate.deleteMany({
      where: { agentId: userId }
    });

    // Create new assignment
    const assignment = await prisma.agentTicketTemplate.create({
      data: {
        agentId: userId,
        templateId: template.id
      },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            design: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: `Template Design ${templateDesign} assigned successfully`,
      data: assignment
    });

  } catch (error) {
    console.error('Assign template design error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
