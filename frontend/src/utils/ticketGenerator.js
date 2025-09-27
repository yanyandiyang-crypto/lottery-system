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
    
    return `<div class="ticket" style="width: 220px; margin: 0 auto; background: #fff; font-family: 'Courier New', monospace; font-size: 8px; padding: 4px; border: 1px solid #000;">
<!-- Header -->
<div class="header" style="text-align: center; border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px;">
<div style="font-size: 10px; font-weight: bold; margin-bottom: 1px;">🎲 3D LOTTO</div>
<div style="font-size: 7px; font-weight: bold;">LOTTERY TICKET</div>
</div>

<!-- Ticket Info Section -->
<div class="info-section" style="font-size: 7px; margin-bottom: 6px; line-height: 1.2;">
<div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
<span><strong>Bet Date:</strong></span>
<span>${formattedBetDate}</span>
</div>
<div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
<span><strong>Bet Time:</strong></span>
<span>${formattedBetTime}</span>
</div>
<div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
<span><strong>Draw Date:</strong></span>
<span>${formattedDrawDate}</span>
</div>
<div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
<span><strong>Draw Time:</strong></span>
<span>${formattedDrawTime}</span>
</div>
<div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
<span><strong>Draw ID:</strong></span>
<span>${formattedDrawId}</span>
</div>
<div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
<span><strong>Agent:</strong></span>
<span>${user?.username || 'testagent1'}</span>
</div>
<div style="display: flex; justify-content: space-between; margin-bottom: 1px;">
<span><strong>Total:</strong></span>
<span><strong>₱${parseFloat(ticket.totalAmount).toFixed(2)}</strong></span>
</div>
</div>

<!-- Ticket Number -->
<div class="ticket-number-section" style="text-align: center; margin: 6px 0; padding: 4px 0; border-top: 1px dashed #666; border-bottom: 1px dashed #666;">
<div style="font-size: 10px; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px;">
${ticket.ticketNumber.split('').join(' ')}
</div>
<div style="font-size: 7px; font-weight: bold;">TICKET NUMBER</div>
</div>

<!-- Bets Section -->
<div class="bets-section" style="margin: 6px 0;">
${bets.map((bet, index) => {
  const sequence = String.fromCharCode(65 + index); // A, B, C, etc.
  return `<div class="bet-item" style="border-bottom: 1px dotted #ccc; padding: 2px 0; margin-bottom: 2px;">
<div style="display: flex; justify-content: space-between; align-items: center;">
<div style="font-size: 7px; font-weight: bold;">${bet.betType || 'Standard'}</div>
<div style="font-size: 7px;">${sequence}</div>
</div>
<div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1px;">
<div style="font-size: 12px; font-weight: bold; letter-spacing: 2px;">${bet.betCombination || '215'}</div>
<div style="font-size: 8px; font-weight: bold;">₱${parseFloat(bet.betAmount || ticket.totalAmount).toFixed(2)}</div>
</div>
</div>`;
}).join('')}
</div>

<!-- QR Code Section -->
<div class="qr-section" style="text-align: center; margin: 6px 0; padding: 4px 0; border-top: 1px solid #000;">
<img src="${qrCodeUrl}" alt="QR Code" style="width: 60px; height: 60px; margin: 2px 0;" />
<div style="font-size: 6px; margin-top: 2px;">Scan for verification</div>
</div>

<!-- Signature Section -->
${signatureImage ? `<div class="signature-section" style="text-align: center; margin: 4px 0; border-top: 1px dashed #666; padding-top: 4px;">
<div style="border: 1px solid #000; height: 20px; margin: 2px 0; display: flex; align-items: center; justify-content: center;">
<img src="${signatureImage}" alt="Signature" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
</div>
<div style="font-size: 6px; font-weight: bold;">SIGNATURE</div>
</div>` : ''}

<!-- Footer -->
<div class="footer" style="text-align: center; border-top: 1px solid #000; padding-top: 2px; margin-top: 4px;">
<div style="font-size: 6px; margin-bottom: 1px;">${new Date(ticket.createdAt || Date.now()).toLocaleString()}</div>
<div style="font-size: 8px; font-weight: bold;">GOOD LUCK! 🍀</div>
</div>
</div>`;
  }

  static async printTicket(ticket, user) {
    try {
      // Fetch system-wide active template
      const TemplateAssigner = (await import('./templateAssigner')).default;
      const template = await TemplateAssigner.fetchSystemTemplate();
      
      // Generate ticket HTML using the assigned template (58mm optimized)
      const ticketHtml = this.generateWithTemplate(ticket, user, template, {});
      
      const fullHtml = `<!DOCTYPE html>
<html>
<head>
<title>Ticket ${ticket.ticketNumber}</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
/* 58mm Thermal Printer Optimized Styles */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
  font-family: 'Courier New', monospace; 
  margin: 0; 
  padding: 2px; 
  background: #fff; 
  font-size: 8px;
  width: 58mm;
  max-width: 220px;
}
@media print {
  body { margin: 0; padding: 0; }
  @page { 
    size: 58mm auto; 
    margin: 0; 
  }
}
</style>
</head>
<body>
${ticketHtml}
</body>
</html>`;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(fullHtml);
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
    } catch (error) {
      console.error('Error printing ticket with template:', error);
      // Fallback to default template
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
}

export default TicketGenerator;
