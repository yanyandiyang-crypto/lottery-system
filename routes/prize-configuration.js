const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/roleCheck');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/prize-configuration
// @desc    Get all prize configurations
// @access  Private (SuperAdmin only)
router.get('/', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const configurations = await prisma.prizeConfiguration.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      },
      orderBy: {
        betType: 'asc'
      }
    });

    res.json({
      success: true,
      data: configurations
    });
  } catch (error) {
    console.error('Get prize configurations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prize configurations'
    });
  }
});

// @route   GET /api/prize-configuration/:betType
// @desc    Get prize configuration for specific bet type
// @access  Private (SuperAdmin only)
router.get('/:betType', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { betType } = req.params;

    const configuration = await prisma.prizeConfiguration.findUnique({
      where: { betType },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Prize configuration not found'
      });
    }

    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('Get prize configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prize configuration'
    });
  }
});

// @route   POST /api/prize-configuration
// @desc    Create or update prize configuration
// @access  Private (SuperAdmin only)
router.post('/', requireAuth, requireSuperAdmin, [
  body('betType').isIn(['standard', 'rambolito']).withMessage('Invalid bet type'),
  body('multiplier').isFloat({ min: 0 }).withMessage('Multiplier must be a positive number'),
  body('baseAmount').isFloat({ min: 0 }).withMessage('Base amount must be a positive number'),
  body('basePrize').isFloat({ min: 0 }).withMessage('Base prize must be a positive number'),
  body('description').optional().isString().withMessage('Description must be a string')
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

    const { betType, multiplier, baseAmount, basePrize, description } = req.body;

    // Check if configuration already exists
    const existingConfig = await prisma.prizeConfiguration.findUnique({
      where: { betType }
    });

    let configuration;

    if (existingConfig) {
      // Update existing configuration
      configuration = await prisma.prizeConfiguration.update({
        where: { betType },
        data: {
          multiplier,
          baseAmount,
          basePrize,
          description,
          updatedById: req.user.id,
          updatedAt: new Date()
        },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              username: true
            }
          },
          updatedBy: {
            select: {
              id: true,
              fullName: true,
              username: true
            }
          }
        }
      });
    } else {
      // Create new configuration
      configuration = await prisma.prizeConfiguration.create({
        data: {
          betType,
          multiplier,
          baseAmount,
          basePrize,
          description,
          createdById: req.user.id
        },
        include: {
          createdBy: {
            select: {
              id: true,
              fullName: true,
              username: true
            }
          }
        }
      });
    }

    res.json({
      success: true,
      message: existingConfig ? 'Prize configuration updated successfully' : 'Prize configuration created successfully',
      data: configuration
    });
  } catch (error) {
    console.error('Create/Update prize configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating/updating prize configuration'
    });
  }
});

// @route   PUT /api/prize-configuration/:betType/toggle
// @desc    Toggle prize configuration active status
// @access  Private (SuperAdmin only)
router.put('/:betType/toggle', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { betType } = req.params;

    const configuration = await prisma.prizeConfiguration.findUnique({
      where: { betType }
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Prize configuration not found'
      });
    }

    const updatedConfiguration = await prisma.prizeConfiguration.update({
      where: { betType },
      data: {
        isActive: !configuration.isActive,
        updatedById: req.user.id,
        updatedAt: new Date()
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        },
        updatedBy: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: `Prize configuration ${updatedConfiguration.isActive ? 'activated' : 'deactivated'} successfully`,
      data: updatedConfiguration
    });
  } catch (error) {
    console.error('Toggle prize configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling prize configuration'
    });
  }
});

// @route   DELETE /api/prize-configuration/:betType
// @desc    Delete prize configuration
// @access  Private (SuperAdmin only)
router.delete('/:betType', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { betType } = req.params;

    const configuration = await prisma.prizeConfiguration.findUnique({
      where: { betType }
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: 'Prize configuration not found'
      });
    }

    await prisma.prizeConfiguration.delete({
      where: { betType }
    });

    res.json({
      success: true,
      message: 'Prize configuration deleted successfully'
    });
  } catch (error) {
    console.error('Delete prize configuration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting prize configuration'
    });
  }
});

// @route   POST /api/prize-configuration/calculate
// @desc    Calculate prize amount based on configuration
// @access  Private (SuperAdmin only)
router.post('/calculate', requireAuth, requireSuperAdmin, [
  body('betType').isIn(['standard', 'rambolito']).withMessage('Invalid bet type'),
  body('betAmount').isFloat({ min: 0 }).withMessage('Bet amount must be a positive number'),
  body('betDigits').optional().isString().withMessage('Bet digits must be a string')
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

    const { betType, betAmount, betDigits } = req.body;

    // Get configuration for this bet type
    const configuration = await prisma.prizeConfiguration.findUnique({
      where: { betType }
    });

    if (!configuration) {
      return res.status(404).json({
        success: false,
        message: `No prize configuration found for ${betType} betting`
      });
    }

    if (!configuration.isActive) {
      return res.status(400).json({
        success: false,
        message: `Prize configuration for ${betType} betting is inactive`
      });
    }

    // Calculate prize amount
    let prizeAmount = 0;
    
    if (betType === 'standard') {
      prizeAmount = betAmount * configuration.multiplier;
    } else if (betType === 'rambolito') {
      if (!betDigits) {
        return res.status(400).json({
          success: false,
          message: 'Bet digits required for rambolito calculation'
        });
      }

      const digits = betDigits.split('');
      const uniqueDigits = [...new Set(digits)];

      if (uniqueDigits.length === 1) {
        // Triple number, invalid
        prizeAmount = 0;
      } else if (uniqueDigits.length === 2) {
        // Double number - use different multiplier if configured
        prizeAmount = betAmount * (configuration.multiplier * 0.33); // 150x for double
      } else {
        // All different digits
        prizeAmount = betAmount * (configuration.multiplier * 0.17); // 75x for rambolito
      }
    }

    res.json({
      success: true,
      data: {
        betType,
        betAmount,
        betDigits,
        prizeAmount,
        multiplier: configuration.multiplier,
        configuration: {
          id: configuration.id,
          baseAmount: configuration.baseAmount,
          basePrize: configuration.basePrize,
          description: configuration.description
        }
      }
    });
  } catch (error) {
    console.error('Calculate prize error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating prize amount'
    });
  }
});

module.exports = router;

