// Shared ticket generation utility for consistent ticket formatting
import TemplateAssigner from './templateAssigner';

class TicketGenerator {
  static generateWithTemplate(ticket, user, template, assets) {
    try {
      const renderer = TemplateAssigner.getTemplateRenderer(template);
      // Ensure logos resolve in new windows and across domains by using absolute URLs when possible
      let resolvedAssets = assets || {};
      try {
        const origin = typeof window !== 'undefined' && window.location && window.location.origin ? window.location.origin : '';
        if (origin) {
          resolvedAssets = {
            logoDataUrl: resolvedAssets.logoDataUrl || `${origin}/logos/pisting-logo.png`,
            logo3dDataUrl: resolvedAssets.logo3dDataUrl || `${origin}/logos/3d-lotto.png`,
            logoUmatikDataUrl: resolvedAssets.logoUmatikDataUrl || `${origin}/logos/umatik.png`,
          };
        }
      } catch (_) {}
      return renderer(ticket, user, resolvedAssets);
    } catch (e) {
      console.warn('Template generation failed, using default:', e);
      return this.generateTicketHTML(ticket, user);
    }
  }
  static generateQRCode(text) {
    // Using quickchart.io QR code generation service
    const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(text)}&size=100`;
    return qrUrl;
  }

  static generateTicketHTML(ticket, user) {
    const bets = ticket.bets || [];
    const qrCodeData = `Ticket: ${ticket.ticketNumber}\nAmount: ₱${parseFloat(ticket.totalAmount).toFixed(2)}\nDate: ${new Date(ticket.createdAt || Date.now()).toLocaleDateString()}`;
    const qrCodeUrl = this.generateQRCode(qrCodeData);
    
    // Optional signature image support (Data URL or URL)
    const signatureImage = ticket.signatureImage || user?.signatureImage || user?.signatureUrl || null;
    
    const betDate = new Date(ticket.createdAt || Date.now());
    const drawDate = new Date(ticket.draw?.drawDate || betDate.toISOString().split('T')[0]);
    
    // Format dates with day of week
    const formatDateWithDay = (date) => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dayName = days[date.getDay()];
      return `${year}/${month}/${day} ${dayName}`;
    };
    
    // Format time to 24-hour format
    const formatTime24 = (date) => {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    };
    
    // Format draw time (14:00, 17:00, 21:00)
    const formatDrawTime = (drawTime) => {
      if (drawTime === 'twoPM') return '14:00';
      if (drawTime === 'fivePM') return '17:00';
      if (drawTime === 'ninePM') return '21:00';
      return drawTime || '17:00';
    };
    
    const formattedBetDate = formatDateWithDay(betDate);
    const formattedBetTime = formatTime24(betDate);
    const formattedDrawDate = formatDateWithDay(drawDate);
    const formattedDrawTime = formatDrawTime(ticket.draw?.drawTime);
    
    // Format Draw ID as S000001 sequence
    const formatDrawId = (drawId) => {
      if (!drawId) return 'S000001';
      if (typeof drawId === 'number') {
        return `S${String(drawId).padStart(6, '0')}`;
      }
      if (typeof drawId === 'string' && drawId.startsWith('S')) {
        return drawId;
      }
      return `S${String(drawId).padStart(6, '0')}`;
    };
    
    const formattedDrawId = formatDrawId(ticket.drawId);
    
    return `<div class="ticket" style="border: 2px solid #000; padding: 8px; max-width: 250px; margin: 0 auto; background: #fff; font-family: Arial, sans-serif; font-size: 10px;">
<div class="header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
<div class="logo-left" style="font-size: 12px; font-weight: bold; color: #000;">3D LOTTO</div>
<div class="logo-right" style="font-size: 8px; font-weight: bold; text-align: right;">LOTTO MATIK</div>
</div>
<div class="clearfix" style="overflow: hidden;">
<div class="qr-section" style="float: right; margin-left: 10px;">
<img src="${qrCodeUrl}" alt="QR Code" style="width: 40px; height: 40px;" />
</div>
<div class="info-section" style="font-size: 9px; margin-bottom: 8px;">
<div><strong>Bet Date:</strong><br>${formattedBetDate} ${formattedBetTime}</div>
<div><strong>Draw Date:</strong><br>${formattedDrawDate} ${formattedDrawTime}</div>
<div><strong>Draw ID:</strong> ${formattedDrawId}</div>
<div><strong>Agent ID:</strong> ${user?.username || 'testagent1'}</div>
<div><strong>Ticket Price:</strong> ₱${parseFloat(ticket.totalAmount).toFixed(2)}</div>
</div>
</div>
<div class="ticket-number-large" style="font-size: 14px; font-weight: bold; text-align: center; letter-spacing: 2px; margin: 8px 0;">
${ticket.ticketNumber.split('').join(' ')}
</div>
<div class="ticket-number-label" style="text-align: center; font-size: 10px; margin-bottom: 15px;">
<strong>Ticket Number</strong>
</div>
<div class="signature-box" style="border: 1px solid #000; height: 30px; margin: 10px 0; display: flex; align-items: center; justify-content: center;">
${signatureImage ? `<img src="${signatureImage}" alt="Signature" style="max-width: 100%; max-height: 100%; object-fit: contain;" />` : ''}
</div>
<div class="signature-label" style="text-align: center; font-size: 9px; margin-bottom: 5px;"><strong>Signature</strong></div>
${bets.map(bet => `<div class="bet-section" style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
<div class="bet-type" style="font-size: 12px; font-weight: bold;">${bet.betType || 'Standard'}<br>${bet.betCombination?.charAt(0) || 'A'}</div>
<div class="bet-numbers" style="font-size: 16px; font-weight: bold; text-align: center;">${bet.betCombination || '215'}</div>
<div class="bet-price" style="font-size: 12px; font-weight: bold;">Price:₱${parseFloat(bet.betAmount || ticket.totalAmount).toFixed(2)}</div>
</div>`).join('')}
</div>`;
  }

  static printTicket(ticket, user) {
    const ticketHtml = `<!DOCTYPE html>
<html>
<head>
<title>Ticket ${ticket.ticketNumber}</title>
<style>
body { font-family: Arial, sans-serif; margin: 0; padding: 10px; background: #fff; font-size: 10px; }
.ticket { border: 2px solid #000; padding: 8px; max-width: 250px; margin: 0 auto; background: #fff; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.logo-left { font-size: 24px; font-weight: bold; color: #000; }
.logo-right { font-size: 12px; font-weight: bold; text-align: right; }
.info-section { font-size: 9px; margin-bottom: 8px; }
.qr-section { float: right; margin-left: 10px; }
.ticket-number-large { font-size: 14px; font-weight: bold; text-align: center; letter-spacing: 2px; margin: 8px 0; }
.ticket-number-label { text-align: center; font-size: 10px; margin-bottom: 15px; }
.signature-box { border: 1px solid #000; height: 30px; margin: 10px 0; }
.signature-label { text-align: center; font-size: 9px; margin-bottom: 5px; }
.bet-section { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
.bet-type { font-size: 12px; font-weight: bold; }
.bet-numbers { font-size: 16px; font-weight: bold; text-align: center; }
.bet-price { font-size: 12px; font-weight: bold; }
.clearfix::after { content: ""; display: table; clear: both; }
</style>
</head>
<body>
${this.generateTicketHTML(ticket, user)}
</body>
</html>`;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(ticketHtml);
    printWindow.document.close();
    // Wait for the new window and its images (e.g., signature) to load before printing
    const triggerPrintWhenReady = () => {
      try {
        const images = Array.from(printWindow.document.images || []);
        if (images.length === 0) {
          printWindow.print();
          return;
        }
        let loadedCount = 0;
        const onImgDone = () => {
          loadedCount += 1;
          if (loadedCount >= images.length) {
            printWindow.print();
          }
        };
        images.forEach((img) => {
          if (img.complete) {
            onImgDone();
          } else {
            img.addEventListener('load', onImgDone, { once: true });
            img.addEventListener('error', onImgDone, { once: true });
          }
        });
        // Fallback timeout in case some images never resolve
        setTimeout(() => {
          try { printWindow.print(); } catch (_) { /* noop */ }
        }, 1500);
      } catch (_) {
        // As a fallback, attempt to print immediately
        try { printWindow.print(); } catch (__) { /* noop */ }
      }
    };
    if (printWindow.document.readyState === 'complete') {
      triggerPrintWhenReady();
    } else {
      printWindow.addEventListener('load', triggerPrintWhenReady, { once: true });
    }
  }
}

export default TicketGenerator;
