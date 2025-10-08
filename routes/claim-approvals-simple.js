const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test endpoint to verify authentication
router.get('/test-auth', (req, res) => {
  console.log('🔍 Test auth endpoint hit');
  console.log('🔍 req.user:', req.user);
  res.json({
    success: true,
    user: req.user,
    message: 'Authentication test successful'
  });
});

// Helper function to check if a bet is winning
const checkIfBetIsWinning = (betCombination, betType, winningNumber) => {
  if (!betCombination || !winningNumber) return false;
  
  const cleanBet = betCombination.toString().replace(/\s+/g, '');
  const cleanWinning = winningNumber.toString().replace(/\s+/g, '');
  
  if (betType === 'rambolito' || betType === 'rambol') {
    // Rambolito: match in any order
    const sortedBet = cleanBet.split('').sort().join('');
    const sortedWinning = cleanWinning.split('').sort().join('');
    return sortedBet === sortedWinning;
  } else {
    // Standard/Straight: exact match
    return cleanBet === cleanWinning;
  }
};

// @route   GET /api/v1/claim-approvals/pending
// @desc    Get pending claim approvals (simplified version)
// @access  Protected (SuperAdmin, Admin)
router.get('/pending', async (req, res) => {
  try {
    console.log('🔍 Fetching pending claims (winning tickets claimed by agents)...');
    
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    
    // Build where clause
    const whereClause = { 
      status: 'validated',
      draw: {
        winningNumber: {
          not: null
        }
      }
    };
    
    // Add date filter if provided
    if (Object.keys(dateFilter).length > 0) {
      whereClause.createdAt = dateFilter;
    }
    
    console.log('📅 Date filters:', { startDate, endDate, dateFilter });
    
    // Get all validated tickets with draw results
    const validatedTickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            role: true
          }
        },
        bets: true,
        draw: {
          include: {
            drawResult: {
              select: {
                winningNumber: true,
                isOfficial: true
              }
            }
          }
        },
        winningTickets: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Found ${validatedTickets.length} validated tickets with draw results`);
    
    // Filter to only include actual winning tickets
    const pendingClaims = validatedTickets.filter(ticket => {
      const winningNumber = ticket.draw?.winningNumber || ticket.draw?.drawResult?.winningNumber;
      
      if (!winningNumber || !ticket.bets || ticket.bets.length === 0) {
        return false;
      }
      
      // Check if any bet is a winner
      const hasWinningBet = ticket.bets.some(bet => 
        checkIfBetIsWinning(bet.betCombination, bet.betType, winningNumber)
      );
      
      // Also check if there's a WinningTicket record
      const hasWinningTicketRecord = ticket.winningTickets && ticket.winningTickets.length > 0;
      
      return hasWinningBet || hasWinningTicketRecord;
    });
    
    console.log(`🏆 Found ${pendingClaims.length} winning tickets pending claim approval`);
    if (pendingClaims.length > 0) {
      console.log('🔍 Sample winning claim:', {
        ticketNumber: pendingClaims[0].ticketNumber,
        winningNumber: pendingClaims[0].draw?.winningNumber,
        betsCount: pendingClaims[0].bets?.length
      });
    }
    
    res.json({
      success: true,
      claims: pendingClaims,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: pendingClaims.length,
        itemsPerPage: pendingClaims.length
      }
    });
  } catch (error) {
    console.error('❌ Error fetching pending claims:', error);
    console.error('❌ Full error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching pending claims',
      error: error.message
    });
  }
});

// @route   POST /api/v1/claim-approvals/:ticketId/approve
// @desc    Approve a claim (simplified version)
// @access  Protected (SuperAdmin, Admin)
router.post('/:ticketId/approve', async (req, res) => {
  console.log('🚨🚨🚨 APPROVAL ENDPOINT HIT! 🚨🚨🚨');
  try {
    const { ticketId } = req.params;
    const { notes, prizeAmount } = req.body;

    console.log('🚀 Approving claim for ticket:', ticketId);
    console.log('🔍 Request user object:', req.user);
    console.log('🔍 Prize amount:', prizeAmount);
    console.log('🔍 Notes:', notes);

    // Check if user object exists
    if (!req.user) {
      console.error('❌ No user object in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user ID (auth middleware sets req.user to the full user object)
    const approverId = req.user.id;
    const userRole = req.user.role;

    console.log('🔍 Approver ID:', approverId);
    console.log('🔍 User role:', userRole);

    // Verify user has approval permissions
    if (!['superadmin', 'admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to approve claims'
      });
    }

    // Validate ticket ID
    const ticketIdInt = parseInt(ticketId);
    if (isNaN(ticketIdInt)) {
      console.error('❌ Invalid ticket ID:', ticketId);
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket ID'
      });
    }

    console.log('🔍 Looking for ticket with ID:', ticketIdInt);

    // Find and verify the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketIdInt },
      include: {
        user: {
          select: {
            username: true,
            fullName: true
          }
        },
        bets: true,
        draw: {
          include: {
            drawResult: {
              select: {
                winningNumber: true,
                isOfficial: true
              }
            }
          }
        }
      }
    });
    
    console.log('🔍 Found ticket:', ticket ? `${ticket.ticketNumber} (${ticket.status})` : 'null');
    
    if (!ticket) {
      console.error('❌ Ticket not found with ID:', ticketIdInt);
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }
    
    if (ticket.status !== 'validated') {
      console.error('❌ Ticket status is not validated:', ticket.status);
      return res.status(400).json({
        success: false,
        message: `Ticket status is ${ticket.status}, not validated (awaiting approval)`
      });
    }

    console.log('✅ Ticket validation passed, updating status to paid...');

    // Update ticket status to paid (claim approved and processed)
    // Note: Schema doesn't have approvedAt, approvedBy, approvalNotes, prizeAmount fields yet
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketIdInt },
      data: {
        status: 'paid'
      },
      include: {
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      }
    });
    
    console.log(`✅ Ticket ${ticketId} approved and marked as claimed`);
    
    res.json({
      success: true,
      message: 'Claim approved successfully',
      ticket: updatedTicket
    });

  } catch (error) {
    console.error('❌ Approve claim error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Error approving claim',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   POST /api/v1/claim-approvals/:ticketId/reject
// @desc    Reject a claim (simplified version)
// @access  Protected (SuperAdmin, Admin)
router.post('/:ticketId/reject', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { notes, reason } = req.body;
    const rejectorId = req.user.id;

    console.log('❌ Rejecting claim for ticket:', ticketId);
    console.log('🔍 Rejector ID:', rejectorId);
    console.log('🔍 Reason:', reason);

    // Verify user has approval permissions
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to reject claims'
      });
    }

    // Find and verify the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(ticketId) },
      include: {
        user: {
          select: {
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
    
    if (ticket.status !== 'validated') {
      return res.status(400).json({
        success: false,
        message: `Ticket status is ${ticket.status}, not validated (awaiting approval)`
      });
    }
    
    // Update ticket to cancelled (claim rejected)
    // Note: Schema doesn't have approvalNotes field yet
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(ticketId) },
      data: {
        status: 'cancelled' // Mark as cancelled since claim was rejected
      },
      include: {
        user: {
          select: {
            username: true,
            fullName: true
          }
        }
      }
    });
    
    console.log(`✅ Ticket ${ticketId} rejected and reset to validated status`);
    
    res.json({
      success: true,
      message: 'Claim rejected successfully',
      ticket: updatedTicket
    });

  } catch (error) {
    console.error('❌ Reject claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting claim',
      error: error.message
    });
  }
});

// @route   GET /api/v1/claim-approvals/history
// @desc    Get claim approval history (simplified version)
// @access  Protected (SuperAdmin, Admin)
router.get('/history', async (req, res) => {
  try {
    // For now, return empty array since we don't have claims_audit table configured
    res.json({
      success: true,
      history: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        hasNext: false,
        hasPrev: false
      }
    });

  } catch (error) {
    console.error('Approval history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approval history',
      error: error.message
    });
  }
});

// @route   GET /api/v1/claim-approvals/stats
// @desc    Get approval statistics (simplified version)
// @access  Protected (SuperAdmin, Admin)
router.get('/stats', async (req, res) => {
  try {
    // Get validated tickets with draw results to check for winners
    const validatedTickets = await prisma.ticket.findMany({
      where: { 
        status: 'validated',
        draw: {
          winningNumber: {
            not: null
          }
        }
      },
      include: {
        bets: true,
        draw: {
          select: {
            winningNumber: true
          }
        },
        winningTickets: true
      }
    });

    // Filter to count only actual winning tickets
    const pendingWinningTickets = validatedTickets.filter(ticket => {
      const winningNumber = ticket.draw?.winningNumber;
      if (!winningNumber || !ticket.bets || ticket.bets.length === 0) return false;
      
      const hasWinningBet = ticket.bets.some(bet => 
        checkIfBetIsWinning(bet.betCombination, bet.betType, winningNumber)
      );
      const hasWinningTicketRecord = ticket.winningTickets && ticket.winningTickets.length > 0;
      
      return hasWinningBet || hasWinningTicketRecord;
    });

    const pendingCount = pendingWinningTickets.length;

    // Approved claims = paid tickets (prizes paid out)
    const approvedCount = await prisma.ticket.count({
      where: { status: 'paid' }
    });

    // Rejected claims = cancelled tickets (could be rejected claims or other cancellations)
    const rejectedCount = await prisma.ticket.count({
      where: { status: 'cancelled' }
    });

    const stats = {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      averageApprovalTimeHours: 0, // TODO: Calculate based on approval timestamps when schema supports it
      totalProcessed: approvedCount + rejectedCount
    };

    console.log('📊 Approval stats (winning tickets only):', stats);

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('Approval stats error:', error);
    console.error('Full error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approval stats',
      error: error.message
    });
  }
});


module.exports = router;
