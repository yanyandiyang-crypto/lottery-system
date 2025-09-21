// Enhanced Mobile Ticket Utilities with Template Integration and High Quality Rendering

export class EnhancedMobileTicketUtils {
  
  /**
   * Create high-quality ticket image with template support
   */
  static async createTicketImageBlob(ticket, user, template = null) {
    try {
      // If template is provided, use template renderer
      if (template && template.design) {
        return await this.generateTemplateImage(ticket, user, template);
      }
      
      // Fallback to enhanced default rendering
      return await this.generateEnhancedDefaultImage(ticket, user);
    } catch (error) {
      console.error('Error creating ticket image:', error);
      throw error;
    }
  }

  /**
   * Generate image from custom template
   */
  static async generateTemplateImage(ticket, user, template) {
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
      
      // Generate high-quality canvas
      const canvas = await html2canvas(ticketElement, {
        scale: 3, // 3x resolution for crisp images
        useCORS: true,
        allowTaint: true,
        backgroundColor: template.design?.backgroundColor || '#ffffff',
        width: template.design?.canvasSize?.width || 400,
        height: template.design?.canvasSize?.height || 600,
        logging: false
      });
      
      // Convert to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          document.body.removeChild(container);
          resolve(blob);
        }, 'image/png', 1.0);
      });
      
    } catch (error) {
      console.error('Error generating template image:', error);
      // Fallback to enhanced default
      return await this.generateEnhancedDefaultImage(ticket, user);
    }
  }

  /**
   * Generate enhanced default high-quality image
   */
  static async generateEnhancedDefaultImage(ticket, user) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set high resolution canvas for better quality
      const scale = 3; // 3x resolution for crisp images
      canvas.width = 1200; // 400 * 3
      canvas.height = 1800; // 600 * 3
      
      // Scale context for high DPI
      ctx.scale(scale, scale);
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
      
      // Black border
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, (canvas.width / scale) - 2, (canvas.height / scale) - 2);
      
      // Set font
      ctx.font = '16px Courier New';
      ctx.fillStyle = 'black';
      
      let y = 40;
      
      // Header
      ctx.font = 'bold 24px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('🎲 NEWBETTING', canvas.width / scale / 2, y);
      y += 30;
      
      ctx.font = 'bold 20px Courier New';
      ctx.fillText('3D LOTTO TICKET', canvas.width / scale / 2, y);
      y += 30;
      
      ctx.font = '16px Courier New';
      ctx.fillText(`#${ticket.ticketNumber}`, canvas.width / scale / 2, y);
      y += 40;
      
      // Draw info
      ctx.font = 'bold 20px Courier New';
      ctx.fillText(ticket.draw?.drawTime || 'No Time', canvas.width / scale / 2, y);
      y += 30;
      
      ctx.font = '16px Courier New';
      ctx.fillStyle = '#666';
      ctx.fillText(ticket.draw?.drawDate || 'No Date', canvas.width / scale / 2, y);
      y += 40;
      
      // Bets
      const bets = ticket.bets || [];
      bets.forEach((bet, index) => {
        const betType = bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1);
        const sequence = String.fromCharCode(65 + index); // A, B, C, etc.
        
        ctx.font = 'bold 14px Courier New';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.fillText(betType, 20, y);
        y += 20;
        
        ctx.font = 'bold 18px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(bet.betCombination.split('').join('   '), canvas.width / scale / 2, y);
        y += 25;
        
        ctx.font = '12px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText(`${sequence} - ₱${parseFloat(bet.betAmount).toFixed(2)}`, (canvas.width / scale) - 20, y);
        y += 20;
      });
      
      // Total amount
      y += 20;
      ctx.font = 'bold 16px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('TOTAL AMOUNT', canvas.width / scale / 2, y);
      y += 20;
      
      ctx.font = 'bold 24px Courier New';
      ctx.fillText(`₱${parseFloat(ticket.totalAmount).toFixed(2)}`, canvas.width / scale / 2, y);
      y += 40;
      
      // Agent info
      ctx.font = '12px Courier New';
      ctx.fillText('AGENT', canvas.width / scale / 2, y);
      y += 15;
      
      ctx.font = 'bold 14px Courier New';
      ctx.fillText(user.fullName || user.username, canvas.width / scale / 2, y);
      y += 30;
      
      // QR Code placeholder
      ctx.font = '10px Courier New';
      ctx.fillText('QR CODE', canvas.width / scale / 2, y);
      y += 15;
      
      // Draw QR code placeholder
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      ctx.strokeRect((canvas.width / scale / 2) - 40, y, 80, 80);
      ctx.font = '8px Courier New';
      ctx.fillText('QR', canvas.width / scale / 2, y + 45);
      y += 100;
      
      // Footer
      ctx.font = '10px Courier New';
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
   * Share ticket using Web Share API or fallback to clipboard
   */
  static async shareTicket(ticket, user, template = null) {
    try {
      console.log('📱 Starting ticket share process...');
      
      // Generate high-quality ticket image
      const imageBlob = await this.createTicketImageBlob(ticket, user, template);
      
      // Create share data
      const shareData = {
        title: `🎲 NEWBETTING - Ticket #${ticket.ticketNumber}`,
        text: `Check out my lottery ticket!\n\nTicket: #${ticket.ticketNumber}\nDraw: ${ticket.draw?.drawTime || 'No Time'}\nTotal: ₱${parseFloat(ticket.totalAmount).toFixed(2)}\n\nGood luck! 🍀`,
        url: this.generateShareURL(ticket.ticketNumber)
      };

      // Try Web Share API first
      if ('share' in navigator) {
        try {
          // For images, we need to create a file
          const file = new File([imageBlob], `ticket-${ticket.ticketNumber}.png`, {
            type: 'image/png'
          });
          
          shareData.files = [file];
          
          await navigator.share(shareData);
          console.log('✅ Ticket shared via Web Share API');
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
          console.log('✅ Ticket info copied to clipboard');
          return { success: true, method: 'clipboard' };
        } catch (error) {
          console.log('⚠️ Clipboard failed:', error.message);
        }
      }

      // Final fallback - show share URL
      const shareUrl = this.generateShareURL(ticket.ticketNumber);
      console.log('📋 Share URL:', shareUrl);
      return { success: true, method: 'url', url: shareUrl };

    } catch (error) {
      console.error('❌ Error sharing ticket:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Download ticket as high-quality image
   */
  static async downloadTicketImage(ticket, user, template = null) {
    try {
      console.log('📥 Starting ticket download...');
      
      // Generate high-quality ticket image
      const imageBlob = await this.createTicketImageBlob(ticket, user, template);
      
      // Create download link
      const url = URL.createObjectURL(imageBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `newbetting-ticket-${ticket.ticketNumber}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      
      console.log('✅ Ticket downloaded successfully');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Error downloading ticket:', error);
      throw error;
    }
  }

  /**
   * Generate share URL for ticket
   */
  static generateShareURL(ticketNumber, baseURL = window.location.origin) {
    return `${baseURL}/ticket/${ticketNumber}`;
  }
}

export default EnhancedMobileTicketUtils;
