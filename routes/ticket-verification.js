const express = require('express');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const router = express.Router();
const prisma = new PrismaClient();

// @route   POST /api/v1/tickets/verify-qr
// @desc    Verify QR code and return ticket information
// @access  Public (for claiming)
router.post('/verify-qr', async (req, res) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR data is required'
      });
    }

    // Parse QR data format: "ticketNumber|hash"
    const [ticketNumber, providedHash] = qrData.split('|');
    
    if (!ticketNumber || !providedHash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid QR code format'
      });
    }

    // Find ticket in database
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        bets: true,
        draw: true,
        user: {
          select: {
            id: true,
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

    // Generate expected hash for verification
    const expectedHash = crypto.createHash('sha256')
      .update(`${ticket.ticketNumber}:${ticket.totalAmount}:${ticket.drawId}:${ticket.userId}:${new Date(ticket.createdAt).getTime()}`)
      .digest('hex').substring(0, 16);

    // Verify hash
    if (providedHash !== expectedHash) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or tampered QR code'
      });
    }

    // Check if ticket is claimable (check if any bets won)
    // Since there's no winAmount column, we'll check bet results or draw results
    const isWinning = ticket.status === 'validated' || ticket.status === 'paid';
    const isClaimed = ticket.status === 'claimed';

    res.json({
      success: true,
      ticket: {
        ticketNumber: ticket.ticketNumber,
        totalAmount: ticket.totalAmount,
        winAmount: 0, // Will be calculated from bet results
        isWinning,
        isClaimed,
        status: ticket.status,
        drawDate: ticket.draw?.drawDate,
        drawTime: ticket.draw?.drawTime,
        bets: ticket.bets.map(bet => ({
          betCombination: bet.betCombination,
          betType: bet.betType,
          betAmount: bet.betAmount
        })),
        agent: {
          name: ticket.user?.fullName || ticket.user?.username
        },
        createdAt: ticket.createdAt
      }
    });

  } catch (error) {
    console.error('QR verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during QR verification'
    });
  }
});

// @route   GET /api/v1/tickets/search/:ticketNumber
// @desc    Search ticket by number for claiming
// @access  Public
router.get('/search/:ticketNumber', async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    
    // Validate ticket number format (17 digits)
    if (!/^\d{17}$/.test(ticketNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket number format. Must be 17 digits.'
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        bets: true,
        draw: true,
        user: {
          select: {
            id: true,
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

    // Check if ticket is claimable (based on status since no winAmount column)
    const isWinning = ticket.status === 'validated' || ticket.status === 'paid';
    const isClaimed = ticket.status === 'claimed';

    res.json({
      success: true,
      ticket: {
        ticketNumber: ticket.ticketNumber,
        totalAmount: ticket.totalAmount,
        winAmount: 0, // Will be calculated from bet results
        isWinning,
        isClaimed,
        status: ticket.status,
        drawDate: ticket.draw?.drawDate,
        drawTime: ticket.draw?.drawTime,
        bets: ticket.bets.map(bet => ({
          betCombination: bet.betCombination,
          betType: bet.betType,
          betAmount: bet.betAmount
        })),
        agent: {
          name: ticket.user?.fullName || ticket.user?.username
        },
        createdAt: ticket.createdAt
      }
    });

  } catch (error) {
    console.error('Ticket search error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during ticket search'
    });
  }
});

// @route   POST /api/v1/tickets/claim
// @desc    Claim winning ticket (automatic agent information)
// @access  Public (with verification)
router.post('/claim', async (req, res) => {
  try {
    const { ticketNumber } = req.body;
    
    if (!ticketNumber) {
      return res.status(400).json({
        success: false,
        message: 'Ticket number is required'
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        bets: true,
        draw: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            phone: true,
            address: true
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

    // Check if ticket is winning (based on status)
    if (ticket.status !== 'validated') {
      return res.status(400).json({
        success: false,
        message: 'This ticket is not a winning ticket'
      });
    }

    // Check if already claimed
    if (ticket.status === 'claimed') {
      return res.status(400).json({
        success: false,
        message: 'This ticket has already been claimed'
      });
    }

    // Use agent information automatically (no manual input needed)
    const agentName = ticket.user?.fullName || ticket.user?.username || 'Unknown Agent';
    const agentPhone = ticket.user?.phone || '';
    const agentAddress = ticket.user?.address || '';

    // Update ticket status to pending_approval (requires admin approval)
    const updatedTicket = await prisma.ticket.update({
      where: { ticketNumber },
      data: {
        status: 'pending_approval',
        claimedAt: new Date(),
        claimerName: agentName,           // Automatic agent name
        claimerPhone: agentPhone,         // Automatic agent phone
        claimerAddress: agentAddress,     // Automatic agent address
        approvalRequestedAt: new Date(),
        approvalRequestedBy: ticket.userId // Use actual agent ID
      }
    });

    // Log the claim transaction
    try {
      await prisma.auditLog.create({
        data: {
          userId: ticket.userId,
          action: 'CLAIM_REQUESTED',
          details: JSON.stringify({
            ticketNumber,
            claimerName: agentName,
            claimerPhone: agentPhone,
            claimerAddress: agentAddress,
            requestedAt: updatedTicket.claimedAt,
            automatic: true // Flag to indicate automatic agent info
          }),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
    } catch (auditError) {
      console.log('Audit log creation failed, but claim processed:', auditError.message);
    }

    res.json({
      success: true,
      message: 'Claim request submitted successfully. Agent information used automatically. Awaiting admin approval.',
      ticket: {
        ...updatedTicket,
        agent: {
          name: agentName,
          phone: agentPhone,
          address: agentAddress
        }
      },
      status: 'pending_approval',
      automatic: true
    });

  } catch (error) {
    console.error('Ticket claim error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during ticket claim'
    });
  }
});

// @route   GET /api/v1/tickets/generate-hash/:ticketNumber
// @desc    Generate verification hash for existing ticket (admin only)
// @access  Private (Admin)
router.get('/generate-hash/:ticketNumber', async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    
    const ticket = await prisma.ticket.findUnique({
      where: { ticketNumber }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Generate hash for QR code
    const hash = crypto.createHash('sha256')
      .update(`${ticket.ticketNumber}:${ticket.totalAmount}:${ticket.drawId}:${ticket.userId}:${new Date(ticket.createdAt).getTime()}`)
      .digest('hex').substring(0, 16);

    const qrData = `${ticket.ticketNumber}|${hash}`;

    res.json({
      success: true,
      ticketNumber,
      hash,
      qrData,
      qrUrl: `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=200&margin=0&ecc=H`
    });

  } catch (error) {
    console.error('Hash generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during hash generation'
    });
  }
});

module.exports = router;
