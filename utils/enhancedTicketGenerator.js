const crypto = require('crypto');
const QRCode = require('qrcode');

class EnhancedTicketGenerator {
  /**
   * Generate 17-digit numeric-only ticket number
   * Format: TTTTTTTTTTTTTRRR (13 digits timestamp + 4 digits random)
   */
  static generateNumericTicketNumber() {
    const timestamp = Date.now().toString(); // 13 digits
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0'); // 4 digits
    const ticketNumber = (timestamp + random).slice(-17); // Ensure exactly 17 digits
    
    // Validate it's purely numeric
    if (!/^\d{17}$/.test(ticketNumber)) {
      // Fallback: generate purely from timestamp and sequential number
      const fallbackRandom = Math.floor(Math.random() * 9999) + 1; // 1-9999
      return (timestamp + fallbackRandom.toString().padStart(4, '0')).slice(-17);
    }
    
    return ticketNumber;
  }

  /**
   * Generate secure hash for QR code verification
   */
  static generateSecureHash(ticketData) {
    const { ticketNumber, totalAmount, drawId, userId, createdAt } = ticketData;
    const timestamp = createdAt ? new Date(createdAt).getTime() : Date.now();
    
    // Create deterministic hash from ticket data
    const hashInput = `${ticketNumber}:${totalAmount}:${drawId}:${userId}:${timestamp}`;
    const fullHash = crypto.createHash('sha256').update(hashInput).digest('hex');
    
    // Return first 16 characters for QR code compactness
    return fullHash.substring(0, 16);
  }

  /**
   * Generate QR code data with enhanced security
   */
  static generateQRData(ticketData) {
    const hash = this.generateSecureHash(ticketData);
    
    // Format: "ticketNumber|hash"
    // This format is compact and easily parseable
    return `${ticketData.ticketNumber}|${hash}`;
  }

  /**
   * Generate QR code URL using external service
   */
  static generateQRCodeUrl(qrData, size = 200) {
    const encodedData = encodeURIComponent(qrData);
    
    // Primary: QuickChart (more reliable)
    const primaryUrl = `https://quickchart.io/qr?text=${encodedData}&size=${size}&margin=0&ecc=H`;
    
    // Fallback: QRServer
    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}&ecc=H`;
    
    return {
      primary: primaryUrl,
      fallback: fallbackUrl,
      data: qrData
    };
  }

  /**
   * Verify QR code hash against ticket data
   */
  static verifyQRHash(qrData, ticketData) {
    try {
      const [ticketNumber, providedHash] = qrData.split('|');
      
      if (!ticketNumber || !providedHash) {
        return { valid: false, error: 'Invalid QR format' };
      }

      if (ticketNumber !== ticketData.ticketNumber) {
        return { valid: false, error: 'Ticket number mismatch' };
      }

      const expectedHash = this.generateSecureHash(ticketData);
      
      if (providedHash !== expectedHash) {
        return { valid: false, error: 'Hash verification failed' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Verification error: ' + error.message };
    }
  }

  /**
   * Validate ticket number format
   */
  static validateTicketNumber(ticketNumber) {
    // Must be exactly 17 digits
    if (!/^\d{17}$/.test(ticketNumber)) {
      return {
        valid: false,
        message: 'Ticket number must be exactly 17 digits'
      };
    }

    // Check if it's not all zeros or all same digit
    if (/^0{17}$/.test(ticketNumber) || /^(\d)\1{16}$/.test(ticketNumber)) {
      return {
        valid: false,
        message: 'Invalid ticket number pattern'
      };
    }

    return { valid: true };
  }

  /**
   * Generate complete ticket data with enhanced security
   */
  static generateCompleteTicketData(ticketInfo, user, draw) {
    const ticketNumber = this.generateNumericTicketNumber();
    const createdAt = new Date();
    
    const ticketData = {
      ticketNumber,
      userId: user.id,
      drawId: draw.id,
      totalAmount: ticketInfo.totalAmount,
      createdAt
    };

    const qrData = this.generateQRData(ticketData);
    const qrUrls = this.generateQRCodeUrl(qrData);

    return {
      ...ticketData,
      qrData,
      qrUrls,
      hash: this.generateSecureHash(ticketData),
      validation: this.validateTicketNumber(ticketNumber)
    };
  }

  /**
   * Format ticket number for display (with spaces for readability)
   */
  static formatTicketNumberForDisplay(ticketNumber) {
    // Format: XXXXX XXXXX XXXXX XX
    return ticketNumber.replace(/(\d{5})(\d{5})(\d{5})(\d{2})/, '$1 $2 $3 $4');
  }

  /**
   * Parse formatted ticket number back to raw format
   */
  static parseFormattedTicketNumber(formattedNumber) {
    return formattedNumber.replace(/\s/g, '');
  }

  /**
   * Generate ticket search patterns for fuzzy matching
   */
  static generateSearchPatterns(ticketNumber) {
    const patterns = [
      ticketNumber, // Exact match
      this.formatTicketNumberForDisplay(ticketNumber), // Formatted
      ticketNumber.substring(0, 10), // First 10 digits
      ticketNumber.substring(-10), // Last 10 digits
    ];

    return patterns.filter((pattern, index, self) => self.indexOf(pattern) === index);
  }

  /**
   * Check if ticket is eligible for claiming
   */
  static checkClaimEligibility(ticket) {
    const checks = {
      exists: !!ticket,
      isWinning: ticket?.winAmount > 0,
      notClaimed: ticket?.status !== 'claimed',
      drawCompleted: ticket?.draw?.status === 'completed',
      withinClaimPeriod: true // You can add claim period logic here
    };

    const eligible = Object.values(checks).every(check => check === true);

    return {
      eligible,
      checks,
      message: eligible ? 'Ticket is eligible for claiming' : 'Ticket is not eligible for claiming'
    };
  }

  /**
   * Generate audit trail data for ticket operations
   */
  static generateAuditData(operation, ticketData, user, additionalData = {}) {
    return {
      operation,
      ticketNumber: ticketData.ticketNumber,
      userId: user?.id,
      timestamp: new Date(),
      ipAddress: additionalData.ipAddress,
      userAgent: additionalData.userAgent,
      details: {
        ...additionalData,
        ticketAmount: ticketData.totalAmount,
        drawId: ticketData.drawId
      }
    };
  }
}

module.exports = EnhancedTicketGenerator;
