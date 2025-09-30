// Mobile Ticket Utilities for 58mm Thermal Printers and Web Sharing
import html2canvas from 'html2canvas';

export class MobileTicketUtils {
  
  /**
   * Debug Web Share API support and capabilities
   */
  static debugWebShareSupport() {
    const debug = {
      userAgent: navigator.userAgent,
      hasNavigatorShare: !!navigator.share,
      hasNavigatorCanShare: !!navigator.canShare,
      hasClipboard: !!navigator.clipboard,
      hasClipboardWriteText: !!(navigator.clipboard && navigator.clipboard.writeText),
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hostname: window.location.hostname
    };
    
    console.log('Web Share API Debug Info:', debug);
    return debug;
  }

  /**
   * Test Web Share API with sample data
   */
  static async testWebShare() {
    const testData = {
      title: 'Test Share',
      text: 'This is a test of the Web Share API',
      url: window.location.origin
    };

    console.log('Testing Web Share API with:', testData);
    
    try {
      if (navigator.share) {
        // Test file sharing first
        if (navigator.canShare) {
          try {
            // Create a simple test image
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'blue';
            ctx.fillRect(0, 0, 100, 100);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('TEST', 50, 50);
            
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'test.png', { type: 'image/png' });
            
            if (navigator.canShare({ files: [file] })) {
              console.log('Testing file sharing...');
              await navigator.share({
                files: [file],
                title: 'Test Image Share',
                text: 'This is a test image share'
              });
              return { success: true, method: 'web-share-file' };
            }
          } catch (fileError) {
            console.log('File sharing test failed:', fileError);
          }
        }
        
        // Test URL sharing
        if (navigator.canShare && !navigator.canShare(testData)) {
          console.error('Web Share API: canShare returned false');
          return { success: false, error: 'canShare returned false' };
        }
        
        await navigator.share(testData);
        console.log('Web Share API test successful');
        return { success: true, method: 'web-share-url' };
      } else {
        console.log('Web Share API not available');
        return { success: false, error: 'Web Share API not available' };
      }
    } catch (error) {
      console.error('Web Share API test failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  // OLD HTML GENERATION FUNCTION REMOVED
  // Now using pre-generated HTML from backend + template system

  /**
   * Get ticket image using DIRECT template generation (bypass pre-generated HTML)
   */
  static async getPreGeneratedImage(ticket) {
    try {
      console.log('🖼️ BYPASSING pre-generated HTML, using direct template generation...');
      
      // Use direct template generation for consistent layout
      const TicketGenerator = (await import('./ticketGenerator')).default;
      const TemplateAssigner = (await import('./templateAssigner')).default;
      
      let template = null;
      try {
        template = await TemplateAssigner.fetchSystemTemplate();
        console.log('✅ Template loaded:', template?.templateType || 'default');
      } catch (_) {
        console.log('⚠️ Using default template');
      }
      
      // Generate HTML directly using template system
      const templateHTML = TicketGenerator.generateWithTemplate(ticket, {}, template, {});
      console.log('✅ Template HTML generated, length:', templateHTML.length);
      
      // Wrap HTML exactly like the working preview
      const wrappedHTML = `
        <div style="width:220px;margin:0 auto;overflow:hidden;position:relative;border:1px solid #ddd;background:white;">
          <div style="width:220px;transform-origin:top left;position:relative;">${templateHTML}</div>
        </div>
      `;
      console.log('✅ HTML wrapped for image conversion');
      
      // Convert wrapped HTML to image
      return await this.convertHTMLToImage(wrappedHTML);
      
    } catch (error) {
      console.error('❌ Direct template generation failed, using fallback:', error);
      // Final fallback
      return await this.createTicketImageBlob(ticket, {});
    }
  }

  /**
   * Convert HTML string to image blob - EXACT SAME AS PREVIEW
   */
  static async convertHTMLToImage(htmlString) {
    try {
      console.log('🔍 Using EXACT same approach as working preview...');
      
      // Create container exactly like preview
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '0';
      tempContainer.style.margin = '0';
      
      // Use the wrapped HTML (already contains proper styling)
      tempContainer.innerHTML = htmlString;
      
      document.body.appendChild(tempContainer);
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Use html2canvas with minimal settings
      const canvas = await html2canvas(tempContainer, {
        backgroundColor: 'white',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // Convert canvas to blob with higher quality
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            console.log('✅ High-quality ticket image generated:', {
              size: `${blob.size} bytes`,
              dimensions: `${canvas.width}x${canvas.height}px`
            });
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        }, 'image/png', 0.95); // High quality PNG
      });
      
    } catch (error) {
      console.error('❌ Error converting HTML to image:', error);
      throw error;
    }
  }

  /**
   * Share ticket using pre-generated image (fastest & most consistent)
   */
  static async shareTicket(ticket, user) {
    // Debug Web Share API support first
    this.debugWebShareSupport();
    
    const shareData = {
      title: `Lottery Ticket #${ticket.ticketNumber}`,
      text: `Check out my lottery ticket for ${ticket.draw?.drawTime || 'upcoming'} draw!`,
      url: window.location.origin + `/ticket/${ticket.ticketNumber}`
    };

    console.log('Attempting to share ticket as image:', shareData);

    try {
      // ALWAYS try image sharing first (both mobile and desktop)
      console.log('Attempting image share...');
      
      try {
        // Use DIRECT template generation for consistent layout
        console.log('🖼️ Using DIRECT template generation for image...');
        const imageBlob = await this.getPreGeneratedImage(ticket);
        console.log('✅ Template-generated image loaded, size:', imageBlob.size, 'bytes');
        const fileName = `lottery-ticket-${ticket.ticketNumber}.png`;
        const file = new File([imageBlob], fileName, { type: 'image/png' });
        console.log('File object created:', fileName);
        
        // Try Web Share API with image first
        if (navigator.share) {
          console.log('Sharing ticket image via Web Share API');
          
          // Try image sharing without canShare check for better compatibility
          try {
            await navigator.share({
              files: [file],
              title: shareData.title,
              text: shareData.text
            });
            return { success: true, method: 'web-share-image' };
          } catch (webShareError) {
            console.log('Web Share API image sharing failed:', webShareError);
            
            // If Web Share API fails, try clipboard with image data URL
            try {
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              const img = new Image();
              
              return new Promise((resolve) => {
                img.onload = async () => {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx.drawImage(img, 0, 0);
                  
                  try {
                    // Try to copy image to clipboard (modern browsers)
                    if (navigator.clipboard && navigator.clipboard.write) {
                      const clipboardItem = new ClipboardItem({
                        'image/png': imageBlob
                      });
                      await navigator.clipboard.write([clipboardItem]);
                      resolve({ success: true, method: 'clipboard-image', message: 'Ticket image copied to clipboard!' });
                    } else {
                      // Fallback to download
                      const url = URL.createObjectURL(imageBlob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = fileName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      resolve({ success: true, method: 'download', message: 'Ticket image downloaded!' });
                    }
                  } catch (clipboardError) {
                    console.log('Clipboard image failed, downloading instead:', clipboardError);
                    // Fallback to download
                    const url = URL.createObjectURL(imageBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    resolve({ success: true, method: 'download', message: 'Ticket image downloaded!' });
                  }
                };
                
                img.onerror = () => {
                  // If image loading fails, download the blob directly
                  const url = URL.createObjectURL(imageBlob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = fileName;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  resolve({ success: true, method: 'download', message: 'Ticket image downloaded!' });
                };
                
                img.src = URL.createObjectURL(imageBlob);
              });
            } catch (fallbackError) {
              console.log('Image fallback failed:', fallbackError);
              // Direct download as final image fallback
              const url = URL.createObjectURL(imageBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              return { success: true, method: 'download', message: 'Ticket image downloaded!' };
            }
          }
        } else {
          // No Web Share API, try clipboard or download
          console.log('No Web Share API, trying clipboard or download...');
          
          try {
            // Try to copy image to clipboard (modern browsers)
            if (navigator.clipboard && navigator.clipboard.write) {
              const clipboardItem = new ClipboardItem({
                'image/png': imageBlob
              });
              await navigator.clipboard.write([clipboardItem]);
              return { success: true, method: 'clipboard-image', message: 'Ticket image copied to clipboard!' };
            }
          } catch (clipboardError) {
            console.log('Clipboard image failed:', clipboardError);
          }
          
          // Fallback to download
          const url = URL.createObjectURL(imageBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          return { success: true, method: 'download', message: 'Ticket image downloaded!' };
        }
      } catch (imageError) {
        console.error('Image generation failed completely:', imageError);
        console.error('Error details:', {
          message: imageError.message,
          stack: imageError.stack,
          name: imageError.name
        });
        
        // If image generation fails completely, fall back to text sharing
        console.log('Image generation failed, falling back to text sharing...');
        
        // Try text sharing via Web Share API
        if (navigator.share) {
          try {
            await navigator.share({
              title: shareData.title,
              text: shareData.text,
              url: shareData.url
            });
            return { success: true, method: 'web-share-text' };
          } catch (textShareError) {
            console.log('Text sharing also failed:', textShareError);
          }
        }
        
        // Final fallback - clipboard text
        if (navigator.clipboard && navigator.clipboard.writeText) {
          const clipboardText = `${shareData.title}\n\n${shareData.text}\n\n🔗 View ticket: ${shareData.url}`;
          await navigator.clipboard.writeText(clipboardText);
          return { success: true, method: 'clipboard-text', message: 'Ticket details copied to clipboard!' };
        }
        
        // Ultimate fallback - alert
        const shareText = `${shareData.title}\n\n${shareData.text}\n\n🔗 ${shareData.url}`;
        alert(`📋 Copy this text to share your ticket:\n\n${shareText}`);
        return { success: true, method: 'alert' };
      }
      
    } catch (error) {
      console.error('Share failed completely:', error);
      
      // Try clipboard fallback if everything else failed
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(
            `${shareData.title}\n${shareData.text}\n${shareData.url}`
          );
          return { success: true, method: 'clipboard-fallback' };
        }
      } catch (clipboardError) {
        console.error('Clipboard fallback also failed:', clipboardError);
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Print mobile ticket for POS systems (thermal printer integration)
   */
  static async printMobileTicket(ticket, user) {
    try {
      console.log('🖨️ Mobile POS printing...');
      
      // Check if running on Capacitor (Android/iOS native app)
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        console.log('📱 Capacitor detected - using thermal printer');
        return await this.printViaCapacitorThermalPrinter(ticket, user);
      }
      
      // Check if mobile POS printer is available
      if (this.isMobilePOSEnvironment()) {
        return await this.printViaMobilePOS(ticket, user);
      }
      
      // Check if thermal printer API is available (Android/iOS apps)
      if (window.ThermalPrinter || window.cordova?.plugins?.printer) {
        return await this.printViaThermalPrinter(ticket, user);
      }
      
      // Fallback to browser print (desktop/web)
      console.log('📄 Falling back to browser print...');
      return await this.printViaBrowser(ticket, user);
      
    } catch (error) {
      console.error('❌ Error in mobile POS printing:', error);
      // Final fallback to browser print
      return await this.printViaBrowser(ticket, user);
    }
  }

  /**
   * Print via Capacitor Thermal Printer (Android/iOS)
   */
  static async printViaCapacitorThermalPrinter(ticket, user) {
    try {
      console.log('🖨️ Printing via Capacitor thermal printer...');
      
      // Import thermal printer utility
      const thermalPrinter = (await import('./thermalPrinterUtils')).default;
      
      // Check if printer is connected
      if (!thermalPrinter.isConnected()) {
        console.warn('⚠️ Thermal printer not connected');
        // Show alert to user
        if (window.confirm('Thermal printer not connected. Connect now?')) {
          // Redirect to printer settings
          window.location.href = '/printer';
          return { success: false, error: 'Printer not connected' };
        }
        // Fallback to browser print
        return await this.printViaBrowser(ticket, user);
      }
      
      // Prepare ticket data for thermal printer
      const ticketData = {
        ticketNumber: ticket.ticketNumber,
        drawTime: ticket.drawTime,
        drawDate: ticket.drawDate,
        bets: ticket.bets || [],
        totalAmount: ticket.totalAmount,
        agentName: user?.fullName || ticket.agentName || 'Agent',
        agentCode: user?.username || ticket.agentCode || '',
        qrCode: ticket.qrCode || `${ticket.ticketNumber}|${ticket.securityHash || ''}`,
        createdAt: ticket.createdAt
      };
      
      // Print to thermal printer
      await thermalPrinter.printLotteryTicket(ticketData);
      
      console.log('✅ Ticket printed successfully via thermal printer');
      return { success: true, method: 'capacitor-thermal-printer' };
      
    } catch (error) {
      console.error('❌ Capacitor thermal printer failed:', error);
      
      // Show error to user
      alert(`Printing failed: ${error.message}\nFalling back to browser print...`);
      
      // Fallback to browser print
      return await this.printViaBrowser(ticket, user);
    }
  }

  /**
   * Check if running in mobile POS environment
   */
  static isMobilePOSEnvironment() {
    return !!(
      window.Android ||           // Android WebView
      window.webkit?.messageHandlers ||  // iOS WebView
      window.ReactNativeWebView || // React Native
      navigator.userAgent.includes('MobilePOS')
    );
  }

  /**
   * Print via mobile POS system (native app integration)
   */
  static async printViaMobilePOS(ticket, user) {
    try {
      console.log('🏪 Printing via Mobile POS system...');
      
      // Get pre-generated HTML for consistent layout
      const preGeneratedHTML = await this.getPreGeneratedHTML(ticket);
      
      // Mobile POS printing methods
      if (window.Android?.printTicket) {
        window.Android.printTicket(preGeneratedHTML, ticket.ticketNumber);
        return { success: true, method: 'android-pos' };
      }
      
      if (window.webkit?.messageHandlers?.printTicket) {
        window.webkit.messageHandlers.printTicket.postMessage({
          html: preGeneratedHTML,
          ticketNumber: ticket.ticketNumber
        });
        return { success: true, method: 'ios-pos' };
      }
      
      throw new Error('No mobile POS print method available');
      
    } catch (error) {
      console.error('❌ Mobile POS printing failed:', error);
      throw error;
    }
  }

  /**
   * Print via thermal printer (Cordova/PhoneGap plugins)
   */
  static async printViaThermalPrinter(ticket, user) {
    try {
      console.log('🖨️ Printing via thermal printer...');
      
      const preGeneratedHTML = await this.getPreGeneratedHTML(ticket);
      
      if (window.ThermalPrinter) {
        await window.ThermalPrinter.print(preGeneratedHTML);
        return { success: true, method: 'thermal-printer' };
      }
      
      if (window.cordova?.plugins?.printer) {
        await new Promise((resolve, reject) => {
          window.cordova.plugins.printer.print(preGeneratedHTML, {
            name: `Ticket-${ticket.ticketNumber}`,
            paperSize: { width: 58, height: 'auto' }
          }, resolve, reject);
        });
        return { success: true, method: 'cordova-printer' };
      }
      
      throw new Error('No thermal printer available');
      
    } catch (error) {
      console.error('❌ Thermal printer failed:', error);
      throw error;
    }
  }

  /**
   * Print via browser (fallback method)
   */
  static async printViaBrowser(ticket, user) {
    try {
      console.log('🌐 Printing via browser...');
      
      const preGeneratedHTML = await this.getPreGeneratedHTML(ticket);
      
      const printWindow = window.open('', '_blank', 'width=300,height=600');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Ticket ${ticket.ticketNumber}</title>
          <style>
            body { margin: 0; padding: 4px; font-family: Arial, sans-serif; }
            @media print { 
              body { margin: 0; padding: 0; } 
              @page { margin: 0; size: 58mm auto; }
            }
          </style>
        </head>
        <body>
          ${preGeneratedHTML}
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 1000);
              }, 500);
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      return { success: true, method: 'browser-print' };
      
    } catch (error) {
      console.error('❌ Browser printing failed:', error);
      throw error;
    }
  }

  /**
   * Get pre-generated HTML from backend
   */
  static async getPreGeneratedHTML(ticket) {
    try {
      const api = (await import('./api')).default;
      const response = await fetch(`${api.defaults.baseURL}/tickets/${ticket.id || ticket.ticketNumber}/html`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        return await response.text();
      }
      
      throw new Error('Pre-generated HTML not available');
    } catch (error) {
      console.log('Falling back to template generation...');
      // Fallback to template generation using TicketGenerator
      const TicketGenerator = (await import('./ticketGenerator')).default;
      const TemplateAssigner = (await import('./templateAssigner')).default;
      
      let template = null;
      try {
        template = await TemplateAssigner.fetchSystemTemplate();
      } catch (_) {}
      
      return TicketGenerator.generateWithTemplate(ticket, {}, template, {});
    }
  }

  /**
   * Generate ticket share URL
   */
  static generateShareURL(ticketNumber, baseURL = window.location.origin) {
    return `${baseURL}/ticket/${ticketNumber}`;
  }

  /**
   * Create ticket image as blob using HTML2Canvas for template-aware generation
   */
  static async createTicketImageBlob(ticket, user, template = null) {
    try {
      // Get the active system template if not provided
      if (!template) {
        const TemplateAssigner = (await import('./templateAssigner')).default;
        template = await TemplateAssigner.fetchSystemTemplate();
      }
      
      // Generate ticket HTML using the assigned template (58mm optimized)
      const TicketGenerator = (await import('./ticketGenerator')).default;
      const ticketHtml = TicketGenerator.generateWithTemplate(ticket, user, template, {});
      
      // Create a temporary container for the ticket HTML (58mm width)
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '-9999px';
      tempContainer.style.width = '220px'; // 58mm width
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '4px'; // Minimal padding for 58mm
      tempContainer.innerHTML = ticketHtml;
      
      document.body.appendChild(tempContainer);
      
      // Wait a moment for fonts and styles to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Use html2canvas to convert HTML to image
      let canvas;
      try {
        console.log('Using html2canvas to generate ticket image...');
        canvas = await html2canvas(tempContainer, {
          backgroundColor: 'white',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          width: 220, // 58mm width
          logging: true, // Enable logging for debugging
          onclone: (clonedDoc) => {
            // Ensure fonts are loaded in cloned document
            const clonedContainer = clonedDoc.querySelector('div');
            if (clonedContainer) {
              clonedContainer.style.fontFamily = "'Courier New', monospace";
            }
          }
        });
        console.log('html2canvas completed successfully, canvas size:', canvas.width, 'x', canvas.height);
      } catch (html2canvasError) {
        console.error('html2canvas failed:', html2canvasError);
        console.log('Falling back to manual canvas generation...');
        canvas = await this.createManualTicketCanvas(ticket, user, template);
      }
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        try {
          // html2canvas returns an HTMLCanvasElement, use toBlob method
          if (canvas && typeof canvas.toBlob === 'function') {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to convert canvas to blob'));
              }
            }, 'image/png');
          } else {
            // Fallback: convert canvas to data URL then to blob
            const dataURL = canvas.toDataURL('image/png');
            const byteString = atob(dataURL.split(',')[1]);
            const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            resolve(blob);
          }
        } catch (error) {
          reject(error);
        }
      });
      
    } catch (error) {
      console.error('Error creating ticket image blob:', error);
      // Fallback to manual canvas
      return this.createManualTicketCanvas(ticket, user, template);
    }
  }

  /**
   * Manual canvas generation as fallback
   */
  static async createManualTicketCanvas(ticket, user, template = null) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set high resolution canvas for better quality (58mm optimized)
      const scale = 2;
      canvas.width = 440; // 220 * 2 (58mm width)
      canvas.height = 1200; // Auto height based on content
      
      ctx.scale(scale, scale);
      
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);
      
      // Black border
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, (canvas.width / scale) - 2, (canvas.height / scale) - 2);
      
      // Set font
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = 'black';
      
      let y = 40;
      
      // Header - check template type
      const isUmatik = template?.design?.templateType === 'umatik' || template?.design?.templateType === 'umatik-center';
      
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isUmatik ? '🎯 UMATIK LOTTO' : '🎲 3D LOTTO', canvas.width / scale / 2, y);
      y += 30;
      
      ctx.font = 'bold 20px Arial, sans-serif';
      ctx.fillText('LOTTERY TICKET', canvas.width / scale / 2, y);
      y += 30;
      
      ctx.font = '16px Arial, sans-serif';
      ctx.fillText(`#${ticket.ticketNumber}`, canvas.width / scale / 2, y);
      y += 40;
      
      ctx.font = '16px Courier New';
      ctx.fillStyle = '#666';
      ctx.fillText(ticket.draw?.drawDate || 'No Date', canvas.width / scale / 2, y);
      y += 40;
      
      // Bets
      const bets = ticket.bets || [];
      bets.forEach((bet, index) => {
        const betType = bet.betType.charAt(0).toUpperCase() + bet.betType.slice(1);
        const sequence = String.fromCharCode(65 + index); // A, B, C, etc.
        
        ctx.font = 'bold 18px Courier New';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.fillText(betType, 20, y);
        y += 25;
        
        ctx.font = 'bold 28px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(bet.betCombination.split('').join('   '), canvas.width / scale / 2, y);
        y += 35;
        
        ctx.font = '16px Courier New';
        ctx.textAlign = 'right';
        ctx.fillText(`${sequence} - ₱${parseFloat(bet.betAmount || 0).toFixed(2)}`, (canvas.width / scale) - 20, y);
        y += 30;
      });
      
      // Total
      ctx.font = 'bold 20px Courier New';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'black';
      ctx.fillText('TOTAL AMOUNT', canvas.width / scale / 2, y);
      y += 30;
      
      ctx.font = 'bold 32px Courier New';
      ctx.fillText(`₱${parseFloat(ticket.totalAmount || 0).toFixed(2)}`, canvas.width / scale / 2, y);
      y += 50;
      
      // Agent
      ctx.font = '16px Courier New';
      ctx.fillText('AGENT', canvas.width / scale / 2, y);
      y += 25;
      
      ctx.font = 'bold 18px Courier New';
      ctx.fillText(user.fullName || user.username, canvas.width / scale / 2, y);
      y += 50;
      
      // QR Code placeholder (HTML version uses external service)
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect((canvas.width / scale / 2) - 50, y, 100, 100);
      ctx.fillStyle = 'black';
      ctx.font = '10px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('QR CODE', canvas.width / scale / 2, y + 50);
      
      // Footer
      y += 140;
      ctx.font = '14px Courier New';
      ctx.fillText('GOOD LUCK! 🍀', canvas.width / scale / 2, y);
      y += 20;
      
      ctx.font = '12px Courier New';
      ctx.fillStyle = '#666';
      ctx.fillText(new Date(ticket.createdAt).toLocaleString(), canvas.width / scale / 2, y);
      
      // Convert to blob with high quality
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create image blob'));
        }
      }, 'image/png', 1.0); // Maximum quality
    });
  }

  /**
   * Create downloadable ticket image with high quality
   */
  static async createTicketImage(ticket, user, template = null) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set high resolution canvas for better quality
    const scale = 3; // 3x resolution for crisp images
    const baseWidth = 220; // 58mm width
    const baseHeight = 400;
    
    canvas.width = baseWidth * scale;
    canvas.height = baseHeight * scale;
    
    // Scale context for high DPI
    ctx.scale(scale, scale);
    
    // White background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, baseWidth, baseHeight);
    
    // Black border
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, baseWidth - 1, baseHeight - 1);
    
    // Set font
    ctx.font = '10px Courier New';
    ctx.fillStyle = 'black';
    
    let y = 20;
    
    // Header
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('🎲 NEWBETTING', baseWidth / 2, y);
    y += 15;
    
    ctx.font = 'bold 11px Courier New';
    ctx.fillText('3D LOTTO TICKET', baseWidth / 2, y);
    y += 15;
    
    ctx.font = '9px Courier New';
    ctx.fillText(`#${ticket.ticketNumber}`, baseWidth / 2, y);
    y += 20;
    
    // Draw info
    ctx.font = 'bold 11px Courier New';
    ctx.fillText(ticket.draw?.drawTime || 'No Time', baseWidth / 2, y);
    y += 15;
    
    ctx.font = '9px Courier New';
    ctx.fillStyle = '#666';
    ctx.fillText(ticket.draw?.drawDate || 'No Date', baseWidth / 2, y);
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
      ctx.fillText(bet.betCombination.split('').join('   '), baseWidth / 2, y);
      y += 15;
      
      ctx.font = '9px Courier New';
      ctx.textAlign = 'right';
      ctx.fillText(`${sequence} - ₱${parseFloat(bet.betAmount).toFixed(2)}`, baseWidth - 10, y);
      y += 15;
    });
    
    // Total
    y += 10;
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(baseWidth - 10, y);
    ctx.stroke();
    y += 10;
    
    ctx.fillStyle = 'black';
    ctx.font = 'bold 9px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('TOTAL AMOUNT', baseWidth / 2, y);
    y += 12;
    
    ctx.font = 'bold 14px Courier New';
    ctx.fillText(`₱${parseFloat(ticket.totalAmount).toFixed(2)}`, baseWidth / 2, y);
    y += 20;
    
    // Agent
    ctx.font = '8px Courier New';
    ctx.fillStyle = '#666';
    ctx.fillText('AGENT', baseWidth / 2, y);
    y += 10;
    
    ctx.font = 'bold 10px Courier New';
    ctx.fillStyle = 'black';
    ctx.fillText(user.fullName || user.username, baseWidth / 2, y);
    y += 30;
    
    // QR Code placeholder (HTML version uses external service)
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(baseWidth / 2 - 40, y, 80, 80);
    ctx.strokeStyle = 'black';
    ctx.strokeRect(baseWidth / 2 - 40, y, 80, 80);
    
    ctx.font = '8px Courier New';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText('QR CODE', baseWidth / 2, y + 45);
    
    y += 100;
    
    // Footer
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, y);
    ctx.lineTo(baseWidth - 10, y);
    ctx.stroke();
    y += 10;
    
    ctx.font = '8px Courier New';
    ctx.fillStyle = '#666';
    ctx.fillText(new Date(ticket.createdAt).toLocaleString(), baseWidth / 2, y);
    y += 10;
    
    ctx.font = 'bold 10px Courier New';
    ctx.fillStyle = 'black';
    ctx.fillText('GOOD LUCK! 🍀', baseWidth / 2, y);
    
    return canvas.toDataURL('image/png', 1.0); // Maximum quality
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
