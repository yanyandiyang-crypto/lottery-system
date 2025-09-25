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

  const qrData = `T:${ticket?.ticketNumber}\nA:${totalAmount}\nD:${betDateFmt.full}`;
  const qrUrl = getQuickChartQrUrl(qrData);

  // Single centered logo – allow override via assets.logoDataUrl
  // Default file renamed so you can place your own logo without using umatik.png
  const centerLogo = assets.logoDataUrl || '/logos/pisting-logo.png';

  const betsHtml = bets.map((bet, index) => {
    const letter = String.fromCharCode(65 + index);
    const betTypeLabel = bet?.betType === 'Rambolito' ? 'Rambolito 6' : (bet?.betType || 'Standard');
    const combo = (bet?.betCombination || bet?.combi || '').toString();
    const spacedCombo = combo.split('').join(' ');
    const amount = Number(bet?.betAmount || bet?.amount || 0);
    return (
      `\n               <div style="margin-bottom: 2px; border-bottom: 1px solid #ddd; padding: 4px 0px 4px 4px; width: 100%; box-sizing: border-box; background-color: #f9f9f9; min-height: 22px;">\n                    <div style=\"display: flex; justify-content: space-between; align-items: center; width: 100%; position: relative;\">\n                        <div class=\"bet-type\" style=\"font-weight: 700; font-size: 24px; letter-spacing: 0px; font-family: Arial, sans-serif;\">${betTypeLabel}</div>\n                        <div class=\"bet-combi\" style=\"font-weight: 700; font-size: 26px; letter-spacing: 10px; font-family: Arial, sans-serif; position: absolute; right: 8px; top: 0px;\">${spacedCombo}</div>\n                    </div>\n               </div>\n               <div style=\"margin-top: -8px; margin-bottom: 4px; border-bottom: 1px solid #ddd; padding: 0px 0px 4px 4px; width: 100%; box-sizing: border-box; background-color: #f9f9f9; min-height: 20px;\">\n                    <div style=\"display: flex; justify-content: space-between; align-items: center; width: 100%; position: relative;\">\n                        <div class=\"bet-letter\" style=\"font-size: 15px; font-weight: 700; font-family: Arial, sans-serif;\">${letter}</div>\n                        <div class=\"bet-price\" style=\"font-size: 20px; font-weight: 700; letter-spacing: 0px; font-family: Arial, sans-serif; position: absolute; right: 8px; top: -6px; margin: 0;\">Price:${formatCurrency(amount).replace('₱', 'P')}</div>\n                    </div>\n                </div>`
    );
  }).join('');

  const digits = String(ticket?.ticketNumber || '').padStart(17, '0').split('').map(d => `<span style=\"font-size: 33px; font-weight: 700; letter-spacing: 16px;\">${d}</span>`).join('');

  // Dynamic height similar to umatik
  const baseHeight = 200;
  const betHeight = 100;
  const betsSectionHeight = 60;
  const bottomPadding = 80;
  const dynamicHeight = baseHeight + betsSectionHeight + (bets.length * betHeight) + bottomPadding;

  return `
<div style="font-family: Arial, sans-serif; font-size: 17px; width: 600px; height: ${dynamicHeight}px; color: black; font-weight: 800;">
  <div style="display: flex; justify-content: center; align-items: center; padding-bottom: 4px;">
    ${centerLogo ? `<img src="${centerLogo}" alt="Logo" style="width: 230px; height: auto; z-index: 10; margin-bottom: 8px;">` : ''}
  </div>
  <div style="display: flex; justify-content: space-between; margin-bottom: 8px; margin-top: 4px;">
    <div style="width: 50%;">
      <p class="ticket-text" style="margin: 10px 0 8px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif;">Bet Date:</p>
      <p class="ticket-text" style="margin: 8px 0 8px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif;">${betDateFmt.full}</p>
      <p class="ticket-text" style="margin: 8px 0 8px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif;">Draw Date:</p>
      <p class="ticket-text" style="margin: 8px 0 8px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif;">${fullDrawDate}</p>
      <p class="ticket-text" style="margin: 8px 0 8px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif;">Draw ID: ${drawId}</p>
      <p class="ticket-text" style="margin: 8px 0 8px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif; white-space: nowrap;">Agent ID: ${agentId}</p>
      <p class="ticket-text" style="margin: 8px 0 20px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif;">Ticket Price: ${formatCurrency(totalAmount)}</p>
    </div>
    <div style="width: 45%; display: flex; align-items: flex-start; justify-content: center;">
      <div id="qrcode-container" style="width: 270px; height: 270px; position: relative; z-index: 1;">
        <img src="${qrUrl}" alt="QR Code" style="width: 270px; height: 270px;" />
      </div>
    </div>
  </div>
  <div style="display: flex; justify-content: center; align-items: center; width: 100%; margin: 8px 0; gap: 0px;">
    ${digits}
  </div>
  <p class="ticket-number" style="text-align: center; font-size: 20px; margin: 2px 0 16px 0; letter-spacing: 0px; font-weight: 700; font-family: Arial, sans-serif; display: block; width: 100%;">Ticket Number</p>
  ${betsHtml}
  <div style="margin: 12px 0; height: 12px;"></div>
</div>`;
}


