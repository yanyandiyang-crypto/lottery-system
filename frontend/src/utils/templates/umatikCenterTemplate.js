// Umatik-style variant: single centered logo, no signature box/text

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `₱${amount.toFixed(2)}`;
};

const formatDateTime = (isoOrDate) => {
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
};

// Map backend drawTime keys to 24h format labels
const mapDrawTimeTo24h = (drawTimeKey) => {
  const map = {
    twoPM: '14:00',
    fivePM: '17:00',
    ninePM: '21:00'
  };
  return map[drawTimeKey] || drawTimeKey || '';
};

const formatDrawId = (drawId) => {
  if (!drawId) return 'S000001';
  if (typeof drawId === 'number') return `S${String(drawId).padStart(6, '0')}`;
  if (typeof drawId === 'string' && drawId.startsWith('S')) return drawId;
  return `S${String(drawId).padStart(6, '0')}`;
};

const getQuickChartQrUrl = (text, size = 270) => {
  return `https://quickchart.io/qr?text=${encodeURIComponent(text)}&size=${size}&margin=0&ecc=H`;
};

export function generateUmatikCenterTicketHTML(ticket, user, assets = {}) {
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
  const hashInput = `${ticket?.ticketNumber}:${totalAmount}:${ticket?.drawId}:${user?.id}:${timestamp}`;
  const fullHash = btoa(hashInput).substring(0, 16); // Simple hash for frontend
  const qrData = `${ticket?.ticketNumber}|${fullHash}`;
  const qrUrl = getQuickChartQrUrl(qrData, 100); // Enhanced QR code for scanning

  // Single centered logo – use base64 for better compatibility when sharing
  // Fallback to public URL if base64 not available
  const centerLogo = assets.logoDataUrl || `${window.location.origin}/logos/pisting-logo.png`;

  const betsHtml = bets.map((bet, index) => {
    const letter = String.fromCharCode(65 + index);
    const betTypeLabel = (bet?.betType?.toLowerCase() === 'rambolito') ? 'Rambolito' : 'Standard';
    const combo = (bet?.betCombination || bet?.combi || '').toString();
    const spacedCombo = combo.split('').join(' ');
    const amount = Number(bet?.betAmount || bet?.amount || 0);
    return `
      <div style="border: 1px solid #333; margin-bottom: 2px; padding: 2px; width: 100%; box-sizing: border-box; background: #f9f9f9;">
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

  // Format ticket number for display (17 digits without spacing)
  const ticketNum = String(ticket?.ticketNumber || '').padStart(17, '0');
  const digits = ticketNum.split('').map(d => 
    `<span style="font-size: 8px; font-weight: 700; letter-spacing: 1px;">${d}</span>`
  ).join('');

  return `
<div style="font-family: Arial, sans-serif; font-size: 8px; width: 220px; color: black; font-weight: 800; background: white; padding: 4px;">
  <!-- Centered Logo -->
  <div style="display: flex; justify-content: center; align-items: center; padding-bottom: 2px; margin-bottom: 4px;">
    ${centerLogo ? `<img src="${centerLogo}" alt="Logo" style="width: 60px; height: auto; z-index: 10;">` : ''}
  </div>
  
  <!-- Info and QR Code Section - Side by side for 58mm -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; gap: 1px;">
    <!-- Info Section - Enhanced Layout -->
    <div style="width: 50%; margin-bottom: 6px; background: #f8f8f8; border: 1px solid #ddd; border-radius: 3px; padding: 3px;">
      <div style="border-bottom: 1px dotted #999; padding-bottom: 2px; margin-bottom: 2px;">
        <p class="ticket-text" style="margin: 0; text-align: left; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif; color: black;">BET DATE:</p>
        <p class="ticket-text" style="margin: 0; text-align: left; font-weight: 700; font-size: 9px; font-family: Arial, sans-serif; color: black;">${betDateFmt.full}</p>
      </div>
      <div style="border-bottom: 1px dotted #999; padding-bottom: 2px; margin-bottom: 2px;">
        <p class="ticket-text" style="margin: 0; text-align: left; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif; color: black;">DRAW DATE:</p>
        <p class="ticket-text" style="margin: 0; text-align: left; font-weight: 700; font-size: 9px; font-family: Arial, sans-serif; color: black;">${fullDrawDate}</p>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
        <span style="font-weight: 700; font-size: 7px; font-family: Arial, sans-serif; color: black;">DRAW ID:</span>
        <span style="font-weight: 700; font-size: 8px; font-family: Arial, sans-serif; color: black;">${drawId}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
        <span style="font-weight: 700; font-size: 7px; font-family: Arial, sans-serif; color: black;">AGENT:</span>
        <span style="font-weight: 700; font-size: 8px; font-family: Arial, sans-serif; color: black;">${agentId}</span>
      </div>
      <div style="display: flex; justify-content: space-between; background: #e8f4f8; padding: 1px 2px; border-radius: 2px; margin-top: 2px;">
        <span style="font-weight: 700; font-size: 7px; font-family: Arial, sans-serif; color: black;">TOTAL:</span>
        <span style="font-weight: 700; font-size: 9px; font-family: Arial, sans-serif; color: black;">${formatCurrency(totalAmount)}</span>
      </div>
    </div>
    
    <!-- QR Code Section - Right side, bigger and closer -->
    <div style="width: 48%; display: flex; justify-content: center; align-items: flex-start;">
      <div id="qrcode-container" style="width: 90px; height: 90px; position: relative; z-index: 1; border: none;">
        <img src="${qrUrl}" alt="QR Code" style="width: 90px; height: 90px; border: none;" />
      </div>
    </div>
  </div>
  
  <!-- Ticket Number Section - Compact -->
  <div style="background: #f0f0f0; border: 1px solid #333; border-radius: 2px; margin: 3px 0; padding: 2px; text-align: center;">
    <p class="ticket-number" style="text-align: center; font-size: 7px; margin: 0 0 1px 0; letter-spacing: 0px; font-weight: 700; font-family: Arial, sans-serif; color: black;">TICKET NUMBER</p>
    <div style="display: flex; justify-content: center; align-items: center; width: 100%; background: white; border: 1px solid #ccc; padding: 2px 1px;">
      ${digits}
    </div>
  </div>
  
  <!-- Bets Section -->
  ${betsHtml}
  
  <!-- Footer Spacing -->
  <div style="margin: 6px 0; height: 6px;"></div>
</div>`;
}


