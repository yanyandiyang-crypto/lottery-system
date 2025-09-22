const express = require('express');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment-timezone');
const { requireAuth } = require('../middleware/auth');
const { requireAgent, requireCoordinator } = require('../middleware/roleCheck');
const { validateBettingRules, checkBetLimits } = require('../utils/bettingValidator');
const TicketGenerator = require('../utils/ticketGenerator');

const router = express.Router();
const prisma = new PrismaClient();

// Local rate limiter for ticket creation to prevent spam
const createTicketLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false
});

// @route   POST /api/tickets
// @desc    Create new ticket with multiple bets (Agent only)
// @access  Private (Agent)
router.post('/', requireAgent, createTicketLimiter, async (req, res) => {
  try {
    // Block attempts to set server-managed timestamps
    const forbiddenTimeFields = ['betDate', 'createdAt', 'updatedAt'];
    for (const field of forbiddenTimeFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        return res.status(400).json({
          success: false,
          message: `Field \`${field}\` is not allowed`
        });
      }
    }
    
    // Support both single bet (legacy) and multiple bets (new)
    const { bets, drawId } = req.body;
    const drawIdNum = Number(drawId);
    
    if (!drawId || !Number.isInteger(drawIdNum)) {
      return res.status(400).json({
        success: false,
        message: 'Draw ID is required'
      });
    }
    
    // Handle legacy single bet format
    let betList = [];
    if (bets && Array.isArray(bets)) {
      betList = bets;
    } else {
      // Legacy format: single bet
      const { betType, betCombination, betAmount } = req.body;
      if (!betType || !betCombination || !betAmount) {
        return res.status(400).json({
          success: false,
          message: 'Either bets array or individual bet fields are required'
        });
      }
      betList = [{
        betType,
        betCombination,
        betAmount: Number(betAmount)
      }];
    }
    
    // Validate bets
    if (!betList || betList.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one bet is required'
      });
    }
    
    if (betList.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 bets per ticket allowed'
      });
    }
    
    // Validate each bet
    for (const bet of betList) {
      if (!bet.betType || !['standard', 'rambolito'].includes(bet.betType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid bet type'
        });
      }
      
      if (!bet.betCombination || !/^\d{3}$/.test(bet.betCombination)) {
        return res.status(400).json({
          success: false,
          message: 'Bet combination must be exactly 3 digits'
        });
      }
      
      const betAmountNum = Number(bet.betAmount);
      if (!TicketGenerator.validateMinimumBet(betAmountNum)) {
        return res.status(400).json({
          success: false,
          message: 'Bet amount must be at least 1 peso'
        });
      }
    }

    const { userId } = req.body;
    const agentId = userId || req.user.id;

    // Use default template (Design 1)
    const selectedTemplateId = 1;
    const selectedTemplateDesign = 1;

    // Check if draw exists and is open
    const draw = await prisma.draw.findUnique({
      where: { id: drawIdNum },
      select: { id: true, drawDate: true, drawTime: true, status: true }
    });

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    if (draw.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Draw is not open for betting'
      });
    }

    // Check if betting is still allowed (cutoff time)
    const now = moment().tz('Asia/Manila');
    // Compute cutoff using drawDate + drawTime in Manila
    const cutoffMap = { twoPM: { h: 13, m: 55 }, fivePM: { h: 16, m: 55 }, ninePM: { h: 20, m: 55 } };
    const cutoffConf = cutoffMap[draw.drawTime];
    const baseDate = moment(draw.drawDate).tz('Asia/Manila');
    const cutoffTime = cutoffConf
      ? baseDate.clone().hour(cutoffConf.h).minute(cutoffConf.m).second(0)
      : baseDate.clone();
    
    if (now.isAfter(cutoffTime)) {
      return res.status(400).json({
        success: false,
        message: 'Betting cutoff time has passed'
      });
    }

    // Audit log if within 2 minutes of cutoff
    const minutesToCutoff = cutoffTime.diff(now, 'minutes');
    if (minutesToCutoff <= 2 && minutesToCutoff >= 0) {
      console.log('[AUDIT] Near-cutoff bet attempt', {
        agentId,
        drawId,
        minutesToCutoff,
        nowManila: now.format('YYYY-MM-DD HH:mm:ss'),
        cutoffManila: cutoffTime.format('YYYY-MM-DD HH:mm:ss'),
        ip: req.ip
      });
    }

    // Validate betting rules for each bet using TicketGenerator
    for (const bet of betList) {
      const validationResult = TicketGenerator.validateBetCombination(bet.betCombination, bet.betType);
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: validationResult.message
        });
      }
    }

    // Check bet limits for each bet
    try {
      for (const bet of betList) {
        const limitCheck = await checkBetLimits(drawIdNum, bet.betType, bet.betCombination, Number(bet.betAmount));
        if (!limitCheck.allowed) {
          return res.status(400).json({
            success: false,
            message: limitCheck.message
          });
        }
      }
    } catch (error) {
      console.error('Bet limits check failed:', error);
      // Continue without bet limits check for now
    }

    // Calculate total bet amount
    const totalBetAmount = betList.reduce((sum, bet) => sum + Number(bet.betAmount), 0);

    // Check agent balance
    const agentBalance = await prisma.userBalance.findUnique({
      where: { userId: agentId }
    });

    if (!agentBalance || agentBalance.currentBalance < totalBetAmount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    // Use TicketGenerator utility for consistent data generation
    const ticketNumber = TicketGenerator.generateTicketNumber();
    
    // Get user data for ticket generation
    const user = await prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, fullName: true, agentId: true }
    });

    // Generate QR code using TicketGenerator (use first bet for QR data)
    const ticketData = {
      ticketNumber,
      betCombination: betList[0].betCombination,
      betAmount: betList[0].betAmount,
      drawId: drawIdNum,
      createdAt: new Date()
    };
    const qrCodeResult = await TicketGenerator.generateQRCode(ticketData);

    // Generate sequence number (for multiple bets, use index 0 for single bet)
    const sequenceNumber = TicketGenerator.generateSequenceNumber(0);

    // Create ticket and deduct balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create ticket
      const ticket = await tx.ticket.create({
        data: {
          ticketNumber,
          userId: agentId,
          drawId: drawIdNum,
          totalAmount: totalBetAmount,
          sequenceNumber,
          agentId: agentId,
          betDate: new Date(),
          qrCode: qrCodeResult.qrCodeData,
          status: 'pending'
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          },
          draw: {
            select: {
              id: true,
              drawDate: true,
              drawTime: true,
              status: true
            }
          }
        }
      });

      // Create individual bets
      for (const bet of betList) {
        await tx.bet.create({
          data: {
            ticketId: ticket.id,
            betType: bet.betType,
            betCombination: bet.betCombination,
            betAmount: Number(bet.betAmount)
          }
        });
      }

      // Deduct balance from agent
      await tx.userBalance.update({
        where: { userId: agentId },
        data: {
          currentBalance: {
            decrement: totalBetAmount
          }
        }
      });

      // Create balance transaction record
      await tx.balanceTransaction.create({
        data: {
          userId: agentId,
          transactionType: 'bet',
          amount: -totalBetAmount, // Negative amount for deduction
          description: `Bet placed for ticket ${ticketNumber} (${betList.length} bets)`,
          referenceId: ticket.id.toString()
        }
      });

      return ticket;
    });

    const ticket = result;

    // Update bet totals for each bet
    for (const bet of betList) {
      await updateBetTotals(drawIdNum, bet.betType, bet.betCombination, Number(bet.betAmount));
    }

    // Create or update sales record for each bet type
    const salesByType = {};
    for (const bet of betList) {
      if (!salesByType[bet.betType]) {
        salesByType[bet.betType] = 0;
      }
      salesByType[bet.betType] += Number(bet.betAmount);
    }

    for (const [betType, totalAmount] of Object.entries(salesByType)) {
      await prisma.sale.upsert({
        where: {
          userId_drawId_betType: {
            userId: agentId,
            drawId: drawIdNum,
            betType: betType
          }
        },
        update: {
          totalAmount: {
            increment: totalAmount
          },
          ticketCount: {
            increment: 1
          }
        },
        create: {
          userId: agentId,
          drawId: drawIdNum,
          betType: betType,
          totalAmount: totalAmount,
          ticketCount: 1
        }
      });
    }

    // Emit real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to('role-coordinator').to('role-admin').to('role-superadmin').emit('new-ticket', {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        agentName: ticket.user.fullName,
        betCount: betList.length,
        totalAmount: totalBetAmount,
        drawTime: ticket.draw.drawTime,
        bets: betList.map(bet => ({
          betType: bet.betType,
          betCombination: bet.betCombination,
          betAmount: bet.betAmount
        }))
      });
    }

    // Fetch the ticket with bets for response
    const ticketWithBets = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: {
        bets: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        },
        draw: {
          select: {
            id: true,
            drawDate: true,
            drawTime: true,
            status: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Ticket created successfully',
      data: ticketWithBets
    });

  } catch (error) {
    console.error('Create ticket error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      requestBody: req.body,
      prisma: error.code || undefined,
      meta: error.meta || undefined
    });
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      code: error.code || undefined,
      meta: error.meta || undefined
    });
  }
});

// @route   GET /api/tickets
// @desc    Get tickets based on user role
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      agentId, 
      startDate, 
      endDate 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};
    
    if (status && status !== 'all') {
      if (status === 'won') {
        // For won status, we need to check if there are winning tickets
        where.winningTickets = {
          some: {}
        };
      } else if (status === 'lost') {
        // For lost status, we need to check if draw has result but no winning tickets
        where.draw = {
          ...where.draw,
          winningNumber: { not: null }
        };
        where.winningTickets = {
          none: {}
        };
      } else {
        // For other statuses (pending, validated, etc.), use the status field directly
        where.status = status;
      }
    }
    
    if (agentId) {
      where.agentId = parseInt(agentId);
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    // Role-based filtering
    switch (req.user.role) {
      case 'superadmin':
      case 'admin':
        // Can see all tickets - no additional filtering
        break;
      case 'area_coordinator':
        // Get agents in the same region as the Area Coordinator
        const areaAgents = await prisma.user.findMany({
          where: { regionId: req.user.regionId, role: 'agent', status: 'active' },
          select: { id: true }
        });
        where.agentId = {
          in: areaAgents.map(agent => agent.id)
        };
        break;
      case 'coordinator':
        // Get agents under this coordinator
        const coordAgents = await prisma.user.findMany({
          where: { coordinatorId: req.user.id, role: 'agent', status: 'active' },
          select: { id: true }
        });
        where.agentId = {
          in: coordAgents.map(agent => agent.id)
        };
        break;
      case 'agent':
        // Can only see their own tickets
        where.userId = req.user.id;
        break;
    }

    // Get tickets with pagination
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          },
          draw: {
            select: {
              id: true,
              drawTime: true,
              drawDate: true,
              status: true,
              winningNumber: true
            }
          },
          bets: {
            select: {
              id: true,
              betType: true,
              betCombination: true,
              betAmount: true
            }
          },
          winningTickets: {
            select: { prizeAmount: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.ticket.count({ where })
    ]);

    // Transform tickets to include amount field, numbers, and winning calculations for frontend compatibility
    const transformedTickets = tickets.map(ticket => {
      // Extract numbers from bets
      const numbers = ticket.bets.map(bet => bet.betCombination).filter(Boolean);
      
      // Calculate derived status and winning amounts (same logic as agent endpoint)
      const hasResult = Boolean(ticket.draw?.winningNumber);
      const hasWin = (ticket.winningTickets?.length || 0) > 0;
      let derivedStatus = 'pending';
      if (hasResult) {
        derivedStatus = hasWin ? 'won' : 'lost';
      }
      
      // Mark individual bets as winners and calculate total win amount
      let totalWinAmount = 0;
      const betsWithWinnerStatus = ticket.bets.map(bet => {
        let isWinner = false;
        let winAmount = 0;
        
        if (hasResult && ticket.draw.winningNumber) {
          const { isWinningTicket, calculateWinningPrizeDefault } = require('../utils/bettingValidator');
          isWinner = isWinningTicket(bet.betType, bet.betCombination, ticket.draw.winningNumber);
          if (isWinner) {
            winAmount = calculateWinningPrizeDefault(bet.betType, bet.betCombination, bet.betAmount);
            totalWinAmount += winAmount;
          }
        }
        
        return {
          ...bet,
          isWinner,
          winAmount
        };
      });
      
      // Use calculated total or fallback to WinningTicket record
      const winAmount = totalWinAmount > 0 ? totalWinAmount : (hasWin ? (ticket.winningTickets[0].prizeAmount || 0) : 0);
      
      return {
        ...ticket,
        amount: ticket.totalAmount,
        numbers: numbers,
        derivedStatus,
        winAmount,
        bets: betsWithWinnerStatus
      };
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: {
        tickets: transformedTickets,
        pagination: {
          currentPage: pageNum,
          totalPages: totalPages,
          totalCount: total,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// @route   GET /api/tickets/:id
// @desc    Get ticket by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        bets: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            coordinator: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        },
        draw: {
          select: {
            id: true,
            drawDate: true,
            drawTime: true,
            winningNumber: true,
            status: true
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

    // Check permissions
    if (req.user.role === 'agent' && ticket.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to view this ticket'
      });
    }

    res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/tickets/:id/validate
// @desc    Validate ticket (check if winning)
// @access  Private
router.post('/:id/validate', async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        draw: true,
        agent: true
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.draw.status !== 'settled') {
      return res.status(400).json({
        success: false,
        message: 'Draw not yet settled'
      });
    }

    if (!ticket.draw.winningNumber) {
      return res.status(400).json({
        success: false,
        message: 'Winning number not available'
      });
    }

    // Check if ticket is winning
    const isWinner = checkWinningTicket(ticket.betType, ticket.betCombination, ticket.draw.winningNumber);
    const winningPrize = isWinner ? await calculateWinningPrize(ticket.betType, ticket.betCombination, ticket.betAmount) : 0;

    // Update ticket
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        isWinner,
        winningPrize,
        status: 'validated',
        validatedAt: require('../utils/philippineTime').now()
      }
    });

    // If winning, create winning ticket record
    if (isWinner) {
      await prisma.winningTicket.create({
        data: {
          ticketId: ticket.id,
          drawId: ticket.drawId,
          agentId: ticket.userId,
          coordinatorId: ticket.user.coordinatorId,
          betType: ticket.betType,
          betCombination: ticket.betCombination,
          winningPrize
        }
      });

      // Send notification
      const io = req.app.get('io');
      if (io) {
        io.to(`user-${ticket.userId}`).emit('you-won', {
          ticketNumber: ticket.ticketNumber,
          betCombination: ticket.betCombination,
          winningPrize,
          drawTime: ticket.draw.drawTime
        });

        if (ticket.user.coordinatorId) {
          io.to(`user-${ticket.user.coordinatorId}`).emit('agent-won', {
            agentName: ticket.user.fullName,
            ticketNumber: ticket.ticketNumber,
            betCombination: ticket.betCombination,
            winningPrize,
            drawTime: ticket.draw.drawTime
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Ticket validated successfully',
      data: {
        isWinner,
        winningPrize,
        status: updatedTicket.status
      }
    });

  } catch (error) {
    console.error('Validate ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/tickets/agent/:agentId
// @desc    Get tickets by agent with filters
// @access  Private
router.get('/agent/:agentId', async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    const { 
      startDate, 
      endDate, 
      status = 'all', 
      drawTime = 'all', 
      search = '',
      page = 1, 
      limit = 20 
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    let whereClause = {
      userId: agentId
    };

    // Date filter
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    // Status filter
    if (status !== 'all') {
      if (status === 'won') {
        // For won status, we need to check if there are winning tickets
        whereClause.winningTickets = {
          some: {}
        };
      } else if (status === 'lost') {
        // For lost status, we need to check if draw has result but no winning tickets
        whereClause.draw = {
          ...whereClause.draw,
          winningNumber: { not: null }
        };
        whereClause.winningTickets = {
          none: {}
        };
      } else {
        // For other statuses (pending, validated, etc.), use the status field directly
        whereClause.status = status;
      }
    }

    // Draw time filter
    if (drawTime !== 'all') {
      whereClause.draw = {
        ...whereClause.draw,
        drawTime: drawTime
      };
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { bets: { some: { betCombination: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    const [ticketsRaw, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where: whereClause,
        include: {
          draw: true,
          bets: true,
          user: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          },
          winningTickets: {
            select: { prizeAmount: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limitNum
      }),
      prisma.ticket.count({
        where: whereClause
      })
    ]);

    // Compute derived fields for frontend compatibility
    const tickets = ticketsRaw.map(t => {
      const hasResult = Boolean(t.draw?.winningNumber);
      const hasWin = (t.winningTickets?.length || 0) > 0;
      let derivedStatus = 'pending';
      if (hasResult) {
        derivedStatus = hasWin ? 'won' : 'lost';
      }
      // Mark individual bets as winners and calculate total win amount
      let totalWinAmount = 0;
      const betsWithWinnerStatus = t.bets.map(bet => {
        let isWinner = false;
        let winAmount = 0;
        
        if (hasResult && t.draw.winningNumber) {
          const { isWinningTicket, calculateWinningPrizeDefault } = require('../utils/bettingValidator');
          isWinner = isWinningTicket(bet.betType, bet.betCombination, t.draw.winningNumber);
          if (isWinner) {
            winAmount = calculateWinningPrizeDefault(bet.betType, bet.betCombination, bet.betAmount);
            totalWinAmount += winAmount;
          }
        }
        
        return {
          ...bet,
          isWinner,
          winAmount
        };
      });
      
      // Use calculated total or fallback to WinningTicket record
      const winAmount = totalWinAmount > 0 ? totalWinAmount : (hasWin ? (t.winningTickets[0].prizeAmount || 0) : 0);
      
      return {
        ...t,
        derivedStatus,
        winAmount,
        bets: betsWithWinnerStatus
      };
    });

    res.json({
      success: true,
      data: {
        tickets,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          totalCount,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Error fetching agent tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets'
    });
  }
});

// @route   GET /api/tickets/recent/:agentId
// @desc    Get recent tickets for agent (for reprinting)
// @access  Private
router.get('/recent/:agentId', requireCoordinator, async (req, res) => {
  try {
    const agentId = parseInt(req.params.agentId);
    const { limit = 20 } = req.query;

    // Verify agent is under this coordinator
    const agent = await prisma.user.findUnique({
      where: { 
        id: agentId,
        coordinatorId: req.user.id 
      }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found or not under your management'
      });
    }

    const tickets = await prisma.ticket.findMany({
      where: { userId: agentId },
      include: {
        bets: true,
        draw: {
          select: {
            drawDate: true,
            drawTime: true,
            drawDatetime: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: tickets
    });

  } catch (error) {
    console.error('Get recent tickets error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper functions
function generateTicketNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return (timestamp + random).slice(-17);
}

function generateSequenceNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SEQ${timestamp.slice(-8)}${random}`;
}

async function updateBetTotals(drawId, betType, betCombination, betAmount) {
  const existing = await prisma.currentBetTotal.findFirst({
    where: {
      drawId,
      betType,
      betCombination
    }
  });

  if (existing) {
    await prisma.currentBetTotal.update({
      where: { id: existing.id },
      data: {
        totalAmount: existing.totalAmount + betAmount,
        ticketCount: existing.ticketCount + 1
      }
    });
  } else {
    await prisma.currentBetTotal.create({
      data: {
        drawId,
        betType,
        betCombination,
        totalAmount: betAmount,
        ticketCount: 1
      }
    });
  }
}

async function getBetLimit(betType) {
  const limit = await prisma.betLimit.findFirst({
    where: { betType, isActive: true }
  });
  return limit ? limit.limitAmount : 1000;
}

function checkWinningTicket(betType, betCombination, winningNumber) {
  if (betType === 'standard') {
    return betCombination === winningNumber;
  }

  if (betType === 'rambolito') {
    // Use TicketGenerator's permutation logic
    const winningPossibilities = TicketGenerator.calculateWinningPossibilities(betCombination, betType);
    return winningPossibilities.includes(winningNumber);
  }

  return false;
}

function getPermutations(arr) {
  if (arr.length <= 1) return [arr.join('')];
  
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const perms = getPermutations(rest);
    for (const perm of perms) {
      result.push(arr[i] + perm);
    }
  }
  return [...new Set(result)];
}

function calculateWinningPrize(betType, betCombination) {
  return TicketGenerator.getWinningPrize(betType, betCombination);
}

// @route   GET /api/tickets/number/:ticketNumber
// @desc    Get ticket by ticket number (for sharing)
// @access  Public (for ticket sharing)
router.get('/number/:ticketNumber', async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            username: true,
            agentId: true
          }
        },
        draw: {
          select: {
            id: true,
            drawDate: true,
            drawTime: true,
            winningNumber: true,
            status: true
          }
        },
        bets: {
          select: {
            id: true,
            betType: true,
            betCombination: true,
            betAmount: true,
            sequenceLetter: true
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

    res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Get ticket by number error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;


