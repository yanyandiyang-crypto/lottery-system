const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// @route   GET /api/v1/claim-approvals/pending
// @desc    Get pending claim approvals
// @access  Protected (SuperAdmin, Admin)
router.get('/pending', async (req, res) => {
  try {
    const { page = 1, limit = 20, agentId } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {
      status: 'pending_approval'
    };

    if (agentId) {
      whereClause.userId = parseInt(agentId);
    }

    // Get pending claims with full details
    const pendingClaims = await prisma.ticket.findMany({
      where: whereClause,
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
            winningNumbers: true
          }
        },
        approvalRequestedBy: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      },
      orderBy: {
        approvalRequestedAt: 'asc' // Oldest first
      },
      skip: offset,
      take: parseInt(limit)
    });

    // Get total count for pagination
    const totalCount = await prisma.ticket.count({
      where: whereClause
    });

    // Calculate prize amounts for each claim
    const enrichedClaims = pendingClaims.map(ticket => {
      // Calculate prize amount based on bets and winning numbers
      let calculatedPrizeAmount = 0;
      
      if (ticket.draw?.winningNumbers && ticket.bets) {
        ticket.bets.forEach(bet => {
          const isWinner = checkIfWinner(bet, ticket.draw.winningNumbers);
          if (isWinner.isWinning) {
            calculatedPrizeAmount += calculatePrizeAmount(bet, isWinner.winType);
          }
        });
      }

      return {
        ...ticket,
        calculatedPrizeAmount,
        daysPending: Math.floor((new Date() - new Date(ticket.approvalRequestedAt)) / (1000 * 60 * 60 * 24))
      };
    });

    res.json({
      success: true,
      claims: enrichedClaims,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: offset + parseInt(limit) < totalCount,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Pending claims error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending claims',
      error: error.message
    });
  }
});

// @route   POST /api/v1/claim-approvals/:ticketId/approve
// @desc    Approve a claim
// @access  Protected (SuperAdmin, Admin)
router.post('/:ticketId/approve', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { notes, prizeAmount } = req.body;
    const approverId = req.user.userId;

    // Verify user has approval permissions
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to approve claims'
      });
    }

    // Get the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(ticketId) },
      include: {
        bets: true,
        user: true,
        draw: true
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not pending approval'
      });
    }

    // Use transaction for approval
    const result = await prisma.$transaction(async (tx) => {
      // Update ticket status to claimed
      const updatedTicket = await tx.ticket.update({
        where: { id: parseInt(ticketId) },
        data: {
          status: 'claimed',
          approvedAt: new Date(),
          approvedBy: approverId,
          approvalNotes: notes,
          prizeAmount: prizeAmount ? parseFloat(prizeAmount) : null
        }
      });

      // Log the approval in claims_audit
      await tx.claimsAudit.create({
        data: {
          ticketId: parseInt(ticketId),
          action: 'approved',
          performedBy: approverId,
          notes: notes || 'Claim approved',
          oldStatus: 'pending_approval',
          newStatus: 'claimed'
        }
      });

      // Log in main audit_log if it exists
      try {
        await tx.auditLog.create({
          data: {
            userId: approverId,
            action: 'CLAIM_APPROVED',
            details: {
              ticketNumber: ticket.ticketNumber,
              claimerName: ticket.claimerName,
              prizeAmount: prizeAmount || 0,
              notes: notes || 'Claim approved',
              approvedAt: new Date().toISOString()
            },
            tableName: 'tickets',
            recordId: parseInt(ticketId)
          }
        });
      } catch (auditError) {
        // Audit log might not exist, continue without it
        console.log('Audit log not available:', auditError.message);
      }

      return updatedTicket;
    });

    res.json({
      success: true,
      message: 'Claim approved successfully',
      ticket: result
    });

  } catch (error) {
    console.error('Approve claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving claim',
      error: error.message
    });
  }
});

// @route   POST /api/v1/claim-approvals/:ticketId/reject
// @desc    Reject a claim
// @access  Protected (SuperAdmin, Admin)
router.post('/:ticketId/reject', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { notes, reason } = req.body;
    const rejectorId = req.user.userId;

    // Verify user has approval permissions
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to reject claims'
      });
    }

    // Get the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(ticketId) }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    if (ticket.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Ticket is not pending approval'
      });
    }

    // Use transaction for rejection
    const result = await prisma.$transaction(async (tx) => {
      // Reset ticket status to validated (can be claimed again)
      const updatedTicket = await tx.ticket.update({
        where: { id: parseInt(ticketId) },
        data: {
          status: 'validated',
          // Clear claim data
          claimedAt: null,
          claimerName: null,
          claimerPhone: null,
          claimerAddress: null,
          // Clear approval data
          approvalRequestedAt: null,
          approvalRequestedBy: null,
          approvedAt: null,
          approvedBy: null,
          approvalNotes: `REJECTED: ${reason || notes || 'Claim rejected'}`
        }
      });

      // Log the rejection in claims_audit
      await tx.claimsAudit.create({
        data: {
          ticketId: parseInt(ticketId),
          action: 'rejected',
          performedBy: rejectorId,
          notes: `REJECTED: ${reason || notes || 'Claim rejected'}`,
          oldStatus: 'pending_approval',
          newStatus: 'validated'
        }
      });

      return updatedTicket;
    });

    res.json({
      success: true,
      message: 'Claim rejected successfully',
      ticket: result
    });

  } catch (error) {
    console.error('Reject claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting claim',
      error: error.message
    });
  }
});

// @route   GET /api/v1/claim-approvals/history
// @desc    Get claim approval history
// @access  Protected (SuperAdmin, Admin)
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, performedBy } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (action) {
      whereClause.action = action;
    }
    if (performedBy) {
      whereClause.performedBy = parseInt(performedBy);
    }

    // Get approval history
    const history = await prisma.claimsAudit.findMany({
      where: whereClause,
      include: {
        ticket: {
          select: {
            ticketNumber: true,
            claimerName: true,
            totalAmount: true,
            prizeAmount: true
          }
        },
        performedByUser: {
          select: {
            id: true,
            username: true,
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: parseInt(limit)
    });

    // Get total count
    const totalCount = await prisma.claimsAudit.count({
      where: whereClause
    });

    res.json({
      success: true,
      history: history,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNext: offset + parseInt(limit) < totalCount,
        hasPrev: page > 1
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
// @desc    Get approval statistics
// @access  Protected (SuperAdmin, Admin)
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Get approval stats
    const stats = await prisma.claimsAudit.groupBy({
      by: ['action'],
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {},
      _count: {
        action: true
      }
    });

    // Get pending count
    const pendingCount = await prisma.ticket.count({
      where: { status: 'pending_approval' }
    });

    // Get average approval time
    const approvedClaims = await prisma.ticket.findMany({
      where: {
        status: 'claimed',
        approvedAt: { not: null },
        approvalRequestedAt: { not: null },
        ...(Object.keys(dateFilter).length > 0 ? { approvedAt: dateFilter } : {})
      },
      select: {
        approvalRequestedAt: true,
        approvedAt: true
      }
    });

    const avgApprovalTimeHours = approvedClaims.length > 0 
      ? approvedClaims.reduce((sum, claim) => {
          const timeDiff = new Date(claim.approvedAt) - new Date(claim.approvalRequestedAt);
          return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
        }, 0) / approvedClaims.length
      : 0;

    const formattedStats = {
      pending: pendingCount,
      approved: stats.find(s => s.action === 'approved')?._count.action || 0,
      rejected: stats.find(s => s.action === 'rejected')?._count.action || 0,
      averageApprovalTimeHours: Math.round(avgApprovalTimeHours * 100) / 100,
      totalProcessed: stats.reduce((sum, s) => sum + s._count.action, 0)
    };

    res.json({
      success: true,
      stats: formattedStats
    });

  } catch (error) {
    console.error('Approval stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching approval stats',
      error: error.message
    });
  }
});

// Helper functions
function checkIfWinner(bet, winningNumbers) {
  const betCombo = bet.betCombination.toString();
  
  for (const winningNumber of winningNumbers) {
    const winningCombo = winningNumber.toString();
    
    // Check for straight win
    if (betCombo === winningCombo) {
      return { isWinning: true, winType: 'straight' };
    }
    
    // Check for rambolito win (any permutation)
    if (bet.betType === 'rambolito' || bet.betType === 'Rambolito') {
      if (isPermutation(betCombo, winningCombo)) {
        return { isWinning: true, winType: 'rambolito' };
      }
    }
  }
  
  return { isWinning: false, winType: null };
}

function isPermutation(num1, num2) {
  if (num1.length !== num2.length) return false;
  
  const sorted1 = num1.split('').sort().join('');
  const sorted2 = num2.split('').sort().join('');
  
  return sorted1 === sorted2;
}

function calculatePrizeAmount(bet, winType) {
  const betAmount = parseFloat(bet.betAmount || bet.amount || 0);
  const prizeStructure = {
    'straight': 4500,
    'rambolito': 750
  };
  
  const baseMultiplier = prizeStructure[winType] || 0;
  return baseMultiplier * betAmount;
}

module.exports = router;
