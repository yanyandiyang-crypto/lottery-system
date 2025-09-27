/**
 * Ticket Service
 * Business logic for ticket operations
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { TICKET_STATUS, AUDIT_ACTIONS, PRIZE_STRUCTURE } = require('../utils/constants');
const { isValidTicketNumber, validateBetAmount, isValidBetCombination } = require('../utils/validators');

const prisma = new PrismaClient();

class TicketService {
  /**
   * Create a new ticket
   * @param {Object} ticketData - Ticket creation data
   * @returns {Promise<Object>} - Created ticket
   */
  static async createTicket(ticketData) {
    const { userId, drawId, bets, totalAmount } = ticketData;
    
    // Validate bets
    for (const bet of bets) {
      if (!isValidBetCombination(bet.betCombination)) {
        throw new Error(`Invalid bet combination: ${bet.betCombination}`);
      }
      
      const amountValidation = validateBetAmount(bet.betAmount);
      if (!amountValidation.isValid) {
        throw new Error(amountValidation.error);
      }
    }
    
    // Generate ticket number
    const ticketNumber = this.generateTicketNumber();
    
    // Create ticket with bets in transaction
    const ticket = await prisma.$transaction(async (tx) => {
      const newTicket = await tx.ticket.create({
        data: {
          ticketNumber,
          userId,
          drawId,
          totalAmount,
          status: TICKET_STATUS.PENDING
        }
      });
      
      // Create bets
      await tx.bet.createMany({
        data: bets.map(bet => ({
          ticketId: newTicket.id,
          betCombination: bet.betCombination,
          betType: bet.betType,
          betAmount: bet.betAmount
        }))
      });
      
      return newTicket;
    });
    
    // Log audit trail
    await this.logAuditAction(userId, AUDIT_ACTIONS.CREATE_TICKET, {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      totalAmount,
      betsCount: bets.length
    });
    
    return ticket;
  }
  
  /**
   * Verify ticket by QR code
   * @param {string} qrData - QR code data
   * @returns {Promise<Object>} - Ticket verification result
   */
  static async verifyTicketByQR(qrData) {
    const [ticketNumber, providedHash] = qrData.split('|');
    
    if (!ticketNumber || !providedHash) {
      throw new Error('Invalid QR code format');
    }
    
    const ticket = await this.getTicketWithDetails(ticketNumber);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    // Verify hash
    const expectedHash = this.generateTicketHash(ticket);
    if (providedHash !== expectedHash) {
      throw new Error('Invalid or tampered QR code');
    }
    
    return this.formatTicketResponse(ticket);
  }
  
  /**
   * Search ticket by number
   * @param {string} ticketNumber - Ticket number
   * @returns {Promise<Object>} - Ticket details
   */
  static async searchTicketByNumber(ticketNumber) {
    if (!isValidTicketNumber(ticketNumber)) {
      throw new Error('Invalid ticket number format. Must be 17 digits.');
    }
    
    const ticket = await this.getTicketWithDetails(ticketNumber);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    return this.formatTicketResponse(ticket);
  }
  
  /**
   * Claim a winning ticket
   * @param {string} ticketNumber - Ticket number
   * @returns {Promise<Object>} - Claim result
   */
  static async claimTicket(ticketNumber) {
    const ticket = await this.getTicketWithDetails(ticketNumber);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    if (ticket.status !== TICKET_STATUS.VALIDATED) {
      throw new Error('This ticket is not a winning ticket');
    }
    
    if (ticket.status === TICKET_STATUS.CLAIMED) {
      throw new Error('This ticket has already been claimed');
    }
    
    // Use agent information automatically
    const agentName = ticket.user?.fullName || ticket.user?.username || 'Unknown Agent';
    const agentPhone = ticket.user?.phone || '';
    const agentAddress = ticket.user?.address || '';
    
    // Update ticket status to pending approval
    const updatedTicket = await prisma.ticket.update({
      where: { ticketNumber },
      data: {
        status: TICKET_STATUS.PENDING_APPROVAL,
        claimedAt: new Date(),
        claimerName: agentName,
        claimerPhone: agentPhone,
        claimerAddress: agentAddress,
        approvalRequestedAt: new Date(),
        approvalRequestedBy: ticket.userId
      }
    });
    
    // Log audit trail
    await this.logAuditAction(ticket.userId, AUDIT_ACTIONS.CLAIM_REQUESTED, {
      ticketNumber,
      claimerName: agentName,
      automatic: true
    });
    
    return {
      ticket: updatedTicket,
      agent: {
        name: agentName,
        phone: agentPhone,
        address: agentAddress
      }
    };
  }
  
  /**
   * Calculate winning amount for a ticket
   * @param {Object} ticket - Ticket with bets and draw results
   * @returns {number} - Total winning amount
   */
  static calculateWinningAmount(ticket) {
    if (!ticket.draw?.drawResult || !ticket.draw.drawResult.winningNumber) {
      console.log('No draw result or winning number for ticket:', ticket.ticketNumber);
      return 0;
    }
    
    const winningNumbers = [ticket.draw.drawResult.winningNumber];
    let totalWinnings = 0;
    
    console.log('Calculating winnings for ticket:', ticket.ticketNumber, 'against winning numbers:', winningNumbers);
    
    ticket.bets.forEach(bet => {
      const winResult = this.checkIfWinning(bet, winningNumbers);
      console.log('Bet:', bet.betCombination, 'Win result:', winResult);
      if (winResult.isWinning) {
        const prizeAmount = this.calculatePrizeAmount(bet, winResult.winType);
        totalWinnings += prizeAmount;
        console.log('Winning bet! Prize amount:', prizeAmount);
      }
    });
    
    console.log('Total winnings for ticket:', ticket.ticketNumber, '=', totalWinnings);
    return totalWinnings;
  }
  
  /**
   * Check if a bet is winning
   * @param {Object} bet - Bet object
   * @param {Array} winningNumbers - Array of winning numbers
   * @returns {Object} - Win result
   */
  static checkIfWinning(bet, winningNumbers) {
    const betCombo = bet.betCombination.toString();
    
    for (const winningNumber of winningNumbers) {
      const winningCombo = winningNumber.toString();
      
      // Check for straight win
      if (betCombo === winningCombo) {
        return {
          isWinning: true,
          winType: 'straight',
          matchedNumber: winningCombo
        };
      }
      
      // Check for rambolito win (any permutation)
      if (bet.betType === 'rambolito' || bet.betType === 'Rambolito') {
        if (this.isPermutation(betCombo, winningCombo)) {
          return {
            isWinning: true,
            winType: 'rambolito',
            matchedNumber: winningCombo
          };
        }
      }
    }
    
    return { isWinning: false, winType: null, matchedNumber: null };
  }
  
  /**
   * Generate ticket number
   * @returns {string} - 17-digit ticket number
   */
  static generateTicketNumber() {
    const timestamp = Date.now().toString(); // 13 digits
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 4 digits
    return timestamp + random;
  }
  
  /**
   * Generate ticket hash for QR code
   * @param {Object} ticket - Ticket object
   * @returns {string} - 16-character hash
   */
  static generateTicketHash(ticket) {
    return crypto.createHash('sha256')
      .update(`${ticket.ticketNumber}:${ticket.totalAmount}:${ticket.drawId}:${ticket.userId}:${new Date(ticket.createdAt).getTime()}`)
      .digest('hex').substring(0, 16);
  }
  
  /**
   * Get ticket with all related data
   * @param {string} ticketNumber - Ticket number
   * @returns {Promise<Object>} - Ticket with relations
   */
  static async getTicketWithDetails(ticketNumber) {
    return await prisma.ticket.findUnique({
      where: { ticketNumber },
      include: {
        bets: true,
        draw: {
          include: {
            drawResult: true
          }
        },
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
  }
  
  /**
   * Format ticket response
   * @param {Object} ticket - Raw ticket data
   * @returns {Object} - Formatted ticket response
   */
  static formatTicketResponse(ticket) {
    const winAmount = this.calculateWinningAmount(ticket);
    const isWinning = winAmount > 0;
    const isClaimed = ticket.status === TICKET_STATUS.CLAIMED;
    
    // Calculate derived status based on draw results
    let derivedStatus = ticket.status;
    const drawFinished = ticket.draw?.status === 'settled' || ticket.draw?.status === 'closed';
    const hasWinningNumber = ticket.draw?.drawResult?.winningNumber || ticket.draw?.winningNumber;
    
    if (drawFinished && hasWinningNumber && ticket.status === 'pending') {
      derivedStatus = isWinning ? 'won' : 'lost';
    }
    
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      totalAmount: ticket.totalAmount,
      winAmount,
      isWinning,
      isClaimed,
      status: ticket.status,
      derivedStatus: derivedStatus,
      createdAt: ticket.createdAt,
      draw: ticket.draw ? {
        id: ticket.draw.id,
        drawDate: ticket.draw.drawDate,
        drawTime: ticket.draw.drawTime,
        status: ticket.draw.status,
        winningNumber: ticket.draw.drawResult?.winningNumber || ticket.draw.winningNumber
      } : null,
      bets: ticket.bets ? ticket.bets.map(bet => ({
        betCombination: bet.betCombination,
        betType: bet.betType,
        betAmount: bet.betAmount
      })) : [],
      user: ticket.user ? {
        id: ticket.user.id,
        username: ticket.user.username,
        fullName: ticket.user.fullName
      } : null,
      // Keep agent for backward compatibility
      agent: ticket.user ? {
        name: ticket.user.fullName || ticket.user.username,
        fullName: ticket.user.fullName,
        username: ticket.user.username
      } : null
    };
  }
  
  /**
   * Calculate prize amount
   * @param {Object} bet - Bet object
   * @param {string} winType - Type of win (straight/rambolito)
   * @returns {number} - Prize amount
   */
  static calculatePrizeAmount(bet, winType) {
    const betAmount = parseFloat(bet.betAmount || bet.amount || 0);
    const baseMultiplier = PRIZE_STRUCTURE[winType.toUpperCase()] || 0;
    return baseMultiplier * betAmount;
  }
  
  /**
   * Check if two numbers are permutations
   * @param {string} num1 - First number
   * @param {string} num2 - Second number
   * @returns {boolean} - Are permutations
   */
  static isPermutation(num1, num2) {
    if (num1.length !== num2.length) return false;
    
    const sorted1 = num1.split('').sort().join('');
    const sorted2 = num2.split('').sort().join('');
    
    return sorted1 === sorted2;
  }
  
  /**
   * Find ticket by idempotency key
   * @param {number} userId - User ID
   * @param {string} idempotencyKey - Idempotency key
   * @returns {Promise<Object|null>} - Existing ticket or null
   */
  static async findByIdempotencyKey(userId, idempotencyKey) {
    try {
      const exists = await prisma.$queryRaw`
        SELECT ticket_id FROM idempotency_keys 
        WHERE user_id = ${userId} AND idem_key = ${idempotencyKey}
      `;
      
      if (Array.isArray(exists) && exists[0]?.ticket_id) {
        return await this.getTicketWithDetails(exists[0].ticket_id);
      }
      
      return null;
    } catch (error) {
      console.error('Error finding ticket by idempotency key:', error);
      return null;
    }
  }
  
  /**
   * Map frontend status to database status values
   * @param {string} frontendStatus - Status from frontend
   * @returns {string|Array|null} - Database status value(s)
   */
  static mapStatusFilter(frontendStatus) {
    // Full status mapping with all enum values (Prisma client regenerated)
    const statusMapping = {
      'won': ['validated', 'claimed', 'pending_approval'], // All winning tickets
      'winning': ['validated', 'claimed', 'pending_approval'], // Alternative for winning
      'pending': 'pending',
      'validated': 'validated', 
      'claimed': 'claimed',
      'pending_approval': 'pending_approval',
      'cancelled': 'cancelled',
      'paid': 'paid',
      'all': null, // No filter
      // Additional mappings for frontend compatibility
      'active': 'pending',
      'completed': ['validated', 'claimed', 'paid']
    };
    
    return statusMapping[frontendStatus] || null;
  }

  /**
   * Get tickets with pagination and filters
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} - Tickets with pagination info
   */
  static async getTickets(filters = {}, pagination = {}) {
    const { page = 1, limit = 20, offset = 0 } = pagination;
    const where = {};
    
    // Apply filters
    if (filters.userId) {
      where.userId = filters.userId;
    }
    
    if (filters.status && filters.status !== 'all') {
      const mappedStatus = this.mapStatusFilter(filters.status);
      
      if (Array.isArray(mappedStatus)) {
        // For multiple statuses, use IN operator (only with existing enum values)
        where.status = { in: mappedStatus };
      } else if (mappedStatus) {
        where.status = mappedStatus;
      }
    }
    
    if (filters.drawId) {
      where.drawId = filters.drawId;
    }
    
    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;
      where.createdAt = {};
      
      if (startDate && startDate !== null) {
        where.createdAt.gte = new Date(startDate);
      }
      
      if (endDate && endDate !== null) {
        // Set end date to end of day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }
    
    // Search filter
    if (filters.search) {
      where.OR = [
        { ticketNumber: { contains: filters.search } },
        { user: { username: { contains: filters.search, mode: 'insensitive' } } },
        { user: { fullName: { contains: filters.search, mode: 'insensitive' } } }
      ];
    }
    
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          bets: true,
          draw: {
            select: {
              id: true,
              drawDate: true,
              drawTime: true,
              status: true,
              winningNumber: true,
              drawResult: {
                select: {
                  winningNumber: true
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.ticket.count({ where })
    ]);
    
    return {
      tickets: tickets.map(ticket => this.formatTicketResponse(ticket)),
      total,
      page,
      limit
    };
  }
  
  /**
   * Search for ticket by ticket number (public search)
   * @param {string} ticketNumber - Ticket number
   * @returns {Promise<Object>} - Ticket details for verification
   */
  static async searchTicket(ticketNumber) {
    console.log('Searching for ticket:', ticketNumber);
    
    const ticket = await this.getTicketWithDetails(ticketNumber);
    if (!ticket) {
      console.log('Ticket not found in database:', ticketNumber);
      throw new Error('Ticket not found');
    }
    
    console.log('Found ticket:', {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      drawId: ticket.drawId,
      hasDrawResult: !!ticket.draw?.drawResult,
      winningNumber: ticket.draw?.drawResult?.winningNumber
    });
    
    // Return limited information for public search
    return {
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      totalAmount: ticket.totalAmount,
      createdAt: ticket.createdAt,
      draw: ticket.draw ? {
        id: ticket.draw.id,
        drawDate: ticket.draw.drawDate,
        drawTime: ticket.draw.drawTime,
        status: ticket.draw.status
      } : null,
      bets: ticket.bets || [],
      isWinning: ticket.status === TICKET_STATUS.VALIDATED || 
                 ticket.status === TICKET_STATUS.CLAIMED || 
                 ticket.status === TICKET_STATUS.PENDING_APPROVAL,
      isClaimed: ticket.status === TICKET_STATUS.CLAIMED,
      agent: ticket.user ? {
        name: ticket.user.fullName || ticket.user.username,
        phone: ticket.user.phone,
        address: ticket.user.address
      } : null
      // Note: Claimer information is stored in database but not displayed publicly
    };
  }

  /**
   * Get ticket by ticket number
   * @param {string} ticketNumber - Ticket number
   * @returns {Promise<Object>} - Ticket details
   */
  static async getTicketByNumber(ticketNumber) {
    const ticket = await this.getTicketWithDetails(ticketNumber);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    return this.formatTicketResponse(ticket);
  }
  
  /**
   * Cancel a ticket
   * @param {string} ticketNumber - Ticket number
   * @param {number} cancelledBy - User ID who cancelled
   * @returns {Promise<Object>} - Cancellation result
   */
  static async cancelTicket(ticketNumber, cancelledBy) {
    const ticket = await this.getTicketWithDetails(ticketNumber);
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    if (ticket.status !== TICKET_STATUS.PENDING) {
      throw new Error('Only pending tickets can be cancelled');
    }
    
    // Check if draw has already started
    if (ticket.draw && ticket.draw.status !== 'scheduled') {
      throw new Error('Cannot cancel ticket after draw has started');
    }
    
    const updatedTicket = await prisma.ticket.update({
      where: { ticketNumber },
      data: {
        status: TICKET_STATUS.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy
      }
    });
    
    // Log audit trail
    await this.logAuditAction(cancelledBy, 'TICKET_CANCELLED', {
      ticketId: ticket.id,
      ticketNumber,
      originalAmount: ticket.totalAmount
    });
    
    return {
      success: true,
      ticketNumber,
      hash,
      qrData,
      qrUrl: `https://quickchart.io/qr?text=${encodeURIComponent(qrData)}&size=200&margin=0&ecc=H`
    };
  }
  
  /**
   * Get ticket statistics
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Statistics
   */
  static async getTicketStats(filters = {}) {
    const where = {};
    
    // Apply filters
    if (filters.userId) {
      where.userId = filters.userId;
    }
    
    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;
      where.createdAt = {};
      
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }
    
    const [
      totalTickets,
      pendingTickets,
      validatedTickets,
      claimedTickets,
      cancelledTickets,
      totalSales
    ] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: TICKET_STATUS.PENDING } }),
      prisma.ticket.count({ where: { ...where, status: TICKET_STATUS.VALIDATED } }),
      prisma.ticket.count({ where: { ...where, status: TICKET_STATUS.CLAIMED } }),
      prisma.ticket.count({ where: { ...where, status: TICKET_STATUS.CANCELLED } }),
      prisma.ticket.aggregate({
        where,
        _sum: { totalAmount: true }
      })
    ]);
    
    return {
      totalTickets,
      pendingTickets,
      validatedTickets,
      claimedTickets,
      cancelledTickets,
      totalSales: totalSales._sum.totalAmount || 0,
      winRate: totalTickets > 0 ? ((validatedTickets + claimedTickets) / totalTickets * 100).toFixed(2) : 0
    };
  }
  
  /**
   * Create multiple tickets in bulk
   * @param {Array} ticketsData - Array of ticket data
   * @param {number} createdBy - User ID creating tickets
   * @returns {Promise<Object>} - Bulk creation result
   */
  static async createBulkTickets(ticketsData, createdBy) {
    const results = {
      successful: [],
      failed: [],
      totalCreated: 0,
      totalFailed: 0
    };
    
    for (const ticketData of ticketsData) {
      try {
        const ticket = await this.createTicket({
          ...ticketData,
          createdBy
        });
        
        results.successful.push({
          ticketNumber: ticket.ticketNumber,
          totalAmount: ticket.totalAmount
        });
        results.totalCreated++;
      } catch (error) {
        results.failed.push({
          ticketData,
          error: error.message
        });
        results.totalFailed++;
      }
    }
    
    return results;
  }

  /**
   * Claim ticket with claimer details
   * @param {string} ticketNumber - Ticket number
   * @param {string} claimerName - Name of person claiming
   * @param {string} claimerPhone - Phone of claimer
   * @param {string} claimerAddress - Address of claimer
   * @returns {Promise<Object>} - Claim result
   */
  static async claimTicketWithDetails(ticketNumber, claimerName, claimerPhone, claimerAddress) {
    const ticket = await this.getTicketWithDetails(ticketNumber);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    // Check if ticket is eligible for claiming
    console.log('Checking ticket eligibility:', {
      ticketNumber,
      currentStatus: ticket.status,
      CLAIMED: TICKET_STATUS.CLAIMED,
      PENDING_APPROVAL: TICKET_STATUS.PENDING_APPROVAL
    });
    
    if (ticket.status === TICKET_STATUS.CLAIMED || ticket.status === TICKET_STATUS.PENDING_APPROVAL) {
      throw new Error(`This ticket has already been claimed. Current status: ${ticket.status}`);
    }
    
    if (ticket.status === TICKET_STATUS.CANCELLED) {
      throw new Error('This ticket has been cancelled');
    }
    
    // Check if ticket is actually winning by calculating winnings
    const winningAmount = this.calculateWinningAmount(ticket);
    console.log('Claim validation for ticket:', ticketNumber, {
      status: ticket.status,
      winningAmount,
      hasDrawResult: !!ticket.draw?.drawResult,
      winningNumber: ticket.draw?.drawResult?.winningNumber
    });
    
    if (winningAmount <= 0) {
      throw new Error('This ticket is not a winning ticket');
    }
    
    // Update ticket with claim details and pending approval status
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: TICKET_STATUS.PENDING_APPROVAL,
        claimerName: claimerName.trim(),
        claimerPhone: claimerPhone?.trim() || null,
        claimerAddress: claimerAddress?.trim() || null,
        approvalRequestedAt: new Date(),
        approvalRequestedBy: ticket.userId, // Required by constraint
        claimedAt: new Date()
      },
      include: {
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

    // Create claims audit record
    await prisma.claimsAudit.create({
      data: {
        ticketId: ticket.id,
        action: 'CLAIM_REQUESTED',
        performedBy: ticket.userId,
        notes: `Claim request submitted by ${claimerName}. Phone: ${claimerPhone || 'N/A'}, Address: ${claimerAddress || 'N/A'}`,
        oldStatus: ticket.status,
        newStatus: TICKET_STATUS.PENDING_APPROVAL
      }
    });
    
    return {
      ticket: this.formatTicketResponse(updatedTicket),
      claimer: {
        name: claimerName,
        phone: claimerPhone,
        address: claimerAddress
      }
    };
  }

  /**
   * Reset ticket claim status (for testing/admin purposes)
   * @param {string} ticketNumber - Ticket number
   * @returns {Promise<Object>} - Reset result
   */
  static async resetTicketClaimStatus(ticketNumber) {
    const ticket = await this.getTicketWithDetails(ticketNumber);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    // Reset ticket to validated status and clear claim data
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: TICKET_STATUS.VALIDATED,
        claimerName: null,
        claimerPhone: null,
        claimerAddress: null,
        approvalRequestedAt: null,
        approvalRequestedBy: null,
        claimedAt: null
      }
    });
    
    console.log('Reset ticket claim status:', ticketNumber, 'to VALIDATED');
    
    return {
      success: true,
      message: 'Ticket claim status reset successfully',
      ticket: this.formatTicketResponse(updatedTicket)
    };
  }

  /**
   * Log audit action
   * @param {number} userId - User ID
   * @param {string} action - Action type
   * @param {Object} details - Action details
   */
  static async logAuditAction(userId, action, details) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          details: JSON.stringify(details),
          ipAddress: '127.0.0.1', // This should come from request
          userAgent: 'System'     // This should come from request
        }
      });
    } catch (error) {
      console.error('Audit logging failed:', error.message);
    }
  }
}

module.exports = TicketService;
