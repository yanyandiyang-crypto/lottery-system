const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET /api/v1/tickets/reprint/search/:ticketNumber
// @desc    Search for ticket to reprint
// @access  Private
router.get('/reprint/search/:ticketNumber', requireAuth, async (req, res) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            username: true
          }
        },
        draw: {
          select: {
            id: true,
            drawDate: true,
            drawTime: true,
            result: true,
            status: true
          }
        },
        bets: {
          select: {
            betCombination: true,
            betType: true,
            betAmount: true
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

    // Check if user has permission to view this ticket
    if (req.user.role === 'agent' && ticket.agentId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own tickets'
      });
    }

    res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Search ticket for reprint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/v1/tickets/:id/reprint
// @desc    Reprint a ticket
// @access  Private
router.post('/:id/reprint', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      include: {
        agent: true,
        draw: true
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Check permissions
    if (req.user.role === 'agent' && ticket.agentId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only reprint your own tickets'
      });
    }

    // Check reprint limit
    if (ticket.reprintCount >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Maximum reprint limit reached (2/2)'
      });
    }

    // Check if ticket can be reprinted (not settled/won)
    if (ticket.status === 'won' || ticket.status === 'settled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot reprint settled tickets'
      });
    }

    // Update reprint count
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        reprintCount: ticket.reprintCount + 1
      }
    });

    // Log the reprint
    await prisma.ticketReprint.create({
      data: {
        ticketId: ticket.id,
        reprintedById: req.user.id,
        reprintNumber: ticket.reprintCount + 1
      }
    });

    // Generate print data (this would typically be formatted for POS printer)
    const printData = generatePrintData(ticket);

    res.json({
      success: true,
      message: 'Ticket reprinted successfully',
      data: {
        ticket: updatedTicket,
        printData
      }
    });

  } catch (error) {
    console.error('Reprint ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/v1/tickets/reprint/history
// @desc    Get reprint history
// @access  Private
router.get('/reprint/history', requireAuth, async (req, res) => {
  try {
    const { limit = 10, agentId } = req.query;

    let whereClause = {};

    // Role-based filtering
    if (req.user.role === 'agent') {
      whereClause.ticket = {
        agentId: req.user.id
      };
    } else if (agentId) {
      whereClause.ticket = {
        agentId: parseInt(agentId)
      };
    }

    const reprints = await prisma.ticketReprint.findMany({
      where: whereClause,
      include: {
        ticket: {
          select: {
            ticketNumber: true,
            agent: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        },
        reprintedBy: {
          select: {
            id: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({
      success: true,
      data: reprints
    });

  } catch (error) {
    console.error('Get reprint history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to generate print data
function generatePrintData(ticket) {
  // This would typically generate formatted data for thermal printer
  return {
    ticketNumber: ticket.ticketNumber,
    agentName: ticket.agent.fullName,
    drawInfo: `${ticket.draw.drawTime} - ${ticket.draw.drawDate.toLocaleDateString()}`,
    betCombination: ticket.betCombination,
    betType: ticket.betType,
    betAmount: ticket.betAmount,
    totalAmount: ticket.totalAmount,
    reprintCount: ticket.reprintCount + 1,
    timestamp: new Date().toISOString()
  };
}

module.exports = router;
