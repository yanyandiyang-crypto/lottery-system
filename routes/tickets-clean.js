/**
 * Tickets Routes (Clean Architecture)
 * Handles ticket creation and management operations
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Services
const TicketService = require('../services/TicketService');

// Middleware
const { requireAuth } = require('../middleware/auth');
const { requireAgent, requireCoordinator } = require('../middleware/roleCheck');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateTicketCreation, 
  validatePaginationParams, 
  validateDateRange,
  sanitizeBody 
} = require('../middleware/validation');

// Utils
const { sendSuccess, sendError, sendPaginatedResponse } = require('../utils/responseHelper');
const { validateBettingRules, checkBetLimits } = require('../utils/bettingValidator');
const transactionService = require('../services/transactionService');

// Rate limiting for ticket creation
const createTicketLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 tickets per minute per user
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many ticket creation requests. Please try again later.'
  }
});

/**
 * @route   POST /api/v1/tickets/create
 * @desc    Create new ticket with atomic transaction safety
 * @access  Private (Agent only)
 */
router.post('/create', 
  requireAuth,
  requireAgent,
  createTicketLimiter,
  sanitizeBody, // Re-enabled with array handling fix
  validateTicketCreation,
  asyncHandler(async (req, res) => {
    // Debug: Log received data
    console.log('Received ticket creation request:', {
      body: req.body,
      userId: req.user?.id,
      betsLength: req.body.bets?.length,
      betsStructure: req.body.bets?.[0]
    });
    // Enhanced error logging for ticket creation
    console.log('Ticket creation request details:', {
      userId: req.user?.id,
      userRole: req.user?.role,
      bodyKeys: Object.keys(req.body),
      betsCount: req.body.bets?.length,
      drawId: req.body.drawId,
      timestamp: new Date().toISOString()
    });
    
    // Validate required fields
    if (!req.body.bets || !Array.isArray(req.body.bets) || req.body.bets.length === 0) {
      console.log('❌ Missing or invalid bets array');
      return sendError(res, 'Bets array is required and must not be empty', 400);
    }
    
    if (!req.body.drawId) {
      console.log('❌ Missing drawId');
      return sendError(res, 'Draw ID is required', 400);
    }
    
    // Validate each bet
    for (let i = 0; i < req.body.bets.length; i++) {
      const bet = req.body.bets[i];
      if (!bet.betType || !bet.betCombination || !bet.betAmount) {
        console.log(`❌ Invalid bet at index ${i}:`, bet);
        return sendError(res, `Invalid bet at index ${i}. Required: betType, betCombination, betAmount`, 400);
      }
    }

    
    
    try {
      // Main ticket creation logic
      const { bets, drawId, idempotencyKey } = req.body;
      const userId = req.user.id;

      // Handle idempotency
      if (idempotencyKey) {
        const existingTicket = await TicketService.findByIdempotencyKey(userId, idempotencyKey);
        if (existingTicket) {
          return sendSuccess(res, {
            ticket: existingTicket,
            idempotent: true
          }, 'Ticket already created (idempotent request)');
        }
      }

      // Validate betting rules
      const bettingValidation = await validateBettingRules(bets, userId);
      if (!bettingValidation.isValid) {
        return sendError(res, bettingValidation.message, 400);
      }

      // Check bet limits
      const limitsCheck = await checkBetLimits(bets, userId, drawId);
      if (!limitsCheck.isValid) {
        return sendError(res, limitsCheck.message, 400);
      }

      // Calculate total amount
      const totalAmount = bets.reduce((sum, bet) => sum + parseFloat(bet.betAmount), 0);

      // Generate ticket number and QR code (like the old system)
      const { generateTicketNumber } = require('../utils/ticketGenerator');
      const QRCode = require('qrcode');
      const crypto = require('crypto');
      
      const ticketNumber = generateTicketNumber();
      
      // Generate secure hash for QR code
      const hashData = `${ticketNumber}:${totalAmount}:${drawId}:${userId}:${Date.now()}`;
      const hash = crypto.createHash('sha256').update(hashData).digest('hex').substring(0, 16);
      const qrCodeData = `${ticketNumber}|${hash}`;
      const qrCode = await QRCode.toDataURL(qrCodeData);
      
      // Prepare ticket data for atomic transaction
      const ticketData = {
        ticketNumber,
        drawId,
        userId,
        totalAmount,
        qrCode,
        betCombination: bets[0].betCombination, // Primary bet combination
        betType: bets[0].betType
      };
      
      // Use atomic transaction service for balance + ticket creation
      const result = await transactionService.createTicketWithBalanceDeduction(
        ticketData,
        req.user,
        req.ip,
        req.get('User-Agent')
      );
      
      if (!result.success) {
        return sendError(res, result.message, 400);
      }

      // Create bets in database
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.$transaction(async (tx) => {
        // Insert bets
        await tx.bet.createMany({
          data: bets.map(bet => ({
            ticketId: result.ticketId,
            betType: bet.betType,
            betCombination: bet.betCombination,
            betAmount: parseFloat(bet.betAmount)
          }))
        });
      });

      // Get the complete ticket with bets for response
      const completeTicket = await prisma.ticket.findUnique({
        where: { id: result.ticketId },
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

      // Generate and SAVE ticket HTML immediately (pre-generate) using Umatik template
      try {
        console.log('🖼️ Pre-generating ticket HTML for:', completeTicket.ticketNumber);
        
        // Use single Umatik template (no more template system)
        const { generateUmatikCenterTicketHTML } = require('../utils/umatikTicketTemplate');
        
        const ticketHTML = await generateUmatikCenterTicketHTML(completeTicket, completeTicket.user);
        
        // Save HTML to database for instant access
        await prisma.ticket.update({
          where: { id: completeTicket.id },
          data: { 
            generatedHTML: ticketHTML,
            imageGenerated: true,
            imageGeneratedAt: new Date()
          }
        });
        
        console.log('✅ Ticket HTML pre-generated and saved');
      } catch (imageError) {
        console.error('❌ Error pre-generating ticket HTML:', imageError);
      }

      // Return response in the same format as the old route for frontend compatibility
      return res.json({
        success: true,
        message: 'Ticket created successfully',
        ticket: completeTicket,
        remainingBalance: result.remainingBalance,
        imageUrl: `/api/v1/tickets/${completeTicket.ticketNumber}/image` // Pre-generated image URL
      });

    } catch (error) {
      console.error('❌ Ticket creation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating ticket',
        error: error.message
      });
    }
}));

/**
 * @route   GET /api/v1/tickets
 * @desc    Get tickets with pagination and filters
 * @access  Private (Agent sees own, Coordinator+ sees all)
 */
router.get('/',
  requireAuth,
  validatePaginationParams,
  validateDateRange,
  asyncHandler(async (req, res) => {
    const { page, limit, offset } = req.pagination;
    const { startDate, endDate, status, drawId, userId: queryUserId } = req.query;
    const currentUserId = req.user.id;
    const userRole = req.user.role;
    
    console.log('GET /tickets called with:', {
      currentUserId,
      userRole,
      queryUserId,
      query: req.query,
      pagination: req.pagination
    });

    // Build filters
    const filters = {};
    
    // Role-based filtering with query userId support
    if (userRole === 'agent') {
      // Agents can only see their own tickets (ignore queryUserId for security)
      filters.userId = currentUserId;
    } else if (userRole === 'coordinator') {
      // Coordinator sees their agents' tickets
      if (queryUserId) {
        // If specific userId requested, use it (for viewing specific agent's tickets)
        filters.userId = parseInt(queryUserId);
      } else {
        // Otherwise show all tickets under this coordinator
        filters.coordinatorId = currentUserId;
      }
    } else if (['admin', 'superadmin', 'area_coordinator'].includes(userRole)) {
      // Admin/SuperAdmin/Area Coordinator see all tickets or specific user's tickets
      if (queryUserId) {
        filters.userId = parseInt(queryUserId);
      }
      // If no userId specified, show all tickets (no additional filter)
    }

    // Date range filter - only apply if dates are provided and not empty
    if ((startDate && startDate.trim()) || (endDate && endDate.trim())) {
      filters.dateRange = { 
        startDate: startDate && startDate.trim() ? startDate : null, 
        endDate: endDate && endDate.trim() ? endDate : null 
      };
    }

    // Status filter
    if (status) {
      filters.status = status;
    }

    // Draw filter
    if (drawId) {
      filters.drawId = parseInt(drawId);
    }

    const result = await TicketService.getTickets(filters, { page, limit, offset });
    
    console.log('TicketService.getTickets result:', {
      ticketsCount: result.tickets?.length,
      total: result.total,
      filters: filters
    });

    return sendPaginatedResponse(res, result.tickets, result.total, page, limit);
  })
);

/**
 * @route   GET /api/v1/tickets/search/:ticketNumber
 * @desc    Search for ticket by ticket number
 * @access  Public (for verification purposes)
 */
router.get('/search/:ticketNumber',
  asyncHandler(async (req, res) => {
    const { ticketNumber } = req.params;

    const ticket = await TicketService.searchTicket(ticketNumber);

    return sendSuccess(res, { ticket }, 'Ticket found successfully');
  })
);

/**
 * @route   GET /api/v1/tickets/agent/:agentId
 * @desc    Get tickets by agent ID with filters
 * @access  Private (Agent can see own, Coordinators+ can see their agents)
 */
router.get('/agent/:agentId',
  requireAuth,
  validatePaginationParams,
  asyncHandler(async (req, res) => {
    const agentId = parseInt(req.params.agentId);
    const { page, limit, offset } = req.pagination;
    const { status, startDate, endDate, drawTime, search } = req.query;
    const currentUser = req.user;

    // Permission check
    if (currentUser.role === 'agent' && currentUser.id !== agentId) {
      return sendError(res, 'Access denied', 403);
    }

    // Build filters
    const filters = {
      userId: agentId,
      status: status || 'all'
    };

    // Date range filter
    if (startDate || endDate) {
      filters.dateRange = {};
      if (startDate) filters.dateRange.startDate = startDate;
      if (endDate) filters.dateRange.endDate = endDate;
    }

    // Search filter
    if (search) {
      filters.search = search;
    }

    const result = await TicketService.getTickets(filters, { page, limit, offset });

    return sendPaginatedResponse(res, result.tickets, result.total, page, limit);
  })
);

/**
 * @route   GET /api/v1/tickets/:ticketNumber
 * @desc    Get ticket details by ticket number
 * @access  Private (Owner or Coordinator+)
 */
router.get('/:ticketNumber',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { ticketNumber } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const ticket = await TicketService.getTicketByNumber(ticketNumber);

    // Check permissions
    if (userRole === 'agent' && ticket.userId !== userId) {
      return sendError(res, 'Access denied', 403);
    }

    return sendSuccess(res, { ticket }, 'Ticket retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/tickets/:ticketNumber/cancel
 * @desc    Cancel a ticket (if not yet drawn)
 * @access  Private (Owner or Coordinator+)
 */
router.post('/:ticketNumber/cancel',
  requireAuth,
  asyncHandler(async (req, res) => {
    try {
      const { ticketNumber } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const ticket = await TicketService.getTicketByNumber(ticketNumber);

      // Check permissions
      if (userRole === 'agent' && ticket.userId !== userId) {
        return sendError(res, 'Access denied', 403);
      }

      // Cancel ticket
      const cancelResult = await TicketService.cancelTicket(ticketNumber, userId);

      // Refund balance if successful
      if (cancelResult.success) {
        await transactionService.addBalance(ticket.userId, ticket.totalAmount, {
          type: 'TICKET_REFUND',
          ticketId: ticket.id,
          description: `Ticket cancellation refund: ${ticketNumber}`
        });
      }

      return sendSuccess(res, {
        ticket: cancelResult.ticket,
        refundAmount: ticket.totalAmount
      }, 'Ticket cancelled successfully');

    } catch (error) {
      console.error('❌ Ticket creation error:', {
        message: error.message,
        stack: error.stack,
        userId: req.user?.id,
        body: req.body
      });
      
      // Return specific error messages
      if (error.message.includes('Unique constraint')) {
        return sendError(res, 'Ticket number already exists', 409);
      } else if (error.message.includes('Foreign key constraint')) {
        return sendError(res, 'Invalid user or draw reference', 400);
      } else if (error.message.includes('Validation error')) {
        return sendError(res, 'Invalid data format', 400);
      } else {
        return sendError(res, 'Database operation failed: ' + error.message, 500);
      }
    }
  })
);

/**
 * @route   GET /api/v1/tickets/:ticketNumber/qr
 * @desc    Generate QR code for ticket
 * @access  Private (Owner or Coordinator+)
 */
router.get('/:ticketNumber/qr',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { ticketNumber } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const ticket = await TicketService.getTicketByNumber(ticketNumber);

    // Check permissions
    if (userRole === 'agent' && ticket.userId !== userId) {
      return sendError(res, 'Access denied', 403);
    }

    const qrData = await TicketService.generateQRData(ticketNumber);

    return sendSuccess(res, qrData, 'QR code generated successfully');
  })
);

/**
 * @route   GET /api/v1/tickets/stats/summary
 * @desc    Get ticket statistics summary
 * @access  Private (Role-based data)
 */
router.get('/stats/summary',
  requireAuth,
  validateDateRange,
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    const filters = {
      dateRange: { startDate, endDate }
    };

    // Role-based filtering
    if (userRole === 'agent') {
      filters.userId = userId;
    } else if (userRole === 'coordinator') {
      filters.coordinatorId = userId;
    }

    const stats = await TicketService.getTicketStats(filters);

    return sendSuccess(res, stats, 'Statistics retrieved successfully');
  })
);

/**
 * @route   POST /api/v1/tickets/bulk-create
 * @desc    Create multiple tickets in bulk (Coordinator+ only)
 * @access  Private (Coordinator+)
 */
router.post('/bulk-create',
  requireAuth,
  requireCoordinator,
  sanitizeBody,
  asyncHandler(async (req, res) => {
    const { tickets } = req.body;

    if (!Array.isArray(tickets) || tickets.length === 0) {
      return sendError(res, 'Tickets array is required', 400);
    }

    if (tickets.length > 100) {
      return sendError(res, 'Maximum 100 tickets per bulk operation', 400);
    }

    const results = await TicketService.createBulkTickets(tickets, req.user.id);

    return sendSuccess(res, results, 'Bulk tickets created successfully', 201);
  })
);

module.exports = router;
