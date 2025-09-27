/**
 * Ticket Verification Routes (Clean Architecture)
 * Handles ticket verification and claiming operations
 */

const express = require('express');
const router = express.Router();

// Services
const TicketService = require('../services/TicketService');

// Utils
const { sendSuccess, sendError, sendValidationError, sendNotFound } = require('../utils/responseHelper');
const { validateRequiredFields } = require('../utils/validators');

/**
 * @route   POST /api/v1/tickets/verify-qr
 * @desc    Verify QR code and return ticket information
 * @access  Public (for claiming)
 */
router.post('/verify-qr', async (req, res) => {
  try {
    const { qrData } = req.body;
    
    // Validate required fields
    const validation = validateRequiredFields(req.body, ['qrData']);
    if (!validation.isValid) {
      return sendValidationError(res, validation.missingFields.map(field => `${field} is required`));
    }
    
    // Verify ticket using service
    const ticketData = await TicketService.verifyTicketByQR(qrData);
    
    return sendSuccess(res, { ticket: ticketData }, 'QR code verified successfully');
    
  } catch (error) {
    console.error('QR verification error:', error);
    
    if (error.message.includes('not found')) {
      return sendNotFound(res, 'Ticket');
    }
    
    if (error.message.includes('Invalid') || error.message.includes('tampered')) {
      return sendError(res, error.message, 400);
    }
    
    return sendError(res, 'Server error during QR verification');
  }
});

/**
 * @route   GET /api/v1/tickets/search/:ticketNumber
 * @desc    Search ticket by number for claiming
 * @access  Public
 */
router.get('/search/:ticketNumber', async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    
    if (!ticketNumber) {
      return sendValidationError(res, ['Ticket number is required']);
    }
    
    // Search ticket using service
    const ticketData = await TicketService.searchTicketByNumber(ticketNumber);
    
    return sendSuccess(res, { ticket: ticketData }, 'Ticket found successfully');
    
  } catch (error) {
    console.error('Ticket search error:', error);
    
    if (error.message.includes('not found')) {
      return sendNotFound(res, 'Ticket');
    }
    
    if (error.message.includes('Invalid')) {
      return sendError(res, error.message, 400);
    }
    
    return sendError(res, 'Server error during ticket search');
  }
});

/**
 * @route   POST /api/v1/tickets/claim
 * @desc    Claim winning ticket with claimer details
 * @access  Public (with verification)
 */
router.post('/claim', async (req, res) => {
  try {
    const { ticketNumber, claimerName, claimerPhone, claimerAddress } = req.body;
    
    // Validate required fields
    const validation = validateRequiredFields(req.body, ['ticketNumber', 'claimerName']);
    if (!validation.isValid) {
      return sendValidationError(res, validation.missingFields.map(field => `${field} is required`));
    }
    
    // Claim ticket using service with claimer details
    const claimResult = await TicketService.claimTicketWithDetails(
      ticketNumber, 
      claimerName, 
      claimerPhone, 
      claimerAddress
    );
    
    return sendSuccess(res, {
      ticket: claimResult.ticket,
      claimer: claimResult.claimer,
      status: 'pending_approval'
    }, 'Claim request submitted successfully. Awaiting admin approval.');
    
  } catch (error) {
    console.error('Ticket claim error:', error);
    
    if (error.message.includes('not found')) {
      return sendNotFound(res, 'Ticket');
    }
    
    if (error.message.includes('not a winning') || 
        error.message.includes('already been claimed') ||
        error.message.includes('Invalid')) {
      return sendError(res, error.message, 400);
    }
    
    return sendError(res, 'Server error during ticket claim');
  }
});

/**
 * @route   POST /api/v1/tickets/reset-claim/:ticketNumber
 * @desc    Reset ticket claim status (for testing/admin purposes)
 * @access  Public (should be restricted in production)
 */
router.post('/reset-claim/:ticketNumber', async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    
    const result = await TicketService.resetTicketClaimStatus(ticketNumber);
    
    return sendSuccess(res, result, 'Ticket claim status reset successfully');
    
  } catch (error) {
    console.error('Reset claim error:', error);
    
    if (error.message.includes('not found')) {
      return sendNotFound(res, 'Ticket');
    }
    
    return sendError(res, error.message);
  }
});

/**
 * @route   GET /api/v1/tickets/generate-hash/:ticketNumber
 * @desc    Generate verification hash for existing ticket (admin only)
 * @access  Private (Admin)
 */
router.get('/generate-hash/:ticketNumber', async (req, res) => {
  try {
    const { ticketNumber } = req.params;
    
    if (!ticketNumber) {
      return sendValidationError(res, ['Ticket number is required']);
    }
    
    // Get ticket details
    const ticket = await TicketService.getTicketWithDetails(ticketNumber);
    if (!ticket) {
      return sendNotFound(res, 'Ticket');
    }
    
    // Generate hash for QR code
    const hash = TicketService.generateTicketHash(ticket);
    const qrData = `${ticket.ticketNumber}|${hash}`;
    
    return sendSuccess(res, {
      ticketNumber,
      hash,
      qrData,
      qrUrl: `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=200&margin=0&ecc=H`
    }, 'Hash generated successfully');
    
  } catch (error) {
    console.error('Hash generation error:', error);
    return sendError(res, 'Server error during hash generation');
  }
});

module.exports = router;
