const QRCode = require('qrcode');
const crypto = require('crypto');
const TimezoneUtils = require('./timezone');

class TicketGenerator {
  static generateTicketNumber() {
    // Generate 17-digit random ticket number
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${timestamp}${random}`.substring(0, 17);
  }

  static generateAgentId(user) {
    // Format: AGENT001, AGENT002, etc.
    return user.agentId || `AGENT${user.id.toString().padStart(3, '0')}`;
  }

  static generateDrawId(draw) {
    // Format: A0000001, B0000002, etc.
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = alphabet[draw.id % 26];
    const number = draw.id.toString().padStart(7, '0');
    return `${letter}${number}`;
  }

  static generateSequenceNumber(index) {
    // A, B, C, D, E, F for multiple bets on same ticket
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[index % 26];
  }

  static async generateQRCode(ticketData) {
    try {
      // Create hash of ticket data for QR code
      const dataString = JSON.stringify({
        ticketNumber: ticketData.ticketNumber,
        betCombination: ticketData.betCombination,
        betAmount: ticketData.betAmount,
        drawId: ticketData.drawId,
        timestamp: ticketData.createdAt
      });
      
      const hash = crypto.createHash('sha256').update(dataString).digest('hex');
      
      // Use external QR code service (QuickChart as primary, QRServer as fallback)
      const qrText = encodeURIComponent(hash);
      const primaryQRUrl = `https://quickchart.io/qr?text=${qrText}&size=200`;
      const fallbackQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrText}`;
      
      // Try primary service first
      let qrCodeData = primaryQRUrl;
      
      try {
        // Test if QuickChart is accessible
        const response = await fetch(primaryQRUrl, { method: 'HEAD' });
        if (!response.ok) {
          qrCodeData = fallbackQRUrl;
        }
      } catch (error) {
        // If QuickChart fails, use QRServer
        qrCodeData = fallbackQRUrl;
      }
      
      return {
        hash: hash,
        qrCodeData: qrCodeData
      };
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  static validateBetCombination(betCombination, betType) {
    // Validate 3-digit combination
    if (!/^\d{3}$/.test(betCombination)) {
      return { valid: false, message: 'Bet combination must be 3 digits' };
    }

    // Check for triple numbers in Rambolito (not allowed)
    if (betType === 'rambolito') {
      const digits = betCombination.split('');
      if (digits[0] === digits[1] && digits[1] === digits[2]) {
        return { valid: false, message: 'Triple numbers are not allowed in Rambolito' };
      }
    }

    return { valid: true };
  }

  static calculateWinningPossibilities(betCombination, betType) {
    if (betType === 'standard') {
      return [betCombination]; // Only exact match
    }

    if (betType === 'rambolito') {
      const digits = betCombination.split('');
      const unique = [...new Set(digits)];
      
      // Check if it's a double number (like 344, 511)
      if (unique.length === 2) {
        // 3 possible winning combinations
        const combinations = new Set();
        const permutations = this.getPermutations(digits);
        permutations.forEach(perm => combinations.add(perm.join('')));
        return Array.from(combinations);
      } else {
        // 6 possible winning combinations
        const permutations = this.getPermutations(digits);
        return permutations.map(perm => perm.join(''));
      }
    }

    return [];
  }

  static getPermutations(arr) {
    if (arr.length <= 1) return [arr];
    
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      const current = arr[i];
      const remaining = arr.slice(0, i).concat(arr.slice(i + 1));
      const perms = this.getPermutations(remaining);
      
      for (let perm of perms) {
        result.push([current].concat(perm));
      }
    }
    
    return result;
  }

  static formatTicketData(ticketData, user, draw) {
    const betDate = TimezoneUtils.formatTicketDate(ticketData.createdAt || ticketData.betDate);
    const drawDate = TimezoneUtils.formatDrawDate(draw.drawDate, draw.drawTime);
    
    return {
      betDate: betDate,
      drawDate: drawDate,
      ticketNumber: ticketData.ticketNumber,
      agentId: this.generateAgentId(user),
      drawId: this.generateDrawId(draw),
      betType: ticketData.betType === 'standard' ? 'Standard' : 'Rambolito',
      qrCode: ticketData.qrCode,
      totalAmount: `₱${ticketData.totalAmount.toFixed(2)}`,
      betAmount: `₱${ticketData.betAmount.toFixed(2)}`,
      betCombination: ticketData.betCombination,
      sequenceNumber: ticketData.sequenceNumber,
      logo: 'NewBetting Lottery System' // Can be customized per template
    };
  }

  static getWinningPrize(betType, betCombination) {
    if (betType === 'standard') {
      return 4500;
    }

    if (betType === 'rambolito') {
      const digits = betCombination.split('');
      const unique = [...new Set(digits)];
      
      // Double number (3 possible combinations)
      if (unique.length === 2) {
        return 1500;
      } else {
        // 6 possible combinations
        return 750;
      }
    }

    return 0;
  }

  static validateMinimumBet(amount) {
    return amount >= 1; // Minimum 1 peso
  }
}

module.exports = TicketGenerator;
