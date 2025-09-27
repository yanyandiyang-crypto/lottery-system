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

// @route   GET /api/v1/claim-approvals/pending
// @desc    Get pending claim approvals (simplified version)
// @access  Protected (SuperAdmin, Admin)
router.get('/pending', async (req, res) => {
  try {
    console.log('🔍 Fetching pending claims...');
    
    // Check for tickets with pending_approval status
    const pendingClaims = await prisma.ticket.findMany({
      where: { 
        status: 'pending_approval'
      },
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
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Found ${pendingClaims.length} pending claims`);
    if (pendingClaims.length > 0) {
      console.log('🔍 Sample claim data:', JSON.stringify(pendingClaims[0], null, 2));
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
  try {
    console.log('🚀 APPROVE ENDPOINT REACHED');
    
    // Immediate success response for testing
    res.json({
      success: true,
      message: 'Approval endpoint working - database update disabled for testing',
      ticketId: req.params.ticketId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Approve claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving claim',
      error: error.message
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
    const rejectorId = req.user.userId;

    // Verify user has approval permissions
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to reject claims'
      });
    }

    // For now, just return success (until approval fields are added)
    res.json({
      success: true,
      message: 'Rejection system not fully configured yet',
      ticket: { id: ticketId }
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
    // Return basic stats
    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      averageApprovalTimeHours: 0,
      totalProcessed: 0
    };

    res.json({
      success: true,
      stats: stats
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

// @route   POST /api/v1/claim-approvals/:ticketId/reject
// @desc    Reject a claim (simplified version)
// @access  Protected (SuperAdmin, Admin)
router.post('/:ticketId/reject', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { notes } = req.body;
    const rejectorId = req.user.userId;

    // Verify user has approval permissions
    if (!['superadmin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to reject claims'
      });
    }

    console.log(`❌ Rejecting claim for ticket ${ticketId} by user ${rejectorId}`);
    
    // Find and update the ticket
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
    
    if (ticket.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: `Ticket status is ${ticket.status}, not pending_approval`
      });
    }
    
    // Update ticket status back to validated (can be claimed again)
    const updatedTicket = await prisma.ticket.update({
      where: { id: parseInt(ticketId) },
      data: {
        status: 'validated' // Reset to validated so it can be claimed again
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
    console.error('Reject claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting claim',
      error: error.message
    });
  }
});

module.exports = router;
