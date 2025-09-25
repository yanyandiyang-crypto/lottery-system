const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Validate betting rules for 3-digit lottery
 * @param {string} betType - 'standard' or 'rambolito'
 * @param {string} betDigits - 3-digit number
 * @returns {Object} - { valid: boolean, message: string }
 */
function validateBettingRules(betType, betDigits) {
  // Check if betDigits is exactly 3 digits
  if (!/^\d{3}$/.test(betDigits)) {
    return {
      valid: false,
      message: 'Bet digits must be exactly 3 digits'
    };
  }

  if (betType === 'standard') {
    // Standard betting - any 3 digits allowed
    return {
      valid: true,
      message: 'Valid standard bet'
    };
  }

  if (betType === 'rambolito') {
    const digits = betDigits.split('');
    const uniqueDigits = [...new Set(digits)];

    // Check for triple numbers (000, 111, 222, etc.) - not allowed
    if (uniqueDigits.length === 1) {
      return {
        valid: false,
        message: 'Triple numbers (000, 111, 222, etc.) are not allowed for Rambolito betting'
      };
    }

    return {
      valid: true,
      message: 'Valid rambolito bet'
    };
  }

  return {
    valid: false,
    message: 'Invalid bet type'
  };
}

/**
 * Check if bet amount exceeds limits for a specific number
 * @param {number} drawId - Draw ID
 * @param {string} betType - 'standard' or 'rambolito'
 * @param {string} betDigits - 3-digit number
 * @param {number} betAmount - Amount to bet
 * @returns {Object} - { allowed: boolean, message: string }
 */
async function checkBetLimits(drawId, betType, betDigits, betAmount) {
  try {
    // Get current bet limit for this bet type
    const betLimit = await prisma.betLimit.findFirst({
      where: {
        betType,
        isActive: true
      }
    });

    if (!betLimit) {
      return {
        allowed: false,
        message: 'Bet limits not configured for this bet type'
      };
    }

    // Get current total for this number in this draw
    const currentTotal = await prisma.currentBetTotal.findFirst({
      where: {
        drawId,
        betType,
        betCombination: betDigits
      }
    });

    const currentAmount = currentTotal ? currentTotal.totalAmount : 0;
    const newTotal = currentAmount + betAmount;

    // Check if this would exceed the limit
    if (newTotal > betLimit.limitAmount) {
      return {
        allowed: false,
        message: `Bet limit exceeded. Maximum ${betLimit.limitAmount} pesos allowed for number ${betDigits} in ${betType} betting. Current total: ${currentAmount} pesos.`
      };
    }

    // Check if already sold out
    if (currentTotal && currentTotal.isSoldOut) {
      return {
        allowed: false,
        message: `Number ${betDigits} is already sold out for ${betType} betting in this draw`
      };
    }

    return {
      allowed: true,
      message: 'Bet within limits'
    };

  } catch (error) {
    console.error('Check bet limits error:', error);
    return {
      allowed: false,
      message: 'Error checking bet limits'
    };
  }
}

/**
 * Calculate possible winning combinations for Rambolito
 * @param {string} betDigits - 3-digit number
 * @returns {Array} - Array of possible winning combinations
 */
function getRambolitoCombinations(betDigits) {
  const digits = betDigits.split('');
  const permutations = getPermutations(digits);
  return [...new Set(permutations)];
}

/**
 * Get all permutations of an array
 * @param {Array} arr - Array to permute
 * @returns {Array} - Array of permutations
 */
function getPermutations(arr) {
  if (arr.length <= 1) return [arr.join('')];
  
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    const perms = getPermutations(rest);
    for (const perm of perms) {
      result.push(arr[i] + perm);
    }
  }
  return result;
}

/**
 * Check if a ticket is a winning ticket
 * @param {string} betType - 'standard' or 'rambolito'
 * @param {string} betDigits - 3-digit number
 * @param {string} winningNumber - Official winning number
 * @returns {boolean} - True if winning
 */
function isWinningTicket(betType, betDigits, winningNumber) {
  if (betType === 'standard') {
    return betDigits === winningNumber;
  }

  if (betType === 'rambolito') {
    const combinations = getRambolitoCombinations(betDigits);
    return combinations.includes(winningNumber);
  }

  return false;
}

/**
 * Calculate winning prize based on bet type, digits, and bet amount
 * @param {string} betType - 'standard' or 'rambolito'
 * @param {string} betDigits - 3-digit number
 * @param {number} betAmount - Amount bet (default 10 if not provided)
 * @returns {Promise<number>} - Prize amount
 */
async function calculateWinningPrize(betType, betDigits, betAmount = 10) {
  try {
    // Get configuration for this bet type
    const configuration = await prisma.prizeConfiguration.findUnique({
      where: { betType }
    });

    if (!configuration || !configuration.isActive) {
      // Fallback to default calculation if no configuration
      return calculateWinningPrizeDefault(betType, betDigits, betAmount);
    }

    if (betType === 'standard') {
      return betAmount * configuration.multiplier;
    }

    if (betType === 'rambolito') {
      const digits = betDigits.split('');
      const uniqueDigits = [...new Set(digits)];
      
      if (uniqueDigits.length === 1) {
        return 0; // Triple number, invalid
      } else if (uniqueDigits.length === 2) {
        // Rambolito Double: use 150x multiplier
        return betAmount * (configuration.multiplier * 0.33);
      } else {
        // Rambolito: use 75x multiplier
        return betAmount * (configuration.multiplier * 0.17);
      }
    }

    return 0;
  } catch (error) {
    console.error('Error calculating winning prize:', error);
    // Fallback to default calculation
    return calculateWinningPrizeDefault(betType, betDigits, betAmount);
  }
}

/**
 * Default prize calculation (fallback)
 * @param {string} betType - 'standard' or 'rambolito'
 * @param {string} betDigits - 3-digit number
 * @param {number} betAmount - Amount bet
 * @returns {number} - Prize amount
 */
function calculateWinningPrizeDefault(betType, betDigits, betAmount = 10) {
  if (betType === 'standard') {
    // Standard: ₱10 bet = ₱4,500 prize (450x multiplier)
    return betAmount * 450;
  }

  if (betType === 'rambolito') {
    const digits = betDigits.split('');
    const uniqueDigits = [...new Set(digits)];
    
    if (uniqueDigits.length === 1) {
      return 0; // Triple number, invalid
    } else if (uniqueDigits.length === 2) {
      // Rambolito Double: ₱10 bet = ₱1,500 prize (150x multiplier)
      return betAmount * 150;
    } else {
      // Rambolito: ₱10 bet = ₱750 prize (75x multiplier)
      return betAmount * 75;
    }
  }

  return 0;
}

/**
 * Get bet statistics for a specific draw
 * @param {number} drawId - Draw ID
 * @returns {Object} - Bet statistics
 */
async function getBetStatistics(drawId) {
  try {
    const stats = await prisma.ticket.groupBy({
      by: ['betType', 'betCombination'],
      where: { drawId },
      _count: { id: true },
      _sum: { betAmount: true }
    });

    const totalTickets = await prisma.ticket.count({ where: { drawId } });
    const totalAmount = await prisma.ticket.aggregate({
      where: { drawId },
      _sum: { betAmount: true }
    });

    return {
      totalTickets,
      totalAmount: totalAmount._sum.betAmount || 0,
      byNumber: stats
    };

  } catch (error) {
    console.error('Get bet statistics error:', error);
    return {
      totalTickets: 0,
      totalAmount: 0,
      byNumber: []
    };
  }
}

/**
 * Check if betting is allowed for a specific draw
 * @param {number} drawId - Draw ID
 * @returns {Object} - { allowed: boolean, message: string }
 */
async function isBettingAllowed(drawId) {
  try {
    const draw = await prisma.draw.findUnique({
      where: { id: drawId }
    });

    if (!draw) {
      return {
        allowed: false,
        message: 'Draw not found'
      };
    }

    if (draw.status !== 'open') {
      return {
        allowed: false,
        message: 'Draw is not open for betting'
      };
    }

    // Check cutoff time (Asia/Manila)
    const moment = require('moment-timezone');
    const now = moment().tz('Asia/Manila');
    const cutoff = moment(draw.cutoffTime).tz('Asia/Manila');
    if (now.isAfter(cutoff)) {
      return {
        allowed: false,
        message: 'Betting cutoff time has passed'
      };
    }

    return {
      allowed: true,
      message: 'Betting allowed'
    };

  } catch (error) {
    console.error('Check betting allowed error:', error);
    return {
      allowed: false,
      message: 'Error checking betting status'
    };
  }
}

module.exports = {
  validateBettingRules,
  checkBetLimits,
  getRambolitoCombinations,
  getPermutations,
  isWinningTicket,
  calculateWinningPrize,
  calculateWinningPrizeDefault,
  getBetStatistics,
  isBettingAllowed
};


