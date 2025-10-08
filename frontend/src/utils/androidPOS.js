/**
 * Android POS Manager
 * 
 * Manages communication between React app and Android native POS functions
 * Handles printing, Bluetooth, and other hardware integrations
 */

class AndroidPOSManager {
  constructor() {
    this.isInitialized = false;
    this.printQueue = [];
    this.isProcessingQueue = false;
  }

  /**
   * Check if AndroidPOS interface is available
   */
  static isAvailable() {
    return typeof window.AndroidPOS !== 'undefined' || 
           typeof window.AndroidApp !== 'undefined';
  }

  /**
   * Check if running in Android WebView
   */
  static isWebView() {
    const ua = navigator.userAgent.toLowerCase();
    return (
      /wv/.test(ua) ||
      ua.indexOf('android') > -1 && ua.indexOf('version/') > -1
    );
  }

  /**
   * Get device information
   */
  static getDeviceInfo() {
    if (!this.isAvailable()) {
      return {
        available: false,
        isWebView: this.isWebView(),
        userAgent: navigator.userAgent
      };
    }

    try {
      // Try to get info from AndroidPOS
      if (window.AndroidPOS.getDeviceInfo) {
        const infoJson = window.AndroidPOS.getDeviceInfo();
        return JSON.parse(infoJson);
      }
    } catch (error) {
      console.warn('Could not get device info:', error);
    }

    return {
      available: true,
      isWebView: this.isWebView(),
      userAgent: navigator.userAgent,
      hasAndroidPOS: typeof window.AndroidPOS !== 'undefined',
      methods: window.AndroidPOS ? Object.keys(window.AndroidPOS) : []
    };
  }

  /**
   * Initialize POS connection
   */
  static async initialize() {
    if (!this.isAvailable()) {
      console.warn('AndroidPOS not available');
      return { success: false, error: 'AndroidPOS not available' };
    }

    try {
      if (window.AndroidPOS.initialize) {
        await window.AndroidPOS.initialize();
      }
      
      console.log('✅ AndroidPOS initialized');
      return { success: true };
    } catch (error) {
      console.error('AndroidPOS initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Connect to POS/Printer
   */
  static async connect() {
    if (!this.isAvailable()) {
      return { success: false, error: 'AndroidPOS not available' };
    }

    try {
      if (window.AndroidPOS.connectPOS) {
        window.AndroidPOS.connectPOS();
        
        // Wait a bit and check connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const isConnected = this.isConnected();
        return { 
          success: isConnected,
          message: isConnected ? 'Connected to printer' : 'Connection failed'
        };
      }
      
      return { success: false, error: 'connectPOS method not available' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if printer is connected
   */
  static isConnected() {
    if (!this.isAvailable()) return false;

    try {
      if (window.AndroidPOS.isConnected) {
        return window.AndroidPOS.isConnected();
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }

    return false;
  }

  /**
   * Get printer status
   */
  static getStatus() {
    if (!this.isAvailable()) {
      return 'AndroidPOS not available';
    }

    try {
      if (window.AndroidPOS.getStatus) {
        return window.AndroidPOS.getStatus();
      }
    } catch (error) {
      console.error('Error getting status:', error);
    }

    return 'Unknown';
  }

  /**
   * Print text receipt
   */
  static async printReceipt(text) {
    if (!this.isAvailable()) {
      return { success: false, error: 'AndroidPOS not available' };
    }

    if (!this.isConnected()) {
      return { success: false, error: 'Printer not connected' };
    }

    try {
      window.AndroidPOS.printReceipt(text);
      console.log('✅ Print command sent');
      return { success: true };
    } catch (error) {
      console.error('Print failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Print image (base64)
   */
  static async printImage(base64Image) {
    if (!this.isAvailable()) {
      return { success: false, error: 'AndroidPOS not available' };
    }

    if (!this.isConnected()) {
      return { success: false, error: 'Printer not connected' };
    }

    try {
      if (!window.AndroidPOS.printImage) {
        return { 
          success: false, 
          error: 'printImage method not available. Update your Android app.' 
        };
      }

      window.AndroidPOS.printImage(base64Image);
      console.log('✅ Image print command sent');
      return { success: true };
    } catch (error) {
      console.error('Image print failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Print lottery ticket (formatted)
   */
  static async printTicket(ticket, user) {
    if (!this.isAvailable()) {
      return { 
        success: false, 
        error: 'AndroidPOS not available',
        fallback: 'browser'
      };
    }

    if (!this.isConnected()) {
      return { 
        success: false, 
        error: 'Printer not connected. Please connect first.',
        fallback: 'connect_first'
      };
    }

    try {
      // Format ticket for thermal printer (58mm width)
      const ticketText = this.formatTicketForPrinting(ticket, user);
      
      // Send to printer
      const result = await this.printReceipt(ticketText);
      
      if (result.success) {
        console.log('✅ Ticket printed successfully');
      }
      
      return result;
    } catch (error) {
      console.error('Ticket print failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Format ticket for thermal printer
   */
  static formatTicketForPrinting(ticket, user) {
    const line = (char = '=', length = 32) => char.repeat(length);
    const center = (text, width = 32) => {
      const padding = Math.max(0, (width - text.length) / 2);
      return ' '.repeat(Math.floor(padding)) + text;
    };

    let receipt = '';
    
    // Header
    receipt += line('=') + '\n';
    receipt += center('NEWBETTING') + '\n';
    receipt += center('3D LOTTO TICKET') + '\n';
    receipt += line('=') + '\n';
    receipt += `#${ticket.ticketNumber}\n`;
    receipt += line('-') + '\n';
    
    // Draw info
    receipt += `Draw: ${this.formatDrawTime(ticket.draw?.drawTime)}\n`;
    receipt += `Date: ${this.formatDate(ticket.draw?.drawDate)}\n`;
    receipt += line('=') + '\n';
    receipt += '\n';
    
    // Bets
    ticket.bets?.forEach((bet, index) => {
      const letter = String.fromCharCode(65 + index); // A, B, C...
      receipt += `${letter}. ${this.formatBetType(bet.betType)}\n`;
      receipt += `   ${bet.betCombination.split('').join(' ')}\n`;
      receipt += `   ₱${parseFloat(bet.betAmount).toFixed(2)}\n`;
      receipt += '\n';
    });
    
    // Total
    receipt += line('=') + '\n';
    receipt += center('TOTAL AMOUNT') + '\n';
    receipt += center(`₱${parseFloat(ticket.totalAmount).toFixed(2)}`) + '\n';
    receipt += line('=') + '\n';
    receipt += '\n';
    
    // Agent
    receipt += `Agent: ${user.fullName || user.username}\n`;
    receipt += '\n';
    
    // QR Code placeholder (actual QR printed separately)
    receipt += '[QR CODE]\n';
    receipt += center(ticket.ticketNumber) + '\n';
    receipt += '\n';
    
    // Footer
    receipt += line('=') + '\n';
    receipt += center('GOOD LUCK! 🍀') + '\n';
    receipt += line('=') + '\n';
    receipt += `${new Date().toLocaleString()}\n`;
    
    return receipt;
  }

  /**
   * Format draw time
   */
  static formatDrawTime(drawTime) {
    const timeMap = {
      'twoPM': '2:00 PM',
      'fivePM': '5:00 PM',
      'ninePM': '9:00 PM',
      '14:00': '2:00 PM',
      '17:00': '5:00 PM',
      '21:00': '9:00 PM'
    };
    return timeMap[drawTime] || drawTime;
  }

  /**
   * Format date
   */
  static formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Format bet type
   */
  static formatBetType(betType) {
    const types = {
      'standard': 'Standard',
      'rambolito': 'Rambolito'
    };
    return types[betType] || betType;
  }

  /**
   * Test print
   */
  static async testPrint() {
    if (!this.isAvailable()) {
      return { success: false, error: 'AndroidPOS not available' };
    }

    try {
      if (window.AndroidPOS.testPrint) {
        window.AndroidPOS.testPrint();
        return { success: true };
      }
      
      // Fallback to printing test text
      const testText = line('=') + '\n' +
                       center('TEST PRINT') + '\n' +
                       line('=') + '\n' +
                       center(new Date().toLocaleString()) + '\n';
      
      return await this.printReceipt(testText);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get available printers
   */
  static async getPrinterList() {
    if (!this.isAvailable()) {
      return { success: false, error: 'AndroidPOS not available', printers: [] };
    }

    try {
      if (window.AndroidPOS.getPrinterList) {
        const printersJson = window.AndroidPOS.getPrinterList();
        const printers = JSON.parse(printersJson);
        return { success: true, printers };
      }
      
      return { 
        success: false, 
        error: 'getPrinterList not implemented',
        printers: [] 
      };
    } catch (error) {
      return { success: false, error: error.message, printers: [] };
    }
  }

  /**
   * Connect to specific printer
   */
  static async connectToPrinter(printerAddress) {
    if (!this.isAvailable()) {
      return { success: false, error: 'AndroidPOS not available' };
    }

    try {
      if (window.AndroidPOS.connectToPrinter) {
        const connected = window.AndroidPOS.connectToPrinter(printerAddress);
        return { success: connected };
      }
      
      return { success: false, error: 'connectToPrinter not implemented' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Show native toast message
   */
  static showToast(message, duration = 'short') {
    if (!this.isAvailable()) return;

    try {
      if (window.AndroidPOS.showToast) {
        window.AndroidPOS.showToast(message, duration);
      }
    } catch (error) {
      console.error('Toast failed:', error);
    }
  }

  /**
   * Vibrate device
   */
  static vibrate(duration = 200) {
    if (!this.isAvailable()) {
      // Fallback to Web Vibration API
      if (navigator.vibrate) {
        navigator.vibrate(duration);
      }
      return;
    }

    try {
      if (window.AndroidPOS.vibrate) {
        window.AndroidPOS.vibrate(duration);
      }
    } catch (error) {
      console.error('Vibrate failed:', error);
    }
  }

  /**
   * Log device capabilities
   */
  static logCapabilities() {
    console.group('📱 Android POS Capabilities');
    console.log('Available:', this.isAvailable());
    console.log('WebView:', this.isWebView());
    console.log('Connected:', this.isConnected());
    console.log('Status:', this.getStatus());
    
    if (this.isAvailable()) {
      console.log('Methods:', Object.keys(window.AndroidPOS || {}));
    }
    
    console.groupEnd();
  }
}

// Helper functions
const line = (char = '=', length = 32) => char.repeat(length);

const center = (text, width = 32) => {
  const padding = Math.max(0, (width - text.length) / 2);
  return ' '.repeat(Math.floor(padding)) + text;
};

/**
 * Print Queue Manager
 * Queues print jobs for better reliability
 */
export class PrintQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
  }

  /**
   * Add print job to queue
   */
  add(printFn, metadata = {}) {
    const job = {
      id: Date.now() + Math.random(),
      printFn,
      metadata,
      retries: 0,
      status: 'pending',
      createdAt: new Date()
    };

    this.queue.push(job);
    console.log(`📝 Added print job to queue: ${job.id}`);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.process();
    }

    return job.id;
  }

  /**
   * Process print queue
   */
  async process() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🖨️ Processing print queue (${this.queue.length} jobs)`);

    while (this.queue.length > 0) {
      const job = this.queue[0];
      
      try {
        console.log(`Printing job ${job.id}...`);
        job.status = 'printing';
        
        await job.printFn();
        
        console.log(`✅ Job ${job.id} printed successfully`);
        job.status = 'completed';
        
        // Remove from queue
        this.queue.shift();
        
        // Wait a bit between prints
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error);
        job.retries++;
        
        if (job.retries >= this.maxRetries) {
          console.error(`Job ${job.id} failed after ${this.maxRetries} retries`);
          job.status = 'failed';
          job.error = error.message;
          
          // Remove from queue
          this.queue.shift();
        } else {
          console.log(`Retrying job ${job.id} (attempt ${job.retries + 1})`);
          job.status = 'retrying';
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    this.isProcessing = false;
    console.log('✅ Print queue processed');
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(j => j.status === 'pending').length,
      printing: this.queue.filter(j => j.status === 'printing').length,
      retrying: this.queue.filter(j => j.status === 'retrying').length,
      failed: this.queue.filter(j => j.status === 'failed').length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue = [];
    this.isProcessing = false;
    console.log('🗑️ Print queue cleared');
  }

  /**
   * Retry failed jobs
   */
  retryFailed() {
    this.queue.forEach(job => {
      if (job.status === 'failed') {
        job.status = 'pending';
        job.retries = 0;
      }
    });

    if (!this.isProcessing) {
      this.process();
    }
  }
}

// Singleton instances
const printQueue = new PrintQueue();

/**
 * Enhanced printing with queue
 */
export const queuedPrint = {
  /**
   * Print ticket with queue management
   */
  printTicket: async (ticket, user) => {
    const printFn = async () => {
      return AndroidPOSManager.printTicket(ticket, user);
    };

    const jobId = printQueue.add(printFn, {
      type: 'ticket',
      ticketNumber: ticket.ticketNumber,
      timestamp: new Date()
    });

    return { jobId, message: 'Added to print queue' };
  },

  /**
   * Print receipt text
   */
  printReceipt: async (text) => {
    const printFn = async () => {
      return AndroidPOSManager.printReceipt(text);
    };

    const jobId = printQueue.add(printFn, {
      type: 'receipt',
      timestamp: new Date()
    });

    return { jobId, message: 'Added to print queue' };
  },

  /**
   * Get queue status
   */
  getQueueStatus: () => {
    return printQueue.getStatus();
  },

  /**
   * Clear queue
   */
  clearQueue: () => {
    printQueue.clear();
  },

  /**
   * Retry failed
   */
  retryFailed: () => {
    printQueue.retryFailed();
  }
};

// Export default
export default AndroidPOSManager;

// Log capabilities on import (development only)
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    AndroidPOSManager.logCapabilities();
  }, 1000);
}

