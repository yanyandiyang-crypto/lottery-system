// Mobile Ticket Utilities for 58mm Thermal Printers and Web Sharing

export class MobileTicketUtils {
  
  /**
   * Generate mobile-optimized ticket HTML for 58mm thermal printers
   */
  static generateMobileTicketHTML(ticket, user) {
    const formatDrawTimeForTicket = (drawTime) => {
      if (!drawTime) return 'No Time';
      const timeMap = {
        '14:00': '2:00 PM',
        '17:00': '5:00 PM', 
        '21:00': '9:00 PM'
      };
      return timeMap[drawTime] || drawTime;
    };

    const formatCurrency = (amount) => {
      return `₱${parseFloat(amount || 0).toFixed(2)}`;
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'No Date';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-CA') + ' ' + date.toLocaleDateString('en-US', { weekday: 'short' });
    };

    const bets = ticket.bets || [];
    const betListHtml = bets.map((bet, index) => {
      const betType = bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1);
      const sequence = String.fromCharCode(65 + index);
      return `
        <div class="bet-item">
          <div class="bet-type">${betType}</div>
          <div class="bet-combination">${bet.betCombination.split('').join('   ')}</div>
          <div class="bet-sequence">${sequence} - ${formatCurrency(bet.betAmount)}</div>
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mobile Lottery Ticket</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            background: white;
            padding: 10px;
          }
          
          .mobile-ticket {
            width: 100%;
            max-width: 58mm;
            min-width: 200px;
            background: white;
            border: 2px solid #000;
            padding: 8px;
            font-size: 10px;
            line-height: 1.2;
            margin: 0 auto;
          }
          
          .ticket-header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
            margin-bottom: 4px;
          }
          
          .logo {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 2px;
          }
          
          .ticket-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 2px;
          }
          
          .ticket-number {
            font-size: 9px;
            font-weight: bold;
          }
          
          .draw-info {
            text-align: center;
            margin: 4px 0;
            padding: 2px 0;
            border-bottom: 1px dashed #666;
          }
          
          .draw-time {
            font-weight: bold;
            font-size: 11px;
          }
          
          .draw-date {
            font-size: 9px;
            color: #666;
          }
          
          .bet-info {
            margin: 4px 0;
          }
          
          .bet-item {
            margin: 3px 0;
            padding: 2px 0;
            border-bottom: 1px dotted #ccc;
          }
          
          .bet-type {
            font-weight: bold;
            font-size: 10px;
          }
          
          .bet-combination {
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 2px;
            text-align: center;
            margin: 2px 0;
          }
          
          .bet-sequence {
            font-size: 9px;
            text-align: right;
          }
          
          .total-section {
            text-align: center;
            margin: 6px 0;
            padding: 4px 0;
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
          }
          
          .total-label {
            font-size: 9px;
            font-weight: bold;
          }
          
          .total-amount {
            font-size: 14px;
            font-weight: bold;
          }
          
          .agent-info {
            text-align: center;
            margin: 4px 0;
            padding: 2px 0;
          }
          
          .agent-label {
            font-size: 8px;
            color: #666;
          }
          
          .agent-name {
            font-size: 10px;
            font-weight: bold;
          }
          
          .qr-section {
            text-align: center;
            margin: 6px 0;
            padding: 4px 0;
          }
          
          .qr-code {
            width: 80px;
            height: 80px;
            margin: 0 auto;
          }
          
          .ticket-footer {
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 4px;
            margin-top: 4px;
          }
          
          .timestamp {
            font-size: 8px;
            color: #666;
            margin-bottom: 2px;
          }
          
          .good-luck {
            font-size: 10px;
            font-weight: bold;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .mobile-ticket {
              border: 1px solid #000;
            }
          }
          
          @media (max-width: 480px) {
            .mobile-ticket {
              max-width: 100%;
              min-width: 180px;
            }
          }
        </style>
      </head>
      <body>
        <div class="mobile-ticket">
          <!-- Header -->
          <div class="ticket-header">
            <div class="logo">🎲 NEWBETTING</div>
            <div class="ticket-title">3D LOTTO TICKET</div>
            <div class="ticket-number">#${ticket.ticketNumber}</div>
          </div>

          <!-- Draw Information -->
          <div class="draw-info">
            <div class="draw-time">${formatDrawTimeForTicket(ticket.draw?.drawTime)}</div>
            <div class="draw-date">${formatDate(ticket.draw?.drawDate)}</div>
          </div>

          <!-- Bet Information -->
          <div class="bet-info">
            ${betListHtml}
          </div>

          <!-- Total Amount -->
          <div class="total-section">
            <div class="total-label">TOTAL AMOUNT</div>
            <div class="total-amount">${formatCurrency(ticket.totalAmount)}</div>
          </div>

          <!-- Agent Information -->
          <div class="agent-info">
            <div class="agent-label">AGENT</div>
            <div class="agent-name">${user.fullName || user.username}</div>
          </div>

          <!-- QR Code -->
          <div class="qr-section">
            <img src="${ticket.qrCode}" alt="QR Code" class="qr-code" />
          </div>

          <!-- Footer -->
          <div class="ticket-footer">
            <div class="timestamp">${new Date(ticket.createdAt).toLocaleString()}</div>
            <div class="good-luck">GOOD LUCK! 🍀</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Share ticket via Web Share API or fallback methods
   */
  static async shareTicket(ticket, user) {
    const shareData = {
      title: `Lottery Ticket #${ticket.ticketNumber}`,
      text: `Check out my lottery ticket for ${ticket.draw?.drawTime || 'upcoming'} draw!`,
      url: window.location.origin + `/ticket/${ticket.ticketNumber}`
    };

    try {
      // Try Web Share API first (mobile browsers)
      if (navigator.share) {
        await navigator.share(shareData);
        return { success: true, method: 'web-share' };
      }
      
      // Fallback to clipboard
      await navigator.clipboard.writeText(
        `${shareData.title}\n${shareData.text}\n${shareData.url}`
      );
      return { success: true, method: 'clipboard' };
      
    } catch (error) {
      console.error('Share failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Print mobile ticket optimized for 58mm thermal printers
   */
  static printMobileTicket(ticket, user) {
    const ticketHTML = this.generateMobileTicketHTML(ticket, user);
    
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    printWindow.document.write(ticketHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        setTimeout(() => printWindow.close(), 1000);
      }, 500);
    };
  }

  /**
   * Generate ticket share URL
   */
  static generateShareURL(ticketNumber, baseURL = window.location.origin) {
    return `${baseURL}/ticket/${ticketNumber}`;
  }

  /**
   * Create downloadable ticket image
   */
  static async createTicketImage(ticket, user) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size for 58mm width (approximately 220px at 96 DPI)
    canvas.width = 220;
    canvas.height = 400;
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Black border
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    
    // Set font
    ctx.font = '10px Courier New';
    ctx.fillStyle = 'black';
    
    let y = 20;
    
    // Header
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('🎲 NEWBETTING', canvas.width / 2, y);
    y += 15;
    
    ctx.font = 'bold 11px Courier New';
    ctx.fillText('3D LOTTO TICKET', canvas.width / 2, y);
    y += 15;
    
    ctx.font = '9px Courier New';
    ctx.fillText(`#${ticket.ticketNumber}`, canvas.width / 2, y);
    y += 20;
    
    // Draw info
    ctx.font = 'bold 11px Courier New';
    ctx.fillText(ticket.draw?.drawTime || 'No Time', canvas.width / 2, y);
    y += 15;
    
    ctx.font = '9px Courier New';
    ctx.fillStyle = '#666';
    ctx.fillText(ticket.draw?.drawDate || 'No Date', canvas.width / 2, y);
    y += 20;
    
    // Bets
    const bets = ticket.bets || [];
    bets.forEach((bet, index) => {
      const betType = bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1);
      const sequence = String.fromCharCode(65 + index);
      
      ctx.fillStyle = 'black';
      ctx.font = 'bold 10px Courier New';
      ctx.textAlign = 'left';
      ctx.fillText(betType, 10, y);
      y += 12;
      
      ctx.font = 'bold 14px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(bet.betCombination.split('').join('   '), canvas.width / 2, y);
      y += 15;
      
      ctx.font = '9px Courier New';
      ctx.textAlign = 'right';
      ctx.fillText(`${sequence} - ₱${parseFloat(bet.betAmount).toFixed(2)}`, canvas.width - 10, y);
      y += 15;
    });
    
    // Total
    y += 10;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(canvas.width - 10, y);
    ctx.stroke();
    y += 10;
    
    ctx.fillStyle = 'black';
    ctx.font = 'bold 9px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('TOTAL AMOUNT', canvas.width / 2, y);
    y += 12;
    
    ctx.font = 'bold 14px Courier New';
    ctx.fillText(`₱${parseFloat(ticket.totalAmount).toFixed(2)}`, canvas.width / 2, y);
    y += 20;
    
    // Agent
    ctx.font = '8px Courier New';
    ctx.fillStyle = '#666';
    ctx.fillText('AGENT', canvas.width / 2, y);
    y += 10;
    
    ctx.font = 'bold 10px Courier New';
    ctx.fillStyle = 'black';
    ctx.fillText(user.fullName || user.username, canvas.width / 2, y);
    y += 30;
    
    // QR Code placeholder
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(canvas.width / 2 - 40, y, 80, 80);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(canvas.width / 2 - 40, y, 80, 80);
    
    ctx.font = '8px Courier New';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText('QR CODE', canvas.width / 2, y + 45);
    
    y += 100;
    
    // Footer
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(canvas.width - 10, y);
    ctx.stroke();
    y += 10;
    
    ctx.font = '8px Courier New';
    ctx.fillStyle = '#666';
    ctx.fillText(new Date(ticket.createdAt).toLocaleString(), canvas.width / 2, y);
    y += 10;
    
    ctx.font = 'bold 10px Courier New';
    ctx.fillStyle = 'black';
    ctx.fillText('GOOD LUCK! 🍀', canvas.width / 2, y);
    
    return canvas.toDataURL('image/png');
  }

  /**
   * Download ticket as image
   */
  static async downloadTicketImage(ticket, user) {
    const imageDataURL = await this.createTicketImage(ticket, user);
    
    const link = document.createElement('a');
    link.download = `ticket-${ticket.ticketNumber}.png`;
    link.href = imageDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default MobileTicketUtils;
