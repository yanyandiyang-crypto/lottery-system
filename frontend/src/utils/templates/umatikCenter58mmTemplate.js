// 58mm thermal printer optimized Umatik-center-style ticket template

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

const getQuickChartQrUrl = (text, size = 60) => {
  return `https://quickchart.io/qr?text=${encodeURIComponent(text)}&size=${size}&margin=0&ecc=H`;
};

export function generateUmatikCenter58mmTicketHTML(ticket, user, assets = {}) {
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

  const qrData = `T:${ticket?.ticketNumber}\nA:${totalAmount}\nD:${betDateFmt.full}`;
  const qrUrl = getQuickChartQrUrl(qrData, 60);

  // Single centered logo – allow override via assets.logoDataUrl
  const centerLogo = assets.logoDataUrl || '/logos/pisting-logo.png';

  const betsHtml = bets.map((bet, index) => {
    const letter = String.fromCharCode(65 + index);
    const betTypeLabel = (bet?.betType?.toLowerCase() === 'rambolito') ? 'Rambolito 6' : (bet?.betType || 'Standard');
    const combo = (bet?.betCombination || bet?.combi || '').toString();
    const spacedCombo = combo.split('').join(' ');
    const amount = Number(bet?.betAmount || bet?.amount || 0);
    return `
      <div style="border-bottom: 1px dotted #ccc; padding: 2px 0; margin-bottom: 2px; background-color: #f9f9f9;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-weight: 700; font-size: 7px; text-align: left; padding: 0;">${betTypeLabel}</td>
            <td style="font-size: 6px; text-align: right; padding: 0;">${letter}</td>
          </tr>
          <tr>
            <td style="font-weight: 700; font-size: 10px; letter-spacing: 2px; text-align: left; padding: 0;">${spacedCombo}</td>
            <td style="font-size: 7px; font-weight: 700; text-align: right; padding: 0;">₱${amount.toFixed(2)}</td>
          </tr>
        </table>
      </div>`;
  }).join('');

  const digits = String(ticket?.ticketNumber || '').padStart(17, '0').split('').map(d => `<span style="font-size: 8px; font-weight: 700; letter-spacing: 1px;">${d}</span>`).join('');

  return `
<div style="font-family: 'Courier New', monospace; font-size: 8px; width: 220px; color: black; font-weight: 700; background: white; padding: 4px; border: 1px solid #000;">
  <!-- Header with Centered Logo - Table Layout -->
  <table style="width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; margin-bottom: 4px;">
    <tr>
      <td style="text-align: center; padding: 2px 0;">
        ${centerLogo ? `<img src="${centerLogo}" alt="Logo" style="width: 100px; height: auto; display: block; margin: 0 auto;">` : '<div style="font-size: 8px; font-weight: bold;">LOTTERY</div>'}
      </td>
    </tr>
    <tr>
      <td style="text-align: center; font-size: 7px; font-weight: bold; padding: 2px 0;">3D LOTTO TICKET</td>
    </tr>
  </table>

  <!-- Ticket Info Section - Table Layout -->
  <table style="width: 100%; border-collapse: collapse; font-size: 6px; margin-bottom: 4px;">
    <tr>
      <td style="text-align: left; padding: 0 0 1px 0;"><strong>Bet Date:</strong></td>
      <td style="text-align: right; padding: 0 0 1px 0;">${betDateFmt.full}</td>
    </tr>
    <tr>
      <td style="text-align: left; padding: 0 0 1px 0;"><strong>Draw Date:</strong></td>
      <td style="text-align: right; padding: 0 0 1px 0;">${fullDrawDate}</td>
    </tr>
    <tr>
      <td style="text-align: left; padding: 0 0 1px 0;"><strong>Draw ID:</strong></td>
      <td style="text-align: right; padding: 0 0 1px 0;">${drawId}</td>
    </tr>
    <tr>
      <td style="text-align: left; padding: 0 0 1px 0;"><strong>Agent:</strong></td>
      <td style="text-align: right; padding: 0 0 1px 0;">${agentId}</td>
    </tr>
    <tr>
      <td style="text-align: left; padding: 0;"><strong>Total:</strong></td>
      <td style="text-align: right; padding: 0;"><strong>${formatCurrency(totalAmount)}</strong></td>
    </tr>
  </table>

  <!-- Ticket Number -->
  <div style="text-align: center; margin: 4px 0; padding: 3px 0; border-top: 1px dashed #666; border-bottom: 1px dashed #666;">
    <div style="font-size: 9px; font-weight: bold; letter-spacing: 1px; margin-bottom: 1px;">
      ${digits}
    </div>
    <div style="font-size: 6px; font-weight: bold;">TICKET NUMBER</div>
  </div>

  <!-- Bets Section -->
  <div style="margin: 4px 0;">
    ${betsHtml}
  </div>

  <!-- QR Code Section -->
  <div style="text-align: center; margin: 4px 0; padding: 3px 0; border-top: 1px solid #000;">
    <img src="${qrUrl}" alt="QR Code" style="width: 60px; height: 60px; margin: 2px 0;" />
    <div style="font-size: 5px; margin-top: 1px;">Scan for verification</div>
  </div>

  <!-- Footer -->
  <div style="text-align: center; border-top: 1px solid #000; padding-top: 2px; margin-top: 4px;">
    <div style="font-size: 5px; margin-bottom: 1px;">${betDateFmt.full}</div>
    <div style="font-size: 7px; font-weight: bold;">GOOD LUCK! 🍀</div>
  </div>
</div>`;
}
