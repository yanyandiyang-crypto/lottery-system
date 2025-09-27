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

const getQuickChartQrUrl = (text, size = 270) => {
  return `https://quickchart.io/qr?text=${encodeURIComponent(text)}&size=${size}&margin=0&ecc=H`;
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

  const logo3d = assets.logo3dDataUrl || '/logos/3d-lotto.png';
  const logoUmatik = assets.logoUmatikDataUrl || '/logos/umatik.png';

  const betsHtml = bets.map((bet, index) => {
    const letter = String.fromCharCode(65 + index);
    const betTypeLabel = (bet?.betType?.toLowerCase() === 'rambolito') ? 'Rambolito 6' : (bet?.betType || 'Standard');
    const combo = (bet?.betCombination || bet?.combi || '').toString();
    const spacedCombo = combo.split('').join(' ');
    const amount = Number(bet?.betAmount || bet?.amount || 0);
    return `
      <div style="margin-bottom: 1px; border-bottom: 1px dotted #ccc; padding: 1px 0; background-color: #f9f9f9;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-weight: 700; font-size: 6px; font-family: Arial, sans-serif;">${betTypeLabel}</div>
          <div style="font-size: 5px; font-family: Arial, sans-serif;">${letter}</div>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5px;">
          <div style="font-weight: 700; font-size: 9px; letter-spacing: 1.5px; font-family: Arial, sans-serif;">${spacedCombo}</div>
          <div style="font-size: 6px; font-weight: 700; font-family: Arial, sans-serif;">₱${amount.toFixed(2)}</div>
        </div>
      </div>`;
  }).join('');

  const digits = String(ticket?.ticketNumber || '').padStart(17, '0').split('').map(d => `<span style="font-size: 8px; font-weight: 700; letter-spacing: 1px;">${d}</span>`).join('');

  return `
<div style="font-family: Arial, sans-serif; font-size: 8px; width: 220px; color: black; font-weight: 800; background: white; padding: 4px;">
  <!-- Header with Both Logos -->
  <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 2px; margin-bottom: 4px; border-bottom: 1px solid #000;">
    ${logo3d ? `<img src="${logo3d}" alt="3D Lotto" style="width: 60px; height: auto;">` : '<div style="font-size: 8px; font-weight: bold;">3D LOTTO</div>'}
    ${logoUmatik ? `<img src="${logoUmatik}" alt="Umatik" style="width: 80px; height: auto;">` : '<div style="font-size: 7px; font-weight: bold;">UMATIK</div>'}
  </div>
  
  <!-- Info and QR Code Section - Stacked for 58mm -->
  <div style="margin-bottom: 4px;">
    <!-- Info Section -->
    <div style="margin-bottom: 6px;">
      <p style="margin: 2px 0; text-align: left; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif;">Bet Date: ${betDateFmt.full}</p>
      <p style="margin: 2px 0; text-align: left; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif;">Draw Date: ${fullDrawDate}</p>
      <p style="margin: 2px 0; text-align: left; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif;">Draw ID: ${drawId}</p>
      <p style="margin: 2px 0; text-align: left; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif;">Agent ID: ${agentId}</p>
      <p style="margin: 2px 0 6px 0; text-align: left; font-weight: 700; font-size: 7px; font-family: Arial, sans-serif;">Ticket Price: ${formatCurrency(totalAmount)}</p>
    </div>
    
    <!-- QR Code Section -->
    <div style="display: flex; justify-content: center; margin-bottom: 6px;">
      <div style="width: 80px; height: 80px; position: relative; z-index: 1;">
        <img src="${qrUrl}" alt="QR Code" style="width: 80px; height: 80px;" />
      </div>
    </div>
  </div>
  
  <!-- Ticket Number -->
  <div style="display: flex; justify-content: center; align-items: center; width: 100%; margin: 4px 0; gap: 0px; border-top: 1px dashed #666; border-bottom: 1px dashed #666; padding: 3px 0;">
    ${digits}
  </div>
  <p style="text-align: center; font-size: 7px; margin: 2px 0 6px 0; letter-spacing: 0px; font-weight: 700; font-family: Arial, sans-serif; display: block; width: 100%;">Ticket Number</p>
  
  <!-- Bets Section -->
  ${betsHtml}
  
  <!-- Footer Spacing -->
  <div style="margin: 6px 0; height: 6px;"></div>
</div>`;
}
