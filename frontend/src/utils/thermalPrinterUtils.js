/**
 * Thermal Printer Utilities - Stub version for non-Capacitor webview apps
 * Capacitor thermal printer removed - use Android WebView JavaScript interface instead
 */

class ThermalPrinterUtils {
  constructor() {
    this.printer = null;
    this.connected = false;
    this.printerPlugin = null;
  }

  // Initialize the printer plugin (no-op without Capacitor)
  async initializePlugin() {
    console.log('Thermal printer requires Android WebView interface');
    return;
  }

  // Check if running on native platform (always false)
  isNative() {
    return false;
  }

  // Scan for available Bluetooth printers
  async scanPrinters() {
    if (!this.isNative() || !this.printerPlugin) {
      throw new Error('Thermal printer only available on native platforms');
    }

    try {
      const result = await this.printerPlugin.listPrinters();
      console.log('Available printers:', result.printers);
      return result.printers || [];
    } catch (error) {
      console.error('Error scanning printers:', error);
      throw error;
    }
  }

  // Connect to a printer
  async connect(printerAddress) {
    if (!this.isNative() || !this.printerPlugin) {
      throw new Error('Thermal printer only available on native platforms');
    }

    try {
      await this.printerPlugin.connect({ address: printerAddress });
      this.connected = true;
      this.printer = printerAddress;
      console.log('Connected to printer:', printerAddress);
      return true;
    } catch (error) {
      console.error('Error connecting to printer:', error);
      this.connected = false;
      throw error;
    }
  }

  // Disconnect from printer
  async disconnect() {
    if (!this.isNative() || !this.printerPlugin) {
      return;
    }

    try {
      await this.printerPlugin.disconnect();
      this.connected = false;
      this.printer = null;
      console.log('Disconnected from printer');
    } catch (error) {
      console.error('Error disconnecting printer:', error);
    }
  }

  // Print text
  async printText(text, options = {}) {
    if (!this.connected) {
      throw new Error('Printer not connected');
    }

    const {
      align = 'left',  // left, center, right
      bold = false,
      size = 'normal', // small, normal, large
      underline = false
    } = options;

    try {
      await this.printerPlugin.printText({
        text,
        align,
        bold,
        size,
        underline
      });
    } catch (error) {
      console.error('Error printing text:', error);
      throw error;
    }
  }

  // Print line separator
  async printLine(char = '-', length = 32) {
    await this.printText(char.repeat(length), { align: 'center' });
  }

  // Print lottery ticket
  async printLotteryTicket(ticketData) {
    if (!this.connected) {
      throw new Error('Printer not connected. Please connect to a printer first.');
    }

    try {
      // Header
      await this.printText('PISTING YAWA LOTTERY', { align: 'center', bold: true, size: 'large' });
      await this.printText('3D Lotto System', { align: 'center' });
      await this.printLine('=', 32);
      
      // Ticket Number
      await this.printText(`Ticket #: ${ticketData.ticketNumber}`, { bold: true });
      await this.printText(`Date: ${new Date(ticketData.createdAt).toLocaleString('en-PH')}`, {});
      await this.printLine('-', 32);
      
      // Draw Information
      await this.printText(`Draw: ${ticketData.drawTime}`, {});
      await this.printText(`Draw Date: ${new Date(ticketData.drawDate).toLocaleDateString('en-PH')}`, {});
      await this.printLine('-', 32);
      
      // Bets
      await this.printText('BETS:', { bold: true });
      for (const bet of ticketData.bets) {
        const betLine = `${bet.combination} - ${bet.type.toUpperCase()} - P${bet.amount}`;
        await this.printText(betLine, {});
      }
      await this.printLine('-', 32);
      
      // Total
      await this.printText(`TOTAL: P${ticketData.totalAmount}`, { bold: true, size: 'large', align: 'right' });
      await this.printLine('=', 32);
      
      // Agent Info
      await this.printText(`Agent: ${ticketData.agentName}`, { size: 'small' });
      if (ticketData.agentCode) {
        await this.printText(`Code: ${ticketData.agentCode}`, { size: 'small' });
      }
      await this.printLine('-', 32);
      
      // QR Code (if supported)
      if (ticketData.qrCode) {
        await this.printQRCode(ticketData.qrCode);
      }
      
      // Footer
      await this.printText('Thank you!', { align: 'center' });
      await this.printText('Good Luck!', { align: 'center', bold: true });
      await this.printLine('=', 32);
      
      // Feed paper
      await this.feedPaper(3);
      
      // Cut paper (if supported)
      await this.cutPaper();
      
      console.log('Ticket printed successfully');
      return true;
    } catch (error) {
      console.error('Error printing lottery ticket:', error);
      throw error;
    }
  }

  // Print QR Code
  async printQRCode(data, size = 6) {
    if (!this.connected || !this.printerPlugin) {
      throw new Error('Printer not connected');
    }

    try {
      await this.printerPlugin.printQRCode({
        data,
        size,
        align: 'center'
      });
    } catch (error) {
      console.error('Error printing QR code:', error);
      // QR code might not be supported, continue without it
    }
  }

  // Feed paper
  async feedPaper(lines = 1) {
    if (!this.connected || !this.printerPlugin) {
      return;
    }

    try {
      await this.printerPlugin.feedPaper({ lines });
    } catch (error) {
      console.error('Error feeding paper:', error);
    }
  }

  // Cut paper
  async cutPaper() {
    if (!this.connected || !this.printerPlugin) {
      return;
    }

    try {
      await this.printerPlugin.cutPaper();
    } catch (error) {
      console.error('Error cutting paper:', error);
      // Paper cut might not be supported, continue without it
    }
  }

  // Print test page
  async printTestPage() {
    if (!this.connected) {
      throw new Error('Printer not connected');
    }

    try {
      await this.printText('PRINTER TEST', { align: 'center', bold: true, size: 'large' });
      await this.printLine('=', 32);
      await this.printText('Normal Text', {});
      await this.printText('Bold Text', { bold: true });
      await this.printText('Large Text', { size: 'large' });
      await this.printText('Small Text', { size: 'small' });
      await this.printLine('-', 32);
      await this.printText('Left Aligned', { align: 'left' });
      await this.printText('Center Aligned', { align: 'center' });
      await this.printText('Right Aligned', { align: 'right' });
      await this.printLine('=', 32);
      await this.printText('Test Successful!', { align: 'center', bold: true });
      await this.feedPaper(3);
      await this.cutPaper();
      
      console.log('Test page printed successfully');
      return true;
    } catch (error) {
      console.error('Error printing test page:', error);
      throw error;
    }
  }

  // Get printer status
  isConnected() {
    return this.connected;
  }

  // Get connected printer address
  getConnectedPrinter() {
    return this.printer;
  }
}

// Export singleton instance
const thermalPrinter = new ThermalPrinterUtils();
export default thermalPrinter;
