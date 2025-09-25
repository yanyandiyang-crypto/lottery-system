const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const moment = require('moment-timezone');
const { requireAdmin, requireOperator } = require('../middleware/roleCheck');
const { isWinningTicket, calculateWinningPrize } = require('../utils/bettingValidator');
const drawScheduler = require('../services/drawScheduler');

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/draws
// @desc    Get all draws
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      startDate, 
      endDate,
      date,
      drawTime 
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};

    // Date filtering
    if (date) {
      // If specific date is provided, filter for that exact date
      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      whereClause.drawDate = {
        gte: targetDate,
        lt: nextDate
      };
    } else if (startDate || endDate) {
      whereClause.drawDate = {};
      if (startDate) whereClause.drawDate.gte = new Date(startDate);
      if (endDate) whereClause.drawDate.lte = new Date(endDate);
    }

    // Additional filters
    if (status && status !== 'all') whereClause.status = status;
    if (drawTime) whereClause.drawTime = drawTime;

    const draws = await prisma.draw.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            tickets: true,
            winningTickets: true
          }
        }
      },
      skip: offset,
      take: parseInt(limit),
      orderBy: [
        { drawDate: 'desc' },
        { drawTime: 'desc' }
      ]
    });

    // Calculate total payout for each draw
    const drawsWithPayout = await Promise.all(draws.map(async (draw) => {
      const totalPayout = await prisma.winningTicket.aggregate({
        where: { drawId: draw.id },
        _sum: {
          prizeAmount: true
        }
      });

      return {
        ...draw,
        totalPayout: totalPayout._sum.prizeAmount || 0
      };
    }));

    const total = await prisma.draw.count({ where: whereClause });

    res.json({
      success: true,
      data: drawsWithPayout,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get draws error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/draws/:id
// @desc    Get draw by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const drawId = parseInt(req.params.id);

    const draw = await prisma.draw.findUnique({
      where: { id: drawId },
      include: {
        tickets: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true
              }
            }
          }
        },
        winningTickets: true
      }
    });

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    res.json({
      success: true,
      data: draw
    });

  } catch (error) {
    console.error('Get draw error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/draws/:id/result
// @desc    Set winning number for draw (Admin/SuperAdmin only)
// @access  Private (Admin/SuperAdmin)
router.post('/:id/result', requireAdmin, [
  body('winningNumber').matches(/^\d{3}$/).withMessage('Winning number must be exactly 3 digits')
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

    const drawId = parseInt(req.params.id);
    const { winningNumber } = req.body;

    const draw = await prisma.draw.findUnique({
      where: { id: drawId }
    });

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    if (draw.status !== 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Draw must be closed before result can be input'
      });
    }

    // Update draw with winning number
    const updatedDraw = await prisma.draw.update({
      where: { id: drawId },
      data: {
        winningNumber,
        status: 'settled',
        settledAt: require('../utils/philippineTime').now()
      }
    });

    // Find all tickets with their bets
    const tickets = await prisma.ticket.findMany({
      where: { drawId },
      include: {
        user: true,
        bets: true  // Include all bets for this ticket
      }
    });

    const winningTickets = [];
    const io = req.app.get('io');

    for (const ticket of tickets) {
      let ticketHasWinner = false;
      let totalWinningPrize = 0;
      const winningBets = [];

      // Check each bet on this ticket
      for (const bet of ticket.bets) {
        const isWinner = isWinningTicket(bet.betType, bet.betCombination, winningNumber);
        
        if (isWinner) {
          ticketHasWinner = true;
          const winningPrize = await calculateWinningPrize(bet.betType, bet.betCombination, bet.betAmount);
          totalWinningPrize += winningPrize;
          
          winningBets.push({
            betId: bet.id,
            betCombination: bet.betCombination,
            betType: bet.betType,
            betAmount: bet.betAmount,
            winningPrize: winningPrize
          });
        }
      }

      // If ticket has any winning bets, process it
      if (ticketHasWinner) {
        // Update ticket
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            status: 'validated',
            validatedAt: require('../utils/philippineTime').now()
          }
        });

        // Create winning ticket record
        await prisma.winningTicket.create({
          data: {
            ticketId: ticket.id,
            drawId: ticket.drawId,
            prizeAmount: totalWinningPrize
          }
        });

        winningTickets.push({
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          agentId: ticket.userId,
          agentName: ticket.user.fullName,
          coordinatorId: ticket.user.coordinatorId,
          winningBets: winningBets,
          totalWinningPrize: totalWinningPrize
        });

        // Send notifications
        if (io) {
          // Notify agent
          io.to(`user-${ticket.userId}`).emit('you-won', {
            ticketNumber: ticket.ticketNumber,
            winningBets: winningBets,
            totalWinningPrize: totalWinningPrize,
            drawTime: draw.drawTime,
            drawDate: draw.drawDate
          });

          // Notify coordinator
          if (ticket.user.coordinatorId) {
            io.to(`user-${ticket.user.coordinatorId}`).emit('agent-won', {
              agentName: ticket.user.fullName,
              ticketNumber: ticket.ticketNumber,
              winningBets: winningBets,
              totalWinningPrize: totalWinningPrize,
              drawTime: draw.drawTime,
              drawDate: draw.drawDate
            });
          }
        }
      }
    }

    // Send notification to all users about draw result
    if (io) {
      io.emit('draw-result', {
        drawId: draw.id,
        drawDate: draw.drawDate,
        drawTime: draw.drawTime,
        winningNumber,
        totalWinners: winningTickets.length,
        totalPrize: winningTickets.reduce((sum, ticket) => sum + ticket.winningPrize, 0)
      });
    }

    res.json({
      success: true,
      message: 'Draw result set successfully',
      data: {
        draw: updatedDraw,
        winningTickets,
        totalWinners: winningTickets.length,
        totalPrize: winningTickets.reduce((sum, ticket) => sum + ticket.winningPrize, 0)
      }
    });

  } catch (error) {
    console.error('Set draw result error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/draws/current/active
// @desc    Get current active draws (with proper betting window logic)
// @access  Private
router.get('/current/active', async (req, res) => {
  try {
    const now = moment().tz('Asia/Manila');
    const today = now.format('YYYY-MM-DD');
    const tomorrow = now.clone().add(1, 'day').format('YYYY-MM-DD');

    // Get all draws for today and tomorrow (not just open ones)
    const draws = await prisma.draw.findMany({
      where: {
        drawDate: {
          in: [new Date(today), new Date(tomorrow)]
        }
      },
      include: {
        _count: {
          select: {
            tickets: true
          }
        }
      },
      orderBy: [
        { drawDate: 'asc' },
        { drawTime: 'asc' }
      ]
    });

    const availableDraws = [];

    for (const draw of draws) {
      const drawDate = moment(draw.drawDate).tz('Asia/Manila');
      const isToday = drawDate.format('YYYY-MM-DD') === today;
      const isTomorrow = drawDate.format('YYYY-MM-DD') === tomorrow;

      // Determine if this draw is currently available for betting
      let isAvailable = false;
      let bettingWindow = null;

      if (draw.drawTime === 'twoPM') {
        // 2PM draw is available from 9PM previous day until 1:55PM
        const cutoffTime = drawDate.clone().hour(13).minute(55).second(0);
        
        if (isToday) {
          // Today's 2PM draw: available until 1:55PM today
          isAvailable = now.isBefore(cutoffTime);
          bettingWindow = {
            startTime: drawDate.clone().subtract(1, 'day').hour(21).minute(0).second(0),
            endTime: cutoffTime,
            description: '9:00 PM (previous day) to 1:55 PM'
          };
        } else if (isTomorrow) {
          // Tomorrow's 2PM draw: available from 9PM today
          const startTime = now.clone().hour(21).minute(0).second(0);
          isAvailable = now.isAfter(startTime) || now.hour() >= 21;
          bettingWindow = {
            startTime: startTime,
            endTime: cutoffTime,
            description: '9:00 PM (today) to 1:55 PM (tomorrow)'
          };
        }
      } else if (draw.drawTime === 'fivePM') {
        // 5PM draw is available from 9PM previous day until 4:55PM same day
        const startTime = drawDate.clone().subtract(1, 'day').hour(21).minute(0).second(0);
        const cutoffTime = drawDate.clone().hour(16).minute(55).second(0);
        
        if (isToday) {
          isAvailable = now.isAfter(startTime) && now.isBefore(cutoffTime);
          bettingWindow = {
            startTime: startTime,
            endTime: cutoffTime,
            description: '9:00 PM (previous day) to 4:55 PM'
          };
        }
      } else if (draw.drawTime === 'ninePM') {
        // 9PM draw is available from 9PM previous day until 8:55PM same day
        const startTime = drawDate.clone().subtract(1, 'day').hour(21).minute(0).second(0);
        const cutoffTime = drawDate.clone().hour(20).minute(55).second(0);
        
        if (isToday) {
          isAvailable = now.isAfter(startTime) && now.isBefore(cutoffTime);
          bettingWindow = {
            startTime: startTime,
            endTime: cutoffTime,
            description: '9:00 PM (previous day) to 8:55 PM'
          };
        }
      }

      // Always include the draw, but mark availability
      availableDraws.push({
        ...draw,
        isAvailable,
        bettingWindow,
        cutoffTime: bettingWindow ? bettingWindow.endTime.toDate() : null,
        drawDatetime: drawDate.clone().hour(
          draw.drawTime === 'twoPM' ? 14 : 
          draw.drawTime === 'fivePM' ? 17 : 21
        ).minute(0).second(0).toDate()
      });
    }

    res.json({
      success: true,
      data: availableDraws
    });

  } catch (error) {
    console.error('Get active draws error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/draws/:id/statistics
// @desc    Get draw statistics
// @access  Private
router.get('/:id/statistics', async (req, res) => {
  try {
    const drawId = parseInt(req.params.id);

    const draw = await prisma.draw.findUnique({
      where: { id: drawId }
    });

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    // Get ticket statistics
    const ticketStats = await prisma.ticket.groupBy({
      by: ['betType'],
      where: { drawId },
      _count: { id: true },
      _sum: { betAmount: true }
    });

    // Get winning statistics
    const winningStats = await prisma.winningTicket.groupBy({
      by: ['betType'],
      where: { drawId },
      _count: { id: true },
      _sum: { winningPrize: true }
    });

    // Get top numbers
    const topNumbers = await prisma.ticket.groupBy({
      by: ['betDigits'],
      where: { drawId },
      _count: { id: true },
      _sum: { betAmount: true },
      orderBy: { _sum: { betAmount: 'desc' } },
      take: 10
    });

    const totalTickets = await prisma.ticket.count({ where: { drawId } });
    const totalSales = await prisma.ticket.aggregate({
      where: { drawId },
      _sum: { betAmount: true }
    });

    const totalWinners = await prisma.winningTicket.count({ where: { drawId } });
    const totalPayout = await prisma.winningTicket.aggregate({
      where: { drawId },
      _sum: { winningPrize: true }
    });

    res.json({
      success: true,
      data: {
        draw,
        summary: {
          totalTickets,
          totalSales: totalSales._sum.betAmount || 0,
          totalWinners,
          totalPayout: totalPayout._sum.winningPrize || 0,
          netSales: (totalSales._sum.betAmount || 0) - (totalPayout._sum.winningPrize || 0)
        },
        byBetType: ticketStats,
        winningByBetType: winningStats,
        topNumbers
      }
    });

  } catch (error) {
    console.error('Get draw statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/draws/operator/dashboard
// @desc    Get operator dashboard data
// @access  Private (Operator)
router.get('/operator/dashboard', requireOperator, async (req, res) => {
  try {
    const today = moment().tz('Asia/Manila').format('YYYY-MM-DD');
    const now = moment().tz('Asia/Manila');

    // Get today's draws
    const todayDraws = await prisma.draw.findMany({
      where: {
        drawDate: new Date(today)
      },
      include: {
        _count: {
          select: {
            tickets: true,
            winningTickets: true
          }
        }
      },
      orderBy: { drawTime: 'asc' }
    });

    // Calculate live sales for each draw
    const liveSales = await Promise.all(todayDraws.map(async (draw) => {
      const sales = await prisma.ticket.aggregate({
        where: { drawId: draw.id },
        _sum: { betAmount: true }
      });

      const winners = await prisma.winningTicket.aggregate({
        where: { drawId: draw.id },
        _sum: { winningPrize: true }
      });

      return {
        ...draw,
        liveSales: sales._sum.betAmount || 0,
        livePayout: winners._sum.winningPrize || 0,
        netSales: (sales._sum.betAmount || 0) - (winners._sum.winningPrize || 0)
      };
    }));

    // Get overall statistics
    const totalTickets = await prisma.ticket.count({
      where: {
        draw: {
          drawDate: new Date(today)
        }
      }
    });

    const totalSales = await prisma.ticket.aggregate({
      where: {
        draw: {
          drawDate: new Date(today)
        }
      },
      _sum: { betAmount: true }
    });

    const totalWinners = await prisma.winningTicket.count({
      where: {
        draw: {
          drawDate: new Date(today)
        }
      }
    });

    const totalPayout = await prisma.winningTicket.aggregate({
      where: {
        draw: {
          drawDate: new Date(today)
        }
      },
      _sum: { winningPrize: true }
    });

    res.json({
      success: true,
      data: {
        date: today,
        draws: liveSales,
        summary: {
          totalTickets,
          totalSales: totalSales._sum.betAmount || 0,
          totalWinners,
          totalPayout: totalPayout._sum.winningPrize || 0,
          netSales: (totalSales._sum.betAmount || 0) - (totalPayout._sum.winningPrize || 0)
        }
      }
    });

  } catch (error) {
    console.error('Get operator dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/draws/create-monthly
// @desc    Create draws for entire month (Admin only)
// @access  Private (Admin)
router.post('/create-monthly', requireAdmin, [
  body('year').isInt({ min: 2024, max: 2030 }).withMessage('Valid year required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month (1-12) required')
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

    const { year, month } = req.body;
    
    const result = await drawScheduler.createDrawsForMonth(year, month);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: {
          created: result.created,
          skipped: result.skipped,
          totalDays: result.totalDays
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Create monthly draws error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/draws/create-current-and-next-month
// @desc    Create draws for current and next month (Admin only)
// @access  Private (Admin)
router.post('/create-current-and-next-month', requireAdmin, async (req, res) => {
  try {
    const result = await drawScheduler.createDrawsForCurrentAndNextMonth();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Successfully created draws for current and next month',
        data: {
          current: result.current,
          next: result.next
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message
      });
    }

  } catch (error) {
    console.error('Create current and next month draws error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/draws/monthly-status/:year/:month
// @desc    Check monthly draw creation status
// @access  Private (Admin)
router.get('/monthly-status/:year/:month', requireAdmin, async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year or month'
      });
    }

    // Get first and last day of the month
    const startDate = moment().year(year).month(month - 1).date(1).tz('Asia/Manila');
    const endDate = startDate.clone().endOf('month');
    const daysInMonth = endDate.date();
    
    // Count existing draws for the month
    const existingDraws = await prisma.draw.count({
      where: {
        drawDate: {
          gte: startDate.toDate(),
          lte: endDate.toDate()
        }
      }
    });
    
    const expectedDraws = daysInMonth * 3; // 3 draws per day
    const completionPercentage = Math.round((existingDraws / expectedDraws) * 100);
    
    res.json({
      success: true,
      data: {
        year,
        month,
        monthName: startDate.format('MMMM YYYY'),
        daysInMonth,
        existingDraws,
        expectedDraws,
        completionPercentage,
        isComplete: existingDraws === expectedDraws
      }
    });

  } catch (error) {
    console.error('Monthly status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;


