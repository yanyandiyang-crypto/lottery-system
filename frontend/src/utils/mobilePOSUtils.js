// Mobile POS Utilities - Enhanced for Thermal Printer Integration

export class MobilePOSUtils {
  
  /**
   * Generate ESC/POS commands for thermal printers
   */
  static generateESCPOSCommands(ticket, template = null) {
    const commands = [];
    
    // Initialize printer
    commands.push('\x1B\x40'); // ESC @ - Initialize printer
    
    // Set alignment center
    commands.push('\x1B\x61\x01'); // ESC a 1 - Center alignment
    
    // Print header
    commands.push('\x1B\x21\x30'); // ESC ! 0 - Normal text
    commands.push('🎲 NEWBETTING\n');
    commands.push('\x1B\x21\x08'); // ESC ! 8 - Double height
    commands.push('3D LOTTO TICKET\n');
    commands.push('\x1B\x21\x00'); // ESC ! 0 - Normal text
    commands.push(`#${ticket.ticketNumber}\n`);
    
    // Draw line
    commands.push('========================\n');
    
    // Draw info
    commands.push(`Draw: ${ticket.draw?.drawTime || 'No Time'}\n`);
    commands.push(`Date: ${ticket.draw?.drawDate || 'No Date'}\n`);
    commands.push('------------------------\n');
    
    // Bets
    const bets = ticket.bets || [];
    bets.forEach((bet, index) => {
      const sequence = String.fromCharCode(65 + index);
      const betType = bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1);
      
      commands.push(`${betType}\n`);
      commands.push(`\x1B\x21\x10`); // ESC ! 16 - Double width
      commands.push(`${bet.betCombination.split('').join('   ')}\n`);
      commands.push(`\x1B\x21\x00`); // ESC ! 0 - Normal text
      commands.push(`${sequence} - ₱${parseFloat(bet.betAmount).toFixed(2)}\n`);
    });
    
    // Total
    commands.push('========================\n');
    commands.push('\x1B\x21\x08'); // ESC ! 8 - Double height
    commands.push(`TOTAL: ₱${parseFloat(ticket.totalAmount).toFixed(2)}\n`);
    commands.push('\x1B\x21\x00'); // ESC ! 0 - Normal text
    
    // Agent info
    commands.push('------------------------\n');
    commands.push(`Agent: ${ticket.user?.fullName || ticket.user?.username}\n`);
    
    // QR Code placeholder
    commands.push('------------------------\n');
    commands.push('[QR CODE]\n');
    commands.push('------------------------\n');
    
    // Footer
    commands.push('GOOD LUCK! 🍀\n');
    commands.push(`${new Date(ticket.createdAt).toLocaleString()}\n`);
    
    // Cut paper
    commands.push('\n\n\n'); // Feed paper
    commands.push('\x1D\x56\x00'); // GS V 0 - Full cut
    
    return commands.join('');
  }

  /**
   * Generate high-quality mobile ticket for POS printing
   */
  static async generateMobilePOSTicket(ticket, user, template = null) {
    try {
      // If template is provided, use template renderer
      if (template && template.design) {
        return await this.generateTemplateMobileTicket(ticket, user, template);
      }
      
      // Generate optimized mobile ticket
      return await this.generateOptimizedMobileTicket(ticket, user);
    } catch (error) {
      console.error('Error generating mobile POS ticket:', error);
      throw error;
    }
  }

  /**
   * Generate template-based mobile ticket
   */
  static async generateTemplateMobileTicket(ticket, user, template) {
    try {
      // Use html2canvas for high-quality rendering
      const html2canvas = (await import('html2canvas')).default;
      
      // Create temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);
      
      // Generate HTML from template
      const response = await fetch('/api/ticket-templates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ticketId: ticket.id,
          templateId: template.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate template HTML');
      }
      
      const data = await response.json();
      container.innerHTML = data.data.html;
      
      // Wait for images to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const ticketElement = container.querySelector('.ticket-container');
      if (!ticketElement) {
        throw new Error('Ticket element not found');
      }
      
      // Generate high-quality canvas optimized for mobile POS
      const canvas = await html2canvas(ticketElement, {
        scale: 4, // 4x resolution for crisp mobile POS printing
        useCORS: true,
        allowTaint: true,
        backgroundColor: template.design?.backgroundColor || '#ffffff',
        width: template.design?.canvasSize?.width || 220,
        height: template.design?.canvasSize?.height || 340,
        logging: false,
        // Mobile POS specific options
        foreignObjectRendering: true,
        imageTimeout: 5000
      });
      
      // Convert to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          document.body.removeChild(container);
          resolve(blob);
        }, 'image/png', 1.0);
      });
      
    } catch (error) {
      console.error('Error generating template mobile ticket:', error);
      // Fallback to optimized mobile ticket
      return await this.generateOptimizedMobileTicket(ticket, user);
    }
  }

  /**
   * Generate optimized mobile ticket for POS
   */
  static async generateOptimizedMobileTicket(ticket, user) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set high resolution canvas for mobile POS
      const scale = 4; // 4x resolution for crisp mobile POS printing
      canvas.width = 880; // 220 * 4 (58mm width)
      canvas.height = 1360; // 340 * 4
      
      // Scale context for high DPI
      ctx.scale(scale, scale);
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
      
      // Black border
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, (canvas.width / scale) - 2, (canvas.height / scale) - 2);
      
      let y = 20;
      
      // Header with blue background
      ctx.fillStyle = '#1e40af';
      ctx.fillRect(0, 0, canvas.width / scale, 40);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('🎲 NEWBETTING', canvas.width / scale / 2, 15);
      
      ctx.font = 'bold 11px Courier New';
      ctx.fillText('3D LOTTO TICKET', canvas.width / scale / 2, 30);
      
      y = 50;
      
      // Ticket number
      ctx.fillStyle = 'black';
      ctx.font = 'bold 9px Courier New';
      ctx.fillText(`#${ticket.ticketNumber}`, canvas.width / scale / 2, y);
      y += 20;
      
      // Draw info with yellow background
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(10, y - 5, (canvas.width / scale) - 20, 25);
      
      ctx.fillStyle = '#92400e';
      ctx.font = 'bold 11px Courier New';
      ctx.fillText(ticket.draw?.drawTime || 'No Time', canvas.width / scale / 2, y + 5);
      
      ctx.font = '9px Courier New';
      ctx.fillText(ticket.draw?.drawDate || 'No Date', canvas.width / scale / 2, y + 15);
      y += 35;
      
      // Bets section
      const bets = ticket.bets || [];
      bets.forEach((bet, index) => {
        const betType = bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1);
        const sequence = String.fromCharCode(65 + index);
        
        ctx.fillStyle = 'black';
        ctx.font = 'bold 10px Courier New';
        ctx.textAlign = 'left';
        ctx.fillText(betType, 15, y);
        y += 15;
        
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(bet.betCombination.split('').join('   '), canvas.width / scale / 2, y);
        y += 20;
        
        ctx.font = '10px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText(`${sequence} - ₱${parseFloat(bet.betAmount).toFixed(2)}`, (canvas.width / scale) - 15, y);
        y += 20;
      });
      
      // Total section with dark background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(10, y, (canvas.width / scale) - 20, 30);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('TOTAL AMOUNT', canvas.width / scale / 2, y + 10);
      
      ctx.font = 'bold 16px Courier New';
      ctx.fillText(`₱${parseFloat(ticket.totalAmount).toFixed(2)}`, canvas.width / scale / 2, y + 25);
      y += 40;
      
      // Agent info
      ctx.fillStyle = 'black';
      ctx.font = '9px Courier New';
      ctx.fillText('AGENT', canvas.width / scale / 2, y);
      y += 10;
      
      ctx.font = 'bold 11px Courier New';
      ctx.fillText(user.fullName || user.username, canvas.width / scale / 2, y);
      y += 25;
      
      // QR Code section
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeRect((canvas.width / scale / 2) - 40, y, 80, 80);
      
      ctx.font = '8px Courier New';
      ctx.fillText('QR CODE', canvas.width / scale / 2, y + 45);
      y += 100;
      
      // Footer
      ctx.font = 'bold 10px Courier New';
      ctx.fillText('GOOD LUCK! 🍀', canvas.width / scale / 2, y);
      y += 15;
      
      ctx.font = '8px Courier New';
      ctx.fillStyle = '#666';
      ctx.fillText(new Date(ticket.createdAt).toLocaleString(), canvas.width / scale / 2, y);
      
      // Convert to blob
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png', 1.0);
    });
  }

  /**
   * Print mobile ticket via POS printer
   */
  static async printMobilePOSTicket(ticket, user, template = null) {
    try {
      console.log('🖨️ Starting mobile POS ticket print...');
      
      // Generate ticket image
      const imageBlob = await this.generateMobilePOSTicket(ticket, user, template);
      
      // Create print window optimized for mobile POS
      const printWindow = window.open('', '_blank', 'width=300,height=600');
      
      if (!printWindow) {
        throw new Error('Failed to open print window. Please allow popups.');
      }
      
      // Create optimized print HTML for mobile POS
      const printHTML = this.generateMobilePOSPrintHTML(ticket, user, imageBlob);
      
      // Write content to print window
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      // Wait for content to load
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      };
      
      console.log('✅ Mobile POS print dialog opened');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error printing mobile POS ticket:', error);
      throw error;
    }
  }

  /**
   * Generate mobile POS print HTML
   */
  static generateMobilePOSPrintHTML(ticket, user, imageBlob) {
    const imageUrl = URL.createObjectURL(imageBlob);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Mobile POS Ticket - #${ticket.ticketNumber}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Courier New', monospace;
            background: white;
            padding: 0;
            margin: 0;
          }
          
          .mobile-pos-ticket {
            width: 58mm;
            max-width: 58mm;
            margin: 0 auto;
            background: white;
            border: none;
            padding: 0;
          }
          
          .ticket-image {
            width: 100%;
            height: auto;
            display: block;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
            
            .mobile-pos-ticket {
              width: 58mm !important;
              max-width: 58mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            .ticket-image {
              width: 58mm !important;
              height: auto !important;
            }
            
            @page {
              size: 58mm auto;
              margin: 0;
            }
          }
          
          /* Mobile POS specific optimizations */
          @media screen and (max-width: 480px) {
            .mobile-pos-ticket {
              width: 100%;
              max-width: 220px;
            }
          }
        </style>
      </head>
      <body>
        <div class="mobile-pos-ticket">
          <img src="${imageUrl}" alt="Mobile POS Ticket" class="ticket-image" />
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Share mobile POS ticket
   */
  static async shareMobilePOSTicket(ticket, user, template = null) {
    try {
      console.log('📱 Starting mobile POS ticket share...');
      
      // Generate high-quality ticket image
      const imageBlob = await this.generateMobilePOSTicket(ticket, user, template);
      
      // Create share data
      const shareData = {
        title: `🎲 NEWBETTING - Mobile POS Ticket #${ticket.ticketNumber}`,
        text: `Mobile POS Lottery Ticket!\n\nTicket: #${ticket.ticketNumber}\nDraw: ${ticket.draw?.drawTime || 'No Time'}\nTotal: ₱${parseFloat(ticket.totalAmount).toFixed(2)}\n\nOptimized for mobile POS! 🖨️`,
        url: this.generateMobilePOSShareURL(ticket.ticketNumber)
      };

      // Try Web Share API first
      if ('share' in navigator) {
        try {
          // For images, we need to create a file
          const file = new File([imageBlob], `mobile-pos-ticket-${ticket.ticketNumber}.png`, {
            type: 'image/png'
          });
          
          shareData.files = [file];
          
          await navigator.share(shareData);
          console.log('✅ Mobile POS ticket shared via Web Share API');
          return { success: true, method: 'web-share' };
        } catch (error) {
          console.log('⚠️ Web Share failed, trying fallback:', error.message);
        }
      }

      // Fallback to clipboard
      if ('clipboard' in navigator) {
        try {
          // Copy text to clipboard
          await navigator.clipboard.writeText(shareData.text + '\n\n' + shareData.url);
          console.log('✅ Mobile POS ticket info copied to clipboard');
          return { success: true, method: 'clipboard' };
        } catch (error) {
          console.log('⚠️ Clipboard failed:', error.message);
        }
      }

      // Final fallback - show share URL
      const shareUrl = this.generateMobilePOSShareURL(ticket.ticketNumber);
      console.log('📋 Mobile POS Share URL:', shareUrl);
      return { success: true, method: 'url', url: shareUrl };

    } catch (error) {
      console.error('❌ Error sharing mobile POS ticket:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate mobile POS share URL
   */
  static generateMobilePOSShareURL(ticketNumber, baseURL = window.location.origin) {
    return `${baseURL}/mobile-pos/ticket/${ticketNumber}`;
  }

  /**
   * Download mobile POS ticket as high-quality image
   */
  static async downloadMobilePOSTicket(ticket, user, template = null) {
    try {
      console.log('📥 Starting mobile POS ticket download...');
      
      // Generate high-quality ticket image
      const imageBlob = await this.generateMobilePOSTicket(ticket, user, template);
      
      // Create download link
      const url = URL.createObjectURL(imageBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mobile-pos-ticket-${ticket.ticketNumber}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('✅ Mobile POS ticket downloaded successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error downloading mobile POS ticket:', error);
      throw error;
    }
  }
}

export default MobilePOSUtils;
