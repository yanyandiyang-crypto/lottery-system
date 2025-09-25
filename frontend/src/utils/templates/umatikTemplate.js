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

  const qrData = `T:${ticket?.ticketNumber}\nA:${totalAmount}\nD:${betDateFmt.full}`;
  const qrUrl = getQuickChartQrUrl(qrData);

  const logo3d = assets.logo3dDataUrl || '/logos/3d-lotto.png';
  const logoUmatik = assets.logoUmatikDataUrl || '/logos/umatik.png';

  const betsHtml = bets.map((bet, index) => {
    const letter = String.fromCharCode(65 + index);
    const betTypeLabel = bet?.betType === 'Rambolito' ? 'Rambolito 6' : (bet?.betType || 'Standard');
    const combo = (bet?.betCombination || bet?.combi || '').toString();
    const spacedCombo = combo.split('').join(' ');
    const amount = Number(bet?.betAmount || bet?.amount || 0);
    return (
      `\n               <div style="margin-bottom: 4px; border-bottom: 1px solid #ddd; padding: 6px 0px 6px 4px; width: 100%; box-sizing: border-box; background-color: #f9f9f9; min-height: 25px;">\n                    <div style=\"display: flex; justify-content: space-between; align-items: center; width: 100%; position: relative;\">\n                        <div class=\"bet-type\" style=\"font-weight: 700; font-size: 28px; letter-spacing: 0px; font-family: Arial, sans-serif;\">${betTypeLabel}</div>\n                        <div class=\"bet-combi\" style=\"font-weight: 700; font-size: 30px; letter-spacing: 16px; font-family: Arial, sans-serif; position: absolute; right: 8px; top: 0px;\">${spacedCombo}</div>\n                    </div>\n               </div>\n               <div style=\"margin-bottom: 6px; border-bottom: 1px solid #ddd; padding: 6px 0px 6px 4px; width: 100%; box-sizing: border-box; background-color: #f9f9f9; min-height: 25px;\">\n                    <div style=\"display: flex; justify-content: space-between; align-items: center; width: 100%; position: relative;\">\n                        <div class=\"bet-letter\" style=\"font-size: 25px; font-weight: 700; font-family: Arial, sans-serif;\">${letter}</div>\n                        <div class=\"bet-letter\" style=\"font-size: 30px; font-weight: 700; letter-spacing: 0px; font-family: Arial, sans-serif; position: absolute; right: 25px; top: 0px; margin-top: 27px; margin-bottom: 8px;\">Price:${formatCurrency(amount).replace('₱', 'P')}</div>\n                    </div>\n                </div>`
    );
  }).join('');

  const digits = String(ticket?.ticketNumber || '').padStart(17, '0').split('').map(d => `<span style="font-size: 33px; font-weight: 700; letter-spacing: 16px;">${d}</span>`).join('');

  // Calculate dynamic height based on number of bets
  const baseHeight = 200; // Base height for ticket without bets (increased for better fit)
  const betHeight = 100; // Height per bet (increased to accommodate 2 rows + margins + padding)
  const betsSectionHeight = 60; // Additional height for bets section spacing
  const bottomPadding = 80; // Bottom padding to ensure content is not cut off
  const dynamicHeight = baseHeight + betsSectionHeight + (bets.length * betHeight) + bottomPadding;

  return `\n<div style=\"font-family: Arial, sans-serif; font-size: 17px; width: 600px; height: ${dynamicHeight}px; color: black; font-weight: 800;\">\n  <div style=\"display: flex; justify-content: space-between; align-items: center; padding-bottom: 0px;\">\n    ${logo3d ? `<img src=\"${logo3d}\" alt=\"3D Lotto Logo\" style=\"width: 170px; height: auto; z-index: 10;\">` : ''}\n    ${logoUmatik ? `<img src=\"${logoUmatik}\" alt=\"Lotto Umatik Logo\" style=\"width: 265px; height: auto; position: relative; left: -25px; top: 5px; z-index: 10;\">` : ''}\n  </div>\n  <div style=\"display: flex; justify-content: space-between; margin-bottom: 8px; margin-top: 4px;\">\n    <div style=\"width: 50%;\">\n      <p class=\"ticket-text\" style=\"margin: 10px 0 8px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif; margin-left: 0px; margin-top: 0px;\">Bet Date:</p>\n      <p class=\"ticket-text\" style=\"margin: 8px 0 8px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif; margin-left: 0px; margin-top: 0px;\">${betDateFmt.full}</p>\n      <p class=\"ticket-text\" style=\"margin: 8px 0 8px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif; margin-left: 0px; margin-top: 0px;\">Draw Date:</p>\n      <p class=\"ticket-text\" style=\"margin: 8px 0 8px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif; margin-left: 0px; margin-top: 0px;\">${fullDrawDate}</p>\n      <p class=\"ticket-text\" style=\"margin: 8px 0 8px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif; margin-left: 0px; margin-top: 0px;\">Draw ID: ${drawId}</p>\n      <p class=\"ticket-text\" style=\"margin: 8px 0 8px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif; margin-left: 0px; margin-top: 0px; white-space: nowrap;\">Agent ID: ${agentId}</p>\n      <p class=\"ticket-text\" style=\"margin: 8px 0 20px 0; text-align: left; font-weight: 700; font-size: 18px; font-family: Arial, sans-serif; margin-left: 0px; margin-top: 0px;\">Ticket Price: ${formatCurrency(totalAmount)}</p>\n    </div>\n    <div style=\"width: 45%; display: flex; align-items: flex-start; justify-content: center;\">\n      <div id=\"qrcode-container\" style=\"width: 270px; height: 270px; position: relative; z-index: 1; margin-left: -30px;\">\n        <img src=\"${qrUrl}\" alt=\"QR Code\" style=\"width: 270px; height: 270px;\" />\n      </div>\n    </div>\n  </div>\n  <div style=\"display: flex; justify-content: center; align-items: center; width: 100%; margin: 8px 0 8px 0; gap: 0px;\">\n    ${digits}\n  </div>\n  <div style=\"margin: 4px 0;\"></div>\n  <p class=\"ticket-number\" style=\"text-align: center; font-size: 20px; margin: 2px 0 20px 0; letter-spacing: 0px; font-weight: 700; font-family: Arial, sans-serif; display: block; width: 100%;\">Ticket Number</p>\n  <div style=\"margin: 4px 0;\"></div>\n  <div style=\"position: relative; margin-bottom: 6px;\">\n    <div class=\"signature-box\" style=\"width: 590px; height: 90px; margin: 0 0 2px 0; position: relative; box-sizing: border-box; border: 1px solid #000; background: #fff;\"></div>\n  </div>\n  <p class=\"signature\" style=\"text-align: center; line-height: 1; margin: -6px 0 3px 0; font-size: 20px; font-weight: 700; font-family: Arial, sans-serif; display: block; width: 100%;\">Signature</p>\n  <div style=\"margin: 12px 0;\"></div>\n  ${betsHtml}\n  <div style=\"margin: 12px 0; height: 12px;\"></div>\n</div>`;
}


