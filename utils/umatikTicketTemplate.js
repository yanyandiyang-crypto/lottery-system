/**
 * Umatik Center Template - Backend Version
 * Single centered logo design for thermal printer (58mm)
 * No DOM dependencies - works on Node.js backend
 */

const QRCode = require('qrcode');
const crypto = require('crypto');
const path = require('path');

/**
 * Format currency to Philippine Peso
 */
function formatCurrency(value) {
  const amount = Number(value || 0);
  return `₱${amount.toFixed(2)}`;
}

/**
 * Format date and time
 */
function formatDateTime(isoOrDate) {
  const date = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate || Date.now());
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return {
    full: `${yyyy}/${mm}/${dd} ${days[date.getDay()]} ${hh}:${mi}`,
    dateOnly: `${yyyy}/${mm}/${dd} ${days[date.getDay()]}`,
    timeOnly: `${hh}:${mi}`
  };
}

/**
 * Map backend drawTime keys to 24h format labels
 */
function mapDrawTimeTo24h(drawTimeKey) {
  const map = {
    twoPM: '14:00',
    fivePM: '17:00',
    ninePM: '21:00'
  };
  return map[drawTimeKey] || drawTimeKey || '';
}

/**
 * Format draw ID
 */
function formatDrawId(drawId) {
  if (!drawId) return 'S000001';
  if (typeof drawId === 'number') return `S${String(drawId).padStart(6, '0')}`;
  if (typeof drawId === 'string' && drawId.startsWith('S')) return drawId;
  return `S${String(drawId).padStart(6, '0')}`;
}

/**
 * Generate QR code as base64 data URL (server-side)
 * @param {string} text - Text to encode
 * @param {number} size - QR code size
 * @returns {Promise<string>} Base64 data URL
 */
async function generateQRCode(text, size = 100) {
  try {
    // Generate QR code as data URL - works server-side without DOM
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 0,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrDataUrl;
  } catch (error) {
    console.error('QR generation failed:', error);
    // Return simple SVG fallback
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
        <rect fill="#fff" width="100" height="100"/>
        <rect fill="#000" x="10" y="10" width="10" height="10"/>
        <rect fill="#000" x="30" y="10" width="10" height="10"/>
        <rect fill="#000" x="50" y="10" width="10" height="10"/>
        <rect fill="#000" x="70" y="10" width="10" height="10"/>
        <text x="50" y="95" text-anchor="middle" font-size="8" fill="#666">QR Error</text>
      </svg>
    `)}`;
  }
}

/**
 * Generate secure hash for QR verification
 * @param {string} ticketNumber
 * @param {number} totalAmount
 * @param {number} drawId
 * @param {number} userId
 * @param {number} timestamp
 * @returns {string} Hash string
 */
function generateSecureHash(ticketNumber, totalAmount, drawId, userId, timestamp) {
  const hashInput = `${ticketNumber}:${totalAmount}:${drawId}:${userId}:${timestamp}`;
  // Use crypto for proper hashing (not btoa like frontend)
  return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
}

/**
 * Get logo path (absolute or relative)
 * @param {string} logoName - Logo filename
 * @returns {string} Logo path or URL
 */
function getLogoPath(logoName = 'pisting-logo.png') {
  // For server-side rendering, use absolute path or data URL
  // Can be converted to base64 for embedding
  return `/logos/${logoName}`;
}

/**
 * Generate Umatik Center Ticket HTML
 * @param {Object} ticket - Ticket data with bets, draw, etc.
 * @param {Object} user - User data
 * @param {Object} options - Optional configuration
 * @returns {Promise<string>} HTML string
 */
async function generateUmatikCenterTicketHTML(ticket, user, options = {}) {
  const bets = Array.isArray(ticket?.bets) ? ticket.bets : [];

  const betDate = ticket?.createdAt ? new Date(ticket.createdAt) : new Date();
  const drawDate = ticket?.draw?.drawDate ? new Date(ticket.draw.drawDate) : betDate;
  const betDateFmt = formatDateTime(betDate);
  const drawDateFmt = formatDateTime(drawDate);

  // Use 24-hour label for draw time
  const drawTimeLabel = mapDrawTimeTo24h(ticket?.draw?.drawTime);
  const fullDrawDate = `${drawDateFmt.dateOnly} ${drawTimeLabel}`.trim();
  const drawId = formatDrawId(ticket?.drawId || ticket?.draw?.id);
  const agentId = user?.username || user?.id || 'agent';
  const totalAmount = ticket?.totalAmount || bets.reduce((s, b) => s + Number(b.betAmount || 0), 0);

  // Generate secure hash for QR verification
  const timestamp = ticket?.createdAt ? new Date(ticket.createdAt).getTime() : Date.now();
  const secureHash = generateSecureHash(
    ticket?.ticketNumber, 
    totalAmount, 
    ticket?.drawId || ticket?.draw?.id, 
    user?.id, 
    timestamp
  );
  const qrData = `${ticket?.ticketNumber}|${secureHash}`;
  
  // Generate QR code (server-side)
  const qrUrl = await generateQRCode(qrData, 100);

  // Logo path (use provided or default)
  const centerLogo = options.logoPath || getLogoPath('pisting-logo.png');

  // Generate bets HTML
  const betsHtml = bets.map((bet, index) => {
    const letter = String.fromCharCode(65 + index); // A, B, C, etc.
    const betTypeLabel = (bet?.betType?.toLowerCase() === 'rambolito') ? 'Rambolito' : 'Standard';
    const combo = (bet?.betCombination || bet?.combi || '').toString();
    const spacedCombo = combo.split('').join(' ');
    const amount = Number(bet?.betAmount || bet?.amount || 0);
    
    return `
      <div style="margin-bottom: 1px; padding: 1px 0; width: 100%; box-sizing: border-box;">
        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
          <tr>
            <td style="font-weight: 700; font-size: 8px; text-align: left; padding: 0;">${betTypeLabel}</td>
            <td style="font-weight: 700; font-size: 13px; letter-spacing: 4px; text-align: right; padding: 0;">${spacedCombo}</td>
          </tr>
          <tr>
            <td style="font-size: 8px; font-weight: 700; text-align: left; padding: 0;">${letter}</td>
            <td style="font-size: 8px; font-weight: 700; text-align: right; padding: 0;">${formatCurrency(amount)}</td>
          </tr>
        </table>
      </div>`;
  }).join('');

  // Format ticket number with spacing (groups of 6-6-5)
  const ticketNum = String(ticket?.ticketNumber || '').padStart(17, '0');
  const digits = ticketNum.split('').map((d, i) => {
    const needsSpace = (i === 6 || i === 12); // Add space after 6th and 12th digit
    return `<span style="font-size: 10px; font-weight: 700; letter-spacing: 2px; display: inline-block;">${d}</span>${needsSpace ? ' ' : ''}`;
  }).join('');

  // Return complete HTML
  return `
<div style="font-family: Arial, sans-serif; font-size: 8px; width: 100%; max-width: 600px; min-width: 220px; color: black; font-weight: 800; background: white; padding: 4px; box-sizing: border-box;">
  <!-- Centered Logo - Table Layout -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
    <tr>
      <td style="text-align: center; padding: 2px 0 6px 0;">
        ${centerLogo ? `<img src="${centerLogo}" alt="Logo" style="width: 80px; height: auto; display: block; margin: 0 auto;">` : ''}
      </td>
    </tr>
  </table>
  
  <!-- Info and QR Code Section - Table Layout for Consistency -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px;">
    <tr>
      <td style="width: 50%; vertical-align: top; padding: 0 1px 0 0;">
        <!-- Info Section - Compact Text Only -->
        <div style="padding: 2px 0;">
          <div style="padding-bottom: 2px; margin-bottom: 2px;">
            <p style="margin: 0; text-align: left; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif; color: black;">BET DATE:</p>
            <p style="margin: 0; text-align: left; font-weight: 700; font-size: 9px; font-family: Arial, sans-serif; color: black;">${betDateFmt.full}</p>
          </div>
          <div style="padding-bottom: 2px; margin-bottom: 2px;">
            <p style="margin: 0; text-align: left; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif; color: black;">DRAW DATE:</p>
            <p style="margin: 0; text-align: left; font-weight: 700; font-size: 9px; font-family: Arial, sans-serif; color: black;">${fullDrawDate}</p>
          </div>
          <div style="padding-bottom: 1px; margin-bottom: 1px;">
            <span style="font-weight: 700; font-size: 7px; font-family: Arial, sans-serif; color: black;">DRAW ID: </span>
            <span style="font-weight: 700; font-size: 8px; font-family: Arial, sans-serif; color: black;">${drawId}</span>
          </div>
          <div style="padding-bottom: 1px; margin-bottom: 1px;">
            <span style="font-weight: 700; font-size: 7px; font-family: Arial, sans-serif; color: black;">AGENT: </span>
            <span style="font-weight: 700; font-size: 8px; font-family: Arial, sans-serif; color: black;">${agentId}</span>
          </div>
          <div style="padding-top: 2px;">
            <span style="font-weight: 700; font-size: 7px; font-family: Arial, sans-serif; color: black;">TOTAL: </span>
            <span style="font-weight: 700; font-size: 9px; font-family: Arial, sans-serif; color: black;">${formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </td>
      <td style="width: 48%; vertical-align: top; text-align: center; padding: 0 0 0 1px;">
        <!-- QR Code Section -->
        <img src="${qrUrl}" alt="QR Code" style="width: 90px; height: 90px; display: block; margin: 0 auto;" />
      </td>
    </tr>
  </table>
  
  <!-- Ticket Number - Compact Text Only -->
  <table style="width: 100%; border-collapse: collapse; margin: 4px 0;">
    <tr>
      <td style="text-align: center; padding: 2px 0;">
        <p style="text-align: center; font-size: 7px; margin: 0 0 2px 0; font-weight: 700; font-family: Arial, sans-serif; color: black;">TICKET NUMBER</p>
        <div style="text-align: center; padding: 0;">
          ${digits}
        </div>
      </td>
    </tr>
  </table>
  
  <!-- Bets Section -->
  ${betsHtml}
  
  <!-- Footer Spacing with Extra Clearance for Cutting -->
  <div style="margin: 6px 0; height: 30px;"></div>
</div>`;
}

module.exports = {
  generateUmatikCenterTicketHTML,
  generateQRCode,
  generateSecureHash,
  formatCurrency,
  formatDateTime,
  mapDrawTimeTo24h,
  formatDrawId
};


