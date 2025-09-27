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
    
    if (ticket.status !== 'pending_approval') {
      console.error('❌ Ticket status is not pending_approval:', ticket.status);
      return res.status(400).json({
        success: false,
        message: `Ticket status is ${ticket.status}, not pending_approval`
      });
    }

    console.log('✅ Ticket validation passed, updating status to claimed...');

    // Update ticket status to claimed
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketIdInt },
      data: {
        status: 'claimed',
        approved_at: new Date(), // Use snake_case as per database schema
        approvedBy: approverId,
        approvalNotes: notes || 'Claim approved via admin panel',
        ...(prizeAmount && { prizeAmount: parseFloat(prizeAmount) })
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
    // Get actual stats from database
    const pendingCount = await prisma.ticket.count({
      where: { status: 'pending_approval' }
    });

    const approvedCount = await prisma.ticket.count({
      where: { status: 'claimed' }
    });

    // For now, rejected count is 0 since we reset to validated
    const rejectedCount = 0;

    const stats = {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      averageApprovalTimeHours: 0, // TODO: Calculate based on approval timestamps
      totalProcessed: approvedCount + rejectedCount
    };

    console.log('📊 Approval stats:', stats);

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


module.exports = router;
