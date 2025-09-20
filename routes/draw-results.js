const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin, requireAreaCoordinator } = require('../middleware/roleCheck');
const { body, validationResult } = require('express-validator');
const TicketGenerator = require('../utils/ticketGenerator');

const router = express.Router();
const prisma = new PrismaClient();

// @route   POST /api/v1/draw-results/input
// @desc    Input official PCSO result (Admin/SuperAdmin only)
// @access  Admin/SuperAdmin only
router.post('/input', requireAuth, requireAreaCoordinator, [
  body('drawId').isInt().withMessage('Draw ID is required'),
  body('result').matches(/^\d{3}$/).withMessage('Result must be 3 digits')
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

    const { drawId, result: winningNumber } = req.body;

    // Check if draw exists and is not already settled
    const draw = await prisma.draw.findUnique({
      where: { id: drawId }
    });

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    if (draw.status === 'settled') {
      return res.status(400).json({
        success: false,
        message: 'Draw already settled'
      });
    }

    // Start transaction to update draw and process winners
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Update draw with winning number and status
      const updatedDraw = await tx.draw.update({
        where: { id: drawId },
        data: {
          winningNumber: winningNumber,
          status: 'settled',
          updatedAt: new Date()
        }
      });

      // Create draw result record
      await tx.drawResult.create({
        data: {
          drawId: drawId,
          winningNumber: winningNumber,
          inputById: req.user.id,
          isOfficial: true
        }
      });

      // Find all tickets for this draw with their bets
      const allTickets = await tx.ticket.findMany({
        where: {
          drawId: drawId,
          status: 'pending'
        },
        include: {
          user: true,
          bets: true
        }
      });

      const winners = [];
      
      // Process all tickets - check each bet for winners
      for (const ticket of allTickets) {
        let ticketHasWinner = false;
        let totalWinningPrize = 0;
        const winningBets = [];

        // Check each bet on this ticket
        for (const bet of ticket.bets) {
          const isWinner = checkIfWinner(bet.betCombination, bet.betType, winningNumber);
          
          if (isWinner) {
            ticketHasWinner = true;
            const prizeAmount = TicketGenerator.getWinningPrize(bet.betType, bet.betCombination);
            totalWinningPrize += prizeAmount;
            
            winningBets.push({
              betId: bet.id,
              betCombination: bet.betCombination,
              betType: bet.betType,
              betAmount: bet.betAmount,
              winningPrize: prizeAmount
            });
          }
        }

        // If ticket has any winning bets, process it
        if (ticketHasWinner) {
          // Create winning ticket record
          await tx.winningTicket.create({
            data: {
              ticketId: ticket.id,
              drawId: drawId,
              prizeAmount: totalWinningPrize
            }
          });

          winners.push({
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            userId: ticket.userId,
            agentName: ticket.user.fullName,
            winningBets: winningBets,
            totalWinningPrize: totalWinningPrize
          });

          // Create notification for agent
          await tx.notification.create({
            data: {
              userId: ticket.userId,
              title: 'Winning Ticket!',
              message: `Congratulations! Ticket ${ticket.ticketNumber} won ₱${totalWinningPrize.toFixed(2)}`,
              type: 'win',
              relatedTicketId: ticket.id,
              relatedDrawId: drawId
            }
          });

          // Create notification for coordinator if exists
          if (ticket.user.coordinatorId) {
            await tx.notification.create({
              data: {
                userId: ticket.user.coordinatorId,
                title: 'Agent Win Notification',
                message: `Agent ${ticket.user.fullName} has a winning ticket: ${ticket.ticketNumber} - ₱${totalWinningPrize.toFixed(2)}`,
                type: 'agent_win',
                relatedTicketId: ticket.id,
                relatedDrawId: drawId
              }
            });
          }
        }
      }

      // Mark ALL tickets for this draw as complete (regardless of win/lose)
      await tx.ticket.updateMany({
        where: {
          drawId: drawId,
          status: 'pending'
        },
        data: {
          status: 'validated' // Keep using 'validated' for now to avoid breaking existing logic
        }
      });

      return { updatedDraw, winners };
    });

    res.json({
      success: true,
      message: 'Draw result processed successfully',
      data: {
        drawId: drawId,
        winningNumber: winningNumber,
        winnersCount: transactionResult.winners.length,
        totalPrizeAmount: transactionResult.winners.reduce((sum, w) => sum + w.prizeAmount, 0),
        winners: transactionResult.winners
      }
    });

  } catch (error) {
    console.error('Draw result input error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing draw result'
    });
  }
});

// @route   GET /api/v1/draw-results/:drawId
// @desc    Get draw result and winners
// @access  Private
router.get('/:drawId', requireAuth, async (req, res) => {
  try {
    const { drawId } = req.params;

    const draw = await prisma.draw.findUnique({
      where: { id: parseInt(drawId) },
      include: {
        drawResult: {
          include: {
            inputBy: {
              select: { id: true, fullName: true }
            }
          }
        },
        winningTickets: {
          include: {
            ticket: {
              include: {
                user: {
                  select: { id: true, fullName: true, coordinatorId: true },
                  include: {
                    coordinator: {
                      select: { id: true, fullName: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!draw) {
      return res.status(404).json({
        success: false,
        message: 'Draw not found'
      });
    }

    // Format winners data
    const winners = draw.winningTickets.map(wt => ({
      agentName: wt.ticket.user.fullName,
      betType: wt.ticket.betType,
      ticketNumber: wt.ticket.ticketNumber,
      betCombination: wt.ticket.betCombination,
      drawTime: draw.drawTime,
      betDate: wt.ticket.createdAt,
      coordinatorName: wt.ticket.user.coordinator?.fullName || 'N/A',
      prizeAmount: wt.prizeAmount,
      isClaimed: wt.isClaimed
    }));

    res.json({
      success: true,
      data: {
        draw: {
          id: draw.id,
          drawDate: draw.drawDate,
          drawTime: draw.drawTime,
          winningNumber: draw.winningNumber,
          status: draw.status
        },
        result: draw.drawResult,
        winners: winners,
        summary: {
          totalWinners: winners.length,
          totalPrizeAmount: winners.reduce((sum, w) => sum + w.prizeAmount, 0),
          claimedCount: winners.filter(w => w.isClaimed).length,
          unclaimedCount: winners.filter(w => !w.isClaimed).length
        }
      }
    });

  } catch (error) {
    console.error('Get draw result error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching draw result'
    });
  }
});

// @route   GET /api/v1/draw-results/winners/:drawId
// @desc    Get winner notifications for a specific draw
// @access  Admin/SuperAdmin only
router.get('/winners/:drawId', requireAuth, requireAreaCoordinator, async (req, res) => {
  try {
    const { drawId } = req.params;

    const winnerNotifications = await prisma.winningTicket.findMany({
      where: { drawId: parseInt(drawId) },
      include: {
        ticket: {
          include: {
            user: {
              select: { 
                id: true, 
                fullName: true, 
                coordinatorId: true 
              }
            },
            bets: true
          }
        },
        draw: {
          select: { 
            drawTime: true, 
            drawDate: true, 
            winningNumber: true 
          }
        }
      }
    });

    const formattedNotifications = winnerNotifications.map(wt => {
      // Find the winning bet(s) from the ticket
      const winningBets = wt.ticket.bets.filter(bet => {
        const { isWinningTicket } = require('../utils/bettingValidator');
        return isWinningTicket(bet.betType, bet.betCombination, wt.draw.winningNumber);
      });
      
      // For display purposes, show the first winning bet or all winning bets
      const displayBet = winningBets.length > 0 ? winningBets[0] : wt.ticket.bets[0];
      
      return {
        agentName: wt.ticket.user.fullName,
        ticketNumber: wt.ticket.ticketNumber,
        betCombination: displayBet?.betCombination || 'N/A',
        betType: displayBet?.betType || 'N/A',
        drawTime: wt.draw.drawTime,
        winningPrize: wt.prizeAmount,
        coordinatorId: wt.ticket.user.coordinatorId,
        winningBetsCount: winningBets.length,
        totalBetsCount: wt.ticket.bets.length
      };
    });

    res.json({
      success: true,
      data: formattedNotifications
    });

  } catch (error) {
    console.error('Get winner notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching winner notifications'
    });
  }
});

// @route   GET /api/v1/draw-results/dashboard/admin
// @desc    Get results dashboard for admin/superadmin
// @access  Admin/SuperAdmin only
router.get('/dashboard/admin', requireAuth, requireAreaCoordinator, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get dashboard statistics
    const [totalWinners, pendingResults, processedToday, totalPayouts] = await Promise.all([
      // Total winners in the specified period
      prisma.winningTicket.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      }),
      
      // Pending results (closed draws without results)
      prisma.draw.count({
        where: {
          status: 'closed',
          winningNumber: null
        }
      }),
      
      // Processed today
      prisma.drawResult.count({
        where: {
          inputAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      
      // Total payouts in the period
      prisma.winningTicket.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          prizeAmount: true
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalWinners,
        pendingResults,
        processedToday,
        totalPayouts: totalPayouts._sum.prizeAmount || 0
      }
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard'
    });
  }
});

// @route   GET /api/v1/draw-results/history
// @desc    Get draw results history with pagination
// @access  Admin/SuperAdmin only  
router.get('/history', requireAuth, requireAreaCoordinator, async (req, res) => {
  try {
    const { date, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let whereClause = {
      status: 'settled'
    };

    if (date) {
      const targetDate = new Date(date);
      const nextDate = new Date(targetDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      whereClause.drawDate = {
        gte: targetDate,
        lt: nextDate
      };
    }

    const [draws, total] = await Promise.all([
      prisma.draw.findMany({
        where: whereClause,
        include: {
          drawResult: {
            include: {
              inputBy: {
                select: { id: true, fullName: true }
              }
            }
          },
          winningTickets: {
            include: {
              ticket: {
                include: {
                  user: {
                    select: { 
                      id: true, 
                      fullName: true,
                      coordinator: {
                        select: { id: true, fullName: true }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: [
          { drawDate: 'desc' },
          { drawTime: 'desc' }
        ],
        skip: skip,
        take: parseInt(limit)
      }),
      prisma.draw.count({ where: whereClause })
    ]);

    const formattedDraws = draws.map(draw => ({
      id: draw.id,
      drawDate: draw.drawDate,
      drawTime: draw.drawTime,
      result: draw.winningNumber,
      status: draw.status,
      winnersCount: draw.winningTickets.length,
      totalPayout: draw.winningTickets.reduce((sum, wt) => sum + wt.prizeAmount, 0),
      inputBy: draw.drawResult?.inputBy?.fullName || 'N/A',
      inputAt: draw.drawResult?.inputAt
    }));

    res.json({
      success: true,
      data: {
        draws: formattedDraws,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get draw results history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching draw results history'
    });
  }
});

// Helper function to check if ticket is winner
function checkIfWinner(betCombination, betType, winningNumber) {
  if (betType === 'standard') {
    return betCombination === winningNumber;
  }

  if (betType === 'rambolito') {
    const possibilities = TicketGenerator.calculateWinningPossibilities(betCombination, betType);
    return possibilities.includes(winningNumber);
  }

  return false;
}

// @route   GET /api/v1/draw-results/agent/dashboard
// @desc    Get draw results dashboard for agents (read-only)
// @access  Agent only
router.get('/agent/dashboard', requireAuth, async (req, res) => {
  try {
    // Get recent draws with results (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentDraws = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: thirtyDaysAgo
        },
        status: 'settled',
        winningNumber: {
          not: null
        }
      },
      orderBy: [
        { drawDate: 'desc' },
        { drawTime: 'desc' }
      ],
      take: 50
    });

    // Get today's draws
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayDraws = await prisma.draw.findMany({
      where: {
        drawDate: {
          gte: today,
          lt: tomorrow
        }
      },
      orderBy: { drawTime: 'asc' }
    });

    // Get statistics
    const totalSettledDraws = await prisma.draw.count({
      where: {
        status: 'settled',
        drawDate: {
          gte: thirtyDaysAgo
        }
      }
    });

    const pendingDraws = await prisma.draw.count({
      where: {
        status: 'closed',
        winningNumber: null,
        drawDate: {
          gte: thirtyDaysAgo
        }
      }
    });

    res.json({
      success: true,
      data: {
        recentDraws,
        todayDraws,
        statistics: {
          totalSettledDraws,
          pendingDraws,
          totalRecentDraws: recentDraws.length
        }
      }
    });

  } catch (error) {
    console.error('Agent dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/v1/draw-results/agent/history
// @desc    Get draw results history for agents (read-only)
// @access  Agent only
router.get('/agent/history', requireAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      startDate, 
      endDate,
      drawTime 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereClause = {
      status: 'settled',
      winningNumber: {
        not: null
      }
    };

    // Date filtering
    if (startDate || endDate) {
      whereClause.drawDate = {};
      if (startDate) whereClause.drawDate.gte = new Date(startDate);
      if (endDate) whereClause.drawDate.lte = new Date(endDate);
    }

    // Draw time filtering
    if (drawTime && drawTime !== 'all') {
      whereClause.drawTime = drawTime;
    }

    const [draws, total] = await Promise.all([
      prisma.draw.findMany({
        where: whereClause,
        orderBy: [
          { drawDate: 'desc' },
          { drawTime: 'desc' }
        ],
        skip: offset,
        take: parseInt(limit),
        include: {
          _count: {
            select: {
              tickets: true,
              winningTickets: true
            }
          }
        }
      }),
      prisma.draw.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        draws,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Agent history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
