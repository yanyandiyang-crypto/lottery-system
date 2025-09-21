const TicketGenerator = require('./ticketGenerator');

class TemplateRenderer {
  /**
   * Generate ticket HTML from template design
   * @param {Object} ticket - Ticket data
   * @param {Object} template - Template design
   * @param {Object} user - User data
   * @returns {String} HTML string
   */
  static async generateTicketHTML(ticket, template, user) {
    try {
      const design = template.design || {};
      const elements = design.elements || [];
      const canvasSize = design.canvasSize || { width: 400, height: 600 };
      const backgroundColor = design.backgroundColor || '#ffffff';
      const templateType = design.templateType || 'standard';

      // Generate dynamic data for template
      const dynamicData = await this.generateDynamicData(ticket, user);

      // Create HTML structure
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ticket #${ticket.ticketNumber}</title>
          <style>
            ${this.generateCSS(templateType)}
          </style>
        </head>
        <body>
          <div class="ticket-container ${templateType}" style="width: ${canvasSize.width}px; height: ${canvasSize.height}px; background-color: ${backgroundColor};">
      `;

      // Render elements
      elements.forEach(element => {
        html += this.renderElement(element, dynamicData);
      });

      html += `
          </div>
        </body>
        </html>
      `;

      return html;
    } catch (error) {
      console.error('Error generating ticket HTML:', error);
      throw error;
    }
  }

  /**
   * Generate dynamic data for template
   */
  static async generateDynamicData(ticket, user) {
    const bets = ticket.bets || [];
    const draw = ticket.draw || {};
    
    // Format bet details
    const allBetsDetail = bets.map((bet, index) => {
      const sequence = String.fromCharCode(65 + index);
      const betType = bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1);
      const numbers = bet.betCombination.split('').join('    ');
      return `${betType.padEnd(20)}${numbers}\n${sequence.padEnd(20)}Price: ₱${parseFloat(bet.betAmount).toFixed(2)}`;
    }).join('\n\n');

    // Generate QR code URL - use simple ticket number for QR
    const qrCodeData = ticket.qrCode || ticket.ticketNumber;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrCodeData)}&size=100x100`;

    return {
      ticketNumber: ticket.ticketNumber,
      drawTime: draw.drawTime || '14:00',
      drawDate: draw.drawDate ? new Date(draw.drawDate).toLocaleDateString('en-CA') + ' ' + new Date(draw.drawDate).toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + (draw.drawTime || '14:00') : 'No Date',
      betNumbers: bets.map(bet => bet.betCombination).join(', '),
      betType: bets[0]?.betType || 'Standard',
      betAmount: bets[0]?.betAmount || '0.00',
      totalBet: `₱${parseFloat(ticket.totalAmount).toFixed(2)}`,
      agentName: user.fullName || user.username,
      timestamp: new Date(ticket.createdAt).toLocaleString(),
      qrCode: qrCodeUrl,
      barcode: `|||${ticket.ticketNumber}|||`,
      betCount: bets.length.toString(),
      allBets: allBetsDetail,
      // Individual bet details
      bet1Type: bets[0]?.betType || '',
      bet1Numbers: bets[0]?.betCombination.split('').join('    ') || '',
      bet1Sequence: 'A',
      bet1Price: `Price: ₱${parseFloat(bets[0]?.betAmount || 0).toFixed(2)}`,
      bet2Type: bets[1]?.betType || '',
      bet2Numbers: bets[1]?.betCombination.split('').join('    ') || '',
      bet2Sequence: 'B',
      bet2Price: `Price: ₱${parseFloat(bets[1]?.betAmount || 0).toFixed(2)}`,
      bet3Type: bets[2]?.betType || '',
      bet3Numbers: bets[2]?.betCombination.split('').join('    ') || '',
      bet3Sequence: 'C',
      bet3Price: `Price: ₱${parseFloat(bets[2]?.betAmount || 0).toFixed(2)}`,
      bet4Type: bets[3]?.betType || '',
      bet4Numbers: bets[3]?.betCombination.split('').join('    ') || '',
      bet4Sequence: 'D',
      bet4Price: `Price: ₱${parseFloat(bets[3]?.betAmount || 0).toFixed(2)}`,
      bet5Type: bets[4]?.betType || '',
      bet5Numbers: bets[4]?.betCombination.split('').join('    ') || '',
      bet5Sequence: 'E',
      bet5Price: `Price: ₱${parseFloat(bets[4]?.betAmount || 0).toFixed(2)}`,
      bet6Type: bets[5]?.betType || '',
      bet6Numbers: bets[5]?.betCombination.split('').join('    ') || '',
      bet6Sequence: 'F',
      bet6Price: `Price: ₱${parseFloat(bets[5]?.betAmount || 0).toFixed(2)}`,
      bet7Type: bets[6]?.betType || '',
      bet7Numbers: bets[6]?.betCombination.split('').join('    ') || '',
      bet7Sequence: 'G',
      bet7Price: `Price: ₱${parseFloat(bets[6]?.betAmount || 0).toFixed(2)}`,
      bet8Type: bets[7]?.betType || '',
      bet8Numbers: bets[7]?.betCombination.split('').join('    ') || '',
      bet8Sequence: 'H',
      bet8Price: `Price: ₱${parseFloat(bets[7]?.betAmount || 0).toFixed(2)}`,
      bet9Type: bets[8]?.betType || '',
      bet9Numbers: bets[8]?.betCombination.split('').join('    ') || '',
      bet9Sequence: 'I',
      bet9Price: `Price: ₱${parseFloat(bets[8]?.betAmount || 0).toFixed(2)}`,
      bet10Type: bets[9]?.betType || '',
      bet10Numbers: bets[9]?.betCombination.split('').join('    ') || '',
      bet10Sequence: 'J',
      bet10Price: `Price: ₱${parseFloat(bets[9]?.betAmount || 0).toFixed(2)}`
    };
  }

  /**
   * Render individual element
   */
  static renderElement(element, dynamicData) {
    const { type, x, y, width, height, style, content, fieldId, label, src, alt, shapeType, zIndex } = element;
    
    const elementStyle = this.generateElementStyle(style, x, y, width, height, zIndex);
    let elementContent = '';

    switch (type) {
      case 'text':
        elementContent = content || '';
        break;
      case 'dynamic':
        elementContent = dynamicData[fieldId] || content || '';
        break;
      case 'image':
        if (src) {
          elementContent = `<img src="${src}" alt="${alt || ''}" style="width: 100%; height: 100%; object-fit: cover;" />`;
        } else {
          elementContent = `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #f0f0f0; color: #666;">No Image</div>`;
        }
        break;
      case 'shape':
        const shapeStyle = shapeType === 'circle' ? 'border-radius: 50%;' : '';
        elementContent = `<div style="width: 100%; height: 100%; ${shapeStyle}"></div>`;
        break;
      default:
        elementContent = content || '';
    }

    return `
      <div class="ticket-element" style="${elementStyle}">
        ${elementContent}
      </div>
    `;
  }

  /**
   * Generate element CSS style
   */
  static generateElementStyle(style, x, y, width, height, zIndex) {
    const cssStyle = {
      position: 'absolute',
      left: `${x}px`,
      top: `${y}px`,
      width: `${width}px`,
      height: `${height}px`,
      zIndex: zIndex || 1,
      fontSize: style.fontSize || '12px',
      fontFamily: style.fontFamily || 'Arial',
      color: style.color || '#000000',
      fontWeight: style.fontWeight || 'normal',
      textAlign: style.textAlign || 'left',
      letterSpacing: style.letterSpacing || '0px',
      backgroundColor: style.backgroundColor || 'transparent',
      border: style.border || 'none',
      borderRadius: style.borderRadius || '0px',
      padding: style.padding || '0px',
      lineHeight: style.lineHeight || 'normal',
      display: 'flex',
      alignItems: 'center',
      justifyContent: style.textAlign === 'center' ? 'center' : 'flex-start',
      overflow: 'hidden'
    };

    return Object.entries(cssStyle)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');
  }

  /**
   * Generate CSS for template
   */
  static generateCSS(templateType) {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: Arial, sans-serif;
        background: #f5f5f5;
        padding: 20px;
      }

      .ticket-container {
        position: relative;
        margin: 0 auto;
        border: 2px solid #000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        overflow: hidden;
      }

      .ticket-container.mobile {
        width: 220px !important;
        height: 340px !important;
      }

      .ticket-element {
        position: absolute;
        overflow: hidden;
      }

      .ticket-element img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* Print styles */
      @media print {
        body {
          background: white;
          padding: 0;
        }
        
        .ticket-container {
          box-shadow: none;
          border: 1px solid #000;
        }
      }

      /* High DPI support */
      @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
        .ticket-container {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
      }
    `;
  }

  /**
   * Generate high-quality ticket image from template
   * @param {Object} ticket - Ticket data
   * @param {Object} template - Template design
   * @param {Object} user - User data
   * @param {Number} scale - Scale factor for high DPI (default: 2)
   * @returns {Promise<Blob>} Image blob
   */
  static async generateTicketImage(ticket, template, user, scale = 2) {
    try {
      const html = await this.generateTicketHTML(ticket, template, user);
      
      // Create a temporary iframe to render HTML
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '800px';
      iframe.style.height = '1200px';
      document.body.appendChild(iframe);

      return new Promise((resolve, reject) => {
        iframe.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const design = template.design || {};
            const canvasSize = design.canvasSize || { width: 400, height: 600 };
            
            // Set high resolution canvas
            canvas.width = canvasSize.width * scale;
            canvas.height = canvasSize.height * scale;
            
            // Scale context for high DPI
            ctx.scale(scale, scale);
            
            // Use html2canvas for better rendering
            const html2canvas = (await import('html2canvas')).default;
            const ticketElement = iframe.contentDocument.querySelector('.ticket-container');
            
            if (ticketElement) {
              const canvasResult = await html2canvas(ticketElement, {
                scale: scale,
                useCORS: true,
                allowTaint: true,
                backgroundColor: design.backgroundColor || '#ffffff',
                width: canvasSize.width,
                height: canvasSize.height
              });
              
              canvasResult.toBlob((blob) => {
                document.body.removeChild(iframe);
                resolve(blob);
              }, 'image/png', 1.0);
            } else {
              throw new Error('Ticket element not found');
            }
          } catch (error) {
            document.body.removeChild(iframe);
            reject(error);
          }
        };

        iframe.srcdoc = html;
      });
    } catch (error) {
      console.error('Error generating ticket image:', error);
      throw error;
    }
  }
}

module.exports = TemplateRenderer;
