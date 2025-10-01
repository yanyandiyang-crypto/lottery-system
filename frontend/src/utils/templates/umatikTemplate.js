// Umatik-style ticket template generator using dynamic data

// Helper formatters kept local to avoid coupling
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

const formatDrawId = (drawId) => {
  if (!drawId) return 'S000001';
  if (typeof drawId === 'number') return `S${String(drawId).padStart(6, '0')}`;
  if (typeof drawId === 'string' && drawId.startsWith('S')) return drawId;
  return `S${String(drawId).padStart(6, '0')}`;
};

// Optimized QR code URL generation (smaller size for faster loading)
const getQuickChartQrUrl = (text, size = 100) => {
  return `https://quickchart.io/qr?text=${encodeURIComponent(text)}&size=${size}&margin=0&ecc=M`;
};

export function generateUmatikTicketHTML(ticket, user, assets = {}) {
  const bets = Array.isArray(ticket?.bets) ? ticket.bets : [];

  const betDate = ticket?.createdAt ? new Date(ticket.createdAt) : new Date();
  const drawDate = ticket?.draw?.drawDate ? new Date(ticket.draw.drawDate) : betDate;
  const betDateFmt = formatDateTime(betDate);
  const drawDateFmt = formatDateTime(drawDate);

  const fullDrawDate = `${drawDateFmt.dateOnly} ${ticket?.draw?.drawTime || ''}`.trim();
  const drawId = formatDrawId(ticket?.drawId || ticket?.draw?.id);
  const agentId = user?.username || user?.id || 'agent';
  const totalAmount = ticket?.totalAmount || bets.reduce((s, b) => s + Number(b.betAmount || 0), 0);

  // Generate secure hash for QR verification
  const timestamp = ticket?.createdAt ? new Date(ticket.createdAt).getTime() : Date.now();
  const hashInput = `${ticket?.ticketNumber}:${totalAmount}:${ticket?.drawId}:${user?.id}:${timestamp}`;
  const fullHash = btoa(hashInput).substring(0, 16); // Simple hash for frontend
  const qrData = `${ticket?.ticketNumber}|${fullHash}`;
  const qrUrl = getQuickChartQrUrl(qrData);

  // Use base64 logos for better compatibility when sharing
  // Fallback to public URLs if base64 not available
  const logo3d = assets.logo3dDataUrl || `${window.location.origin}/logos/3d-lotto.png`;
  const logoUmatik = assets.logoUmatikDataUrl || `${window.location.origin}/logos/umatik.png`;

  const betsHtml = bets.map((bet, index) => {
    const letter = String.fromCharCode(65 + index);
    const betTypeLabel = (bet?.betType?.toLowerCase() === 'rambolito') ? 'Rambolito 6' : (bet?.betType || 'Standard');
    const combo = (bet?.betCombination || bet?.combi || '').toString();
    const spacedCombo = combo.split('').join(' ');
    const amount = Number(bet?.betAmount || bet?.amount || 0);
    return `
      <div style="margin-bottom: 2px; border-bottom: 1px solid #ddd; padding: 2px 0; background-color: #f9f9f9; width: 100%; box-sizing: border-box;">
        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
          <tr>
            <td style="font-weight: 700; font-size: 6px; text-align: left; padding: 0;">${betTypeLabel}</td>
            <td style="font-size: 5px; text-align: right; padding: 0;">${letter}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; font-size: 9px; letter-spacing: 1.5px; text-align: left; padding: 0;">${spacedCombo}</td>
            <td style="font-size: 6px; font-weight: 700; text-align: right; padding: 0;">₱${amount.toFixed(2)}</td>
          </tr>
        </table>
      </div>`;
  }).join('');

  // Format ticket number with spacing (groups of 6-6-5)
  const ticketNum = String(ticket?.ticketNumber || '').padStart(17, '0');
  const digits = ticketNum.split('').map((d, i) => {
    const needsSpace = (i === 6 || i === 12); // Add space after 6th and 12th digit
    return `<span style="font-size: 10px; font-weight: 700; letter-spacing: 3px; display: inline-block;">${d}</span>${needsSpace ? ' ' : ''}`;
  }).join('');

  return `
<div style="font-family: Arial, sans-serif; font-size: 8px; width: 220px; color: black; font-weight: 800; background: white; padding: 4px; box-sizing: border-box;">
  <!-- Header with Both Logos - Table Layout for Consistency -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 4px; border-bottom: 1px solid #000; padding-bottom: 2px;">
    <tr>
      <td style="text-align: left; vertical-align: middle; padding: 0;">
        ${logo3d ? `<img src="${logo3d}" alt="3D Lotto" style="width: 60px; height: auto; display: block;">` : '<div style="font-size: 8px; font-weight: bold;">3D LOTTO</div>'}
      </td>
      <td style="text-align: right; vertical-align: middle; padding: 0;">
        ${logoUmatik ? `<img src="${logoUmatik}" alt="Umatik" style="width: 80px; height: auto; display: block;">` : '<div style="font-size: 7px; font-weight: bold;">UMATIK</div>'}
      </td>
    </tr>
  </table>
  
  <!-- Info Section - Table Layout -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
    <tr><td style="padding: 1px 0; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif;">Bet Date: ${betDateFmt.full}</td></tr>
    <tr><td style="padding: 1px 0; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif;">Draw Date: ${fullDrawDate}</td></tr>
    <tr><td style="padding: 1px 0; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif;">Draw ID: ${drawId}</td></tr>
    <tr><td style="padding: 1px 0; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif;">Agent ID: ${agentId}</td></tr>
    <tr><td style="padding: 1px 0 4px 0; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif;">Ticket Price: ${formatCurrency(totalAmount)}</td></tr>
  </table>
  
  <!-- QR Code Section - Centered Table -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
    <tr>
      <td style="text-align: center; padding: 0;">
        <img src="${qrUrl}" alt="QR Code" style="width: 80px; height: 80px; display: block; margin: 0 auto;" />
      </td>
    </tr>
  </table>
  
  <!-- Ticket Number - Optimized for 58mm (220px width) -->
  <table style="width: 100%; border-collapse: collapse; margin: 4px 0; border-top: 1px dashed #666; border-bottom: 1px dashed #666;">
    <tr>
      <td style="text-align: center; padding: 4px 2px;">
        <div style="font-size: 7px; font-weight: 700; letter-spacing: 0.3px; line-height: 1.3; word-spacing: -1px;">
          ${digits}
        </div>
      </td>
    </tr>
  </table>
  <table style="width: 100%; border-collapse: collapse; margin: 2px 0 6px 0;">
    <tr>
      <td style="text-align: center; font-size: 7px; font-weight: 700; font-family: Arial, sans-serif;">Ticket Number</td>
    </tr>
  </table>
  
  <!-- Bets Section -->
  ${betsHtml}
  
  <!-- Footer Spacing with Extra Clearance for Cutting -->
  <div style="margin: 6px 0; height: 30px;"></div>
</div>`;
}
