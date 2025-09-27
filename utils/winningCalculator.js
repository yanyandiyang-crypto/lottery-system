// Winning calculation utility for lottery system
// Calculates expected winnings and tracks claimed prizes

class WinningCalculator {
  constructor() {
    // Standard prize structure - can be configured
    this.prizeStructure = {
      'straight': {
        '3D': 4500,      // ₱4,500 for straight 3D
        'rambolito': 750  // ₱750 for rambolito
      },
      'standard': {
        '3D': 4500,
        'rambolito': 750
      }
    };
  }

  /**
   * Calculate expected winnings for a draw based on bets
   * @param {Array} bets - Array of bet objects
   * @param {Array} winningNumbers - Array of winning combinations
   * @returns {Object} Expected winnings breakdown
   */
  calculateExpectedWinnings(bets, winningNumbers) {
    const expectedWinnings = {
      totalExpected: 0,
      winningTickets: [],
      breakdown: {
        straight: { count: 0, amount: 0 },
        rambolito: { count: 0, amount: 0 }
      }
    };

    bets.forEach(bet => {
      const isWinner = this.checkIfWinner(bet, winningNumbers);
      if (isWinner.isWinning) {
        const prizeAmount = this.calculatePrizeAmount(bet, isWinner.winType);
        
        expectedWinnings.totalExpected += prizeAmount;
        expectedWinnings.winningTickets.push({
          ticketNumber: bet.ticketNumber,
          betCombination: bet.betCombination,
          betType: bet.betType,
          winType: isWinner.winType,
          prizeAmount: prizeAmount,
          agentId: bet.agentId || bet.userId
        });

        // Update breakdown
        if (isWinner.winType === 'straight') {
          expectedWinnings.breakdown.straight.count++;
          expectedWinnings.breakdown.straight.amount += prizeAmount;
        } else if (isWinner.winType === 'rambolito') {
          expectedWinnings.breakdown.rambolito.count++;
          expectedWinnings.breakdown.rambolito.amount += prizeAmount;
        }
      }
    });

    return expectedWinnings;
  }

  /**
   * Check if a bet is a winner
   * @param {Object} bet - Bet object
   * @param {Array} winningNumbers - Array of winning combinations
   * @returns {Object} Win status and type
   */
  checkIfWinner(bet, winningNumbers) {
    const betCombo = bet.betCombination.toString();
    
    for (const winningNumber of winningNumbers) {
      const winningCombo = winningNumber.toString();
      
      // Check for straight win
      if (betCombo === winningCombo) {
        return { isWinning: true, winType: 'straight' };
      }
      
      // Check for rambolito win (any permutation)
      if (bet.betType === 'rambolito' || bet.betType === 'Rambolito') {
        if (this.isPermutation(betCombo, winningCombo)) {
          return { isWinning: true, winType: 'rambolito' };
        }
      }
    }
    
    return { isWinning: false, winType: null };
  }

  /**
   * Check if two numbers are permutations of each other
   * @param {string} num1 
   * @param {string} num2 
   * @returns {boolean}
   */
  isPermutation(num1, num2) {
    if (num1.length !== num2.length) return false;
    
    const sorted1 = num1.split('').sort().join('');
    const sorted2 = num2.split('').sort().join('');
    
    return sorted1 === sorted2;
  }

  /**
   * Calculate prize amount for a winning bet
   * @param {Object} bet 
   * @param {string} winType 
   * @returns {number}
   */
  calculatePrizeAmount(bet, winType) {
    const betAmount = parseFloat(bet.betAmount || bet.amount || 0);
    const baseMultiplier = this.prizeStructure.standard[winType] || 0;
    
    // Prize is typically a multiple of bet amount
    // For example: ₱1 bet on straight 3D wins ₱4,500
    // But if bet is ₱5, then win is ₱22,500 (4500 * 5)
    return baseMultiplier * betAmount;
  }

  /**
   * Calculate total claimed winnings for a period
   * @param {Array} claimedTickets - Array of claimed ticket objects
   * @returns {Object} Claimed winnings summary
   */
  calculateClaimedWinnings(claimedTickets) {
    const claimedSummary = {
      totalClaimed: 0,
      claimedCount: 0,
      breakdown: {
        straight: { count: 0, amount: 0 },
        rambolito: { count: 0, amount: 0 }
      },
      byAgent: {}
    };

    claimedTickets.forEach(ticket => {
      if (ticket.status === 'claimed' && ticket.claimedAt) {
        // Calculate prize amount (you might store this in ticket or calculate)
        const prizeAmount = ticket.prizeAmount || this.estimatePrizeAmount(ticket);
        
        claimedSummary.totalClaimed += prizeAmount;
        claimedSummary.claimedCount++;

        // Track by agent
        const agentId = ticket.agentId || ticket.userId;
        if (!claimedSummary.byAgent[agentId]) {
          claimedSummary.byAgent[agentId] = {
            count: 0,
            amount: 0,
            agentName: ticket.user?.fullName || ticket.user?.username || `Agent ${agentId}`
          };
        }
        claimedSummary.byAgent[agentId].count++;
        claimedSummary.byAgent[agentId].amount += prizeAmount;
      }
    });

    return claimedSummary;
  }

  /**
   * Estimate prize amount for a ticket (if not stored)
   * @param {Object} ticket 
   * @returns {number}
   */
  estimatePrizeAmount(ticket) {
    // This is a fallback estimation
    // In production, you should store actual prize amounts
    const totalBetAmount = ticket.totalAmount || 0;
    
    // Assume average multiplier of 1000x for estimation
    // You should replace this with actual calculation based on winning type
    return totalBetAmount * 1000;
  }

  /**
   * Calculate net sales (gross sales - claimed winnings)
   * @param {number} grossSales 
   * @param {number} claimedWinnings 
   * @returns {Object}
   */
  calculateNetSales(grossSales, claimedWinnings) {
    return {
      grossSales: grossSales,
      claimedWinnings: claimedWinnings,
      netSales: grossSales - claimedWinnings,
      claimRate: grossSales > 0 ? (claimedWinnings / grossSales * 100) : 0
    };
  }

  /**
   * Generate winning report for management
   * @param {Object} salesData 
   * @param {Object} winningData 
   * @returns {Object}
   */
  generateWinningReport(salesData, winningData) {
    const report = {
      period: salesData.period || 'Current Period',
      summary: {
        grossSales: salesData.totalSales || 0,
        expectedWinnings: winningData.expectedWinnings || 0,
        claimedWinnings: winningData.claimedWinnings || 0,
        pendingClaims: (winningData.expectedWinnings || 0) - (winningData.claimedWinnings || 0),
        netSales: (salesData.totalSales || 0) - (winningData.claimedWinnings || 0)
      },
      breakdown: {
        expectedByType: winningData.expectedBreakdown || {},
        claimedByType: winningData.claimedBreakdown || {},
        byAgent: winningData.byAgent || {}
      },
      metrics: {
        claimRate: winningData.expectedWinnings > 0 ? 
          (winningData.claimedWinnings / winningData.expectedWinnings * 100) : 0,
        profitMargin: salesData.totalSales > 0 ? 
          ((salesData.totalSales - winningData.claimedWinnings) / salesData.totalSales * 100) : 0
      }
    };

    return report;
  }
}

module.exports = WinningCalculator;
