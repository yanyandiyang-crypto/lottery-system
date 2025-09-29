const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin, requireCoordinator } = require('../middleware/roleCheck');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/v1/bet-limits
// @desc    Get current bet limits
// @access  Coordinator level and above
router.get('/', requireAuth, requireCoordinator, async (req, res) => {
  try {
    const betLimits = await prisma.betLimit.findMany({
      where: { isActive: true },
      include: {
        createdBy: {
          select: { id: true, fullName: true }
        }
      },
      orderBy: { betType: 'asc' }
    });

    // Transform data to match frontend expectations
    const transformedBetLimits = betLimits.map(limit => ({
      ...limit,
      maxAmount: limit.limitAmount, // Map limitAmount to maxAmount for frontend
      currentTotal: 0 // Default current total, should be calculated from actual bets
    }));

    res.json({
      success: true,
      data: transformedBetLimits
    });

  } catch (error) {
    console.error('Get bet limits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bet limits'
    });
  }
});

// @route   POST /api/v1/bet-limits
// @desc    Set bet limits
// @access  Admin level and above (only admins can modify limits)
router.post('/', requireAuth, requireAdmin, [
  body('betType').notEmpty().withMessage('Bet type is required'),
  body('maxAmount').optional().isFloat({ min: 1 }).withMessage('Max amount must be at least 1 peso'),
  body('limitAmount').optional().isFloat({ min: 1 }).withMessage('Limit amount must be at least 1 peso')
], async (req, res) => {
  try {
    console.log('Received bet limit request:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { betType, limitAmount, maxAmount } = req.body;
    const amount = maxAmount || limitAmount;

    console.log('Processing bet limit:', { betType, amount, maxAmount, limitAmount });

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Either maxAmount or limitAmount is required'
      });
    }

    // Update or create bet limit
    const betLimit = await prisma.betLimit.upsert({
      where: { betType: betType },
      update: {
        limitAmount: amount,
        updatedAt: new Date()
      },
      create: {
        betType: betType,
        limitAmount: amount,
        createdById: parseInt(req.user.id)
      },
      include: {
        createdBy: {
          select: { id: true, fullName: true }
        }
      }
    });

    res.json({
      success: true,
      message: 'Bet limit updated successfully',
      data: betLimit
    });

  } catch (error) {
    console.error('Set bet limit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting bet limit'
    });
  }
});

// @route   GET /api/v1/bet-limits/check/:drawId/:betCombination/:betType
// @desc    Check if bet combination is sold out for specific draw
// @access  Private
router.get('/check/:drawId/:betCombination/:betType', requireAuth, async (req, res) => {
  try {
    const { drawId, betCombination, betType } = req.params;

    // Get current bet total for this combination
    const currentTotal = await prisma.currentBetTotal.findUnique({
      where: {
        drawId_betCombination_betType: {
          drawId: parseInt(drawId),
          betCombination: betCombination,
          betType: betType
        }
      }
    });

    // Determine limit: prefer per-number limit when present, else fall back to global betType limit
    let perNumberLimitAmount = null;
    try {
      const rows = await prisma.$queryRaw`SELECT limit_amount FROM bet_limits_per_draw WHERE draw_id = ${parseInt(drawId)} AND bet_combination = ${betCombination} AND bet_type = ${betType} LIMIT 1`;
      if (Array.isArray(rows) && rows.length > 0) {
        perNumberLimitAmount = Number(rows[0].limit_amount);
      }
    } catch (e) {
      console.log('Per-number limit lookup failed or table missing, using global limit. Reason:', e.message);
    }

    // Get global betType limit as fallback
    const globalBetLimit = await prisma.betLimit.findUnique({ where: { betType: betType } });
    const effectiveLimit = perNumberLimitAmount ?? globalBetLimit?.limitAmount ?? 0;
    if (!effectiveLimit || effectiveLimit <= 0) {
      return res.status(404).json({ success: false, message: 'Bet limit not configured' });
    }

    const currentAmount = currentTotal?.totalAmount || 0;
    const isSoldOut = currentAmount >= effectiveLimit;

    res.json({
      success: true,
      data: {
        betCombination: betCombination,
        betType: betType,
        currentAmount: currentAmount,
        limitAmount: effectiveLimit,
        remainingAmount: Math.max(0, effectiveLimit - currentAmount),
        isSoldOut: isSoldOut
      }
    });

  } catch (error) {
    console.error('Check bet limit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking bet limit'
    });
  }
});

// @route   POST /api/v1/bet-limits/per-number
// @desc    Set or update per-number limit for a specific draw and number
// @access  Admin level and above (only admins can modify limits)
router.post('/per-number', requireAuth, requireAdmin, [
  body('drawId').isInt().withMessage('Draw ID is required'),
  body('betCombination').isString().withMessage('Bet combination is required'),
  body('betType').isIn(['standard', 'rambolito']).withMessage('Invalid bet type'),
  body('limitAmount').isFloat({ min: 1 }).withMessage('Limit amount must be at least 1 peso')
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

    const { drawId, betCombination, betType, limitAmount } = req.body;

    // Try update first
    let updated = 0;
    try {
      updated = await prisma.$executeRaw`UPDATE bet_limits_per_draw SET limit_amount = ${parseFloat(limitAmount)}, updatedAt = NOW() WHERE draw_id = ${parseInt(drawId)} AND bet_combination = ${betCombination} AND bet_type = ${betType}`;
    } catch (e) {
      console.log('Per-number UPDATE failed (may be missing table):', e.message);
    }

    if (!updated || updated === 0) {
      // Insert if not exists
      try {
        await prisma.$executeRaw`INSERT INTO bet_limits_per_draw (draw_id, bet_combination, bet_type, limit_amount, current_amount, is_sold_out, "updatedAt") VALUES (${parseInt(drawId)}, ${betCombination}, ${betType}, ${parseFloat(limitAmount)}, 0, false, NOW())`;
      } catch (e) {
        return res.status(500).json({ success: false, message: 'Error saving per-number limit (table missing or constraint error)', error: e.message });
      }
    }

    res.json({ success: true, message: 'Per-number limit saved' });
  } catch (error) {
    console.error('Set per-number limit error:', error);
    res.status(500).json({ success: false, message: 'Error setting per-number limit' });
  }
});

// @route   POST /api/v1/bet-limits/update-total
// @desc    Update bet total for combination (internal use)
// @access  Private
router.post('/update-total', requireAuth, [
  body('drawId').isInt().withMessage('Draw ID is required'),
  body('betCombination').isString().withMessage('Bet combination is required'),
  body('betType').isIn(['standard', 'rambolito']).withMessage('Invalid bet type'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be positive')
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

    const { drawId, betCombination, betType, amount } = req.body;

    // Update current bet total
    const updatedTotal = await prisma.currentBetTotal.upsert({
      where: {
        drawId_betCombination_betType: {
          drawId: drawId,
          betCombination: betCombination,
          betType: betType
        }
      },
      update: {
        totalAmount: {
          increment: amount
        },
        ticketCount: {
          increment: 1
        },
        updatedAt: new Date()
      },
      create: {
        drawId: drawId,
        betCombination: betCombination,
        betType: betType,
        totalAmount: amount,
        ticketCount: 1
      }
    });

    // Check if now sold out
    const betLimit = await prisma.betLimit.findUnique({
      where: { betType: betType }
    });

    const isSoldOut = betLimit && updatedTotal.totalAmount >= betLimit.limitAmount;

    res.json({
      success: true,
      data: {
        ...updatedTotal,
        isSoldOut: isSoldOut
      }
    });

  } catch (error) {
    console.error('Update bet total error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating bet total'
    });
  }
});

// @route   GET /api/v1/bet-limits/sold-out/:drawId
// @desc    Get all sold out combinations for a draw
// @access  Private
router.get('/sold-out/:drawId', requireAuth, async (req, res) => {
  try {
    const { drawId } = req.params;

    // Get all bet limits
    const betLimits = await prisma.betLimit.findMany({
      where: { isActive: true }
    });

    // Get current totals for this draw
    const currentTotals = await prisma.currentBetTotal.findMany({
      where: { drawId: parseInt(drawId) }
    });

    // Find sold out combinations
    const soldOutCombinations = [];
    
    for (const total of currentTotals) {
      const limit = betLimits.find(l => l.betType === total.betType);
      if (limit && total.totalAmount >= limit.limitAmount) {
        soldOutCombinations.push({
          betCombination: total.betCombination,
          betType: total.betType,
          totalAmount: total.totalAmount,
          limitAmount: limit.limitAmount
        });
      }
    }

    res.json({
      success: true,
      data: soldOutCombinations
    });

  } catch (error) {
    console.error('Get sold out combinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sold out combinations'
    });
  }
});

// @route   GET /api/v1/bet-limits/current
// @desc    Get current number totals for a draw (optionally filter by betType or number)
// @access  Coordinator level and above
router.get('/current', requireAuth, requireCoordinator, async (req, res) => {
  try {
    const { drawId, betType, number } = req.query;
    if (!drawId) {
      return res.status(400).json({ success: false, message: 'drawId is required' });
    }

    const where = { drawId: parseInt(drawId, 10) };
    if (betType) where.betType = betType;
    if (number) where.betCombination = number;

    const [totals, limits] = await Promise.all([
      prisma.currentBetTotal.findMany({
        where,
        orderBy: [ { totalAmount: 'desc' }, { betCombination: 'asc' } ],
        take: 500
      }),
      prisma.betLimit.findMany({ where: { isActive: true }})
    ]);

    const limitMap = new Map(limits.map(l => [l.betType, l.limitAmount]));
    const rows = totals.map(t => {
      const limit = limitMap.get(t.betType) || 0;
      const utilization = limit > 0 ? (t.totalAmount / limit) * 100 : 0;
      return {
        betCombination: t.betCombination,
        betType: t.betType,
        totalAmount: t.totalAmount,
        ticketCount: t.ticketCount,
        limitAmount: limit,
        utilization,
        isSoldOut: limit > 0 && t.totalAmount >= limit
      };
    });

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Get current totals error:', error);
    res.status(500).json({ success: false, message: 'Error fetching current totals' });
  }
});

module.exports = router;
