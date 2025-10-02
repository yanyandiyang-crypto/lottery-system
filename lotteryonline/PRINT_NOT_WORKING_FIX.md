# 🔧 Print Not Working - Complete Fix Guide

## ❌ Common Issues

### Issue 1: `AndroidPOS.printImage is not a function`
**Cause**: The `printImage` method was missing from the Android app.

**Status**: ✅ **FIXED** - Method has been added to `MainActivity.java`

---

### Issue 2: Print commands fail silently
**Cause**: Not connected to POS device or connection lost.

**Solution**: Always check connection before printing.

---

### Issue 3: Opens new tab instead of printing
**Cause**: Frontend code trying to open print dialog instead of using Android POS interface.

**Solution**: Use `AndroidPOS` interface, not browser print.

---

## ✅ Complete Solution

### Step 1: Check if AndroidPOS is Available

**Always check first** before calling any POS functions:

```javascript
// Check if running in Android app
if (typeof AndroidPOS === 'undefined') {
    console.error('❌ Not running in Android app - POS functions not available');
    alert('This feature only works in the mobile app');
    return;
}
```

---

### Step 2: Check Connection Status

```javascript
// Check if connected to printer
if (!AndroidPOS.isConnected()) {
    console.error('❌ Not connected to printer');
    
    // Try to connect
    AndroidPOS.scanDevices();
    
    // Wait and check again
    setTimeout(() => {
        if (AndroidPOS.isConnected()) {
            console.log('✅ Connected! You can now print.');
        } else {
            alert('Please connect to printer first. Go to Settings > Bluetooth and pair your printer.');
        }
    }, 3000);
    
    return;
}
```

---

### Step 3: Print Text (Correct Way)

```javascript
function printTicket(ticketData) {
    // 1. Check if AndroidPOS exists
    if (typeof AndroidPOS === 'undefined') {
        console.error('Not in Android app');
        return false;
    }
    
    // 2. Check connection
    if (!AndroidPOS.isConnected()) {
        alert('Not connected to printer. Please connect first.');
        return false;
    }
    
    // 3. Format ticket text
    const ticket = `
================================
    🎰 LOTTERY TICKET 🎰
================================
Ticket #: ${ticketData.id}
Date: ${ticketData.date}
Time: ${ticketData.time}
--------------------------------
Numbers: ${ticketData.numbers.join(', ')}
--------------------------------
Amount: $${ticketData.amount}
================================
Good Luck! 🍀
================================


`;
    
    // 4. Send to printer
    try {
        AndroidPOS.printText(ticket);
        console.log('✅ Ticket sent to printer');
        return true;
    } catch (error) {
        console.error('❌ Print error:', error);
        alert('Print failed: ' + error.message);
        return false;
    }
}

// Usage
printTicket({
    id: '12345',
    date: '2025-10-01',
    time: '19:41',
    numbers: [12, 23, 34, 45, 56],
    amount: '5.00'
});
```

---

### Step 4: Print Image (NEW - Now Available!)

```javascript
function printQRCode(qrCodeData) {
    // 1. Check if AndroidPOS exists
    if (typeof AndroidPOS === 'undefined') {
        console.error('Not in Android app');
        return false;
    }
    
    // 2. Check connection
    if (!AndroidPOS.isConnected()) {
        alert('Not connected to printer');
        return false;
    }
    
    // 3. Generate QR code as base64 image
    // Using a library like qrcode.js or similar
    const canvas = document.createElement('canvas');
    QRCode.toCanvas(canvas, qrCodeData, { width: 200 });
    const base64Image = canvas.toDataURL('image/png');
    
    // 4. Send to printer
    try {
        AndroidPOS.printImage(base64Image);
        console.log('✅ QR code sent to printer');
        return true;
    } catch (error) {
        console.error('❌ Print error:', error);
        alert('Print failed: ' + error.message);
        return false;
    }
}

// Usage
printQRCode('https://lottery.com/ticket/12345');
```

---

## 📋 Complete Print Function Template

```javascript
/**
 * Universal print function with all checks
 */
async function safePrint(content, type = 'text') {
    // Step 1: Check Android interface
    if (typeof AndroidPOS === 'undefined') {
        console.error('❌ AndroidPOS not available');
        alert('Print feature only works in the mobile app');
        return { success: false, error: 'Not in Android app' };
    }
    
    // Step 2: Check connection
    if (!AndroidPOS.isConnected()) {
        console.warn('⚠️ Not connected to printer');
        
        // Try to auto-connect
        AndroidPOS.scanDevices();
        
        // Wait for connection
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check again
        if (!AndroidPOS.isConnected()) {
            const status = AndroidPOS.getStatus();
            alert(`Cannot print: ${status}\n\nPlease connect to printer in Settings > Bluetooth`);
            return { success: false, error: 'Not connected' };
        }
    }
    
    // Step 3: Print based on type
    try {
        if (type === 'text') {
            AndroidPOS.printText(content);
        } else if (type === 'image') {
            AndroidPOS.printImage(content);
        } else {
            throw new Error('Invalid print type: ' + type);
        }
        
        console.log('✅ Print successful');
        return { success: true };
        
    } catch (error) {
        console.error('❌ Print failed:', error);
        alert('Print error: ' + error.message);
        return { success: false, error: error.message };
    }
}

// Usage examples:
// Text printing
safePrint('Hello World!', 'text');

// Image printing
safePrint('data:image/png;base64,iVBORw0KG...', 'image');
```

---

## 🎯 Frontend Integration Example

### React Component

```jsx
import React, { useState, useEffect } from 'react';

function PrintButton({ ticketData }) {
    const [isConnected, setIsConnected] = useState(false);
    const [hasAndroidPOS, setHasAndroidPOS] = useState(false);
    
    useEffect(() => {
        // Check if AndroidPOS is available
        setHasAndroidPOS(typeof AndroidPOS !== 'undefined');
        
        // Check connection status
        if (typeof AndroidPOS !== 'undefined') {
            setIsConnected(AndroidPOS.isConnected());
            
            // Poll connection status every 3 seconds
            const interval = setInterval(() => {
                setIsConnected(AndroidPOS.isConnected());
            }, 3000);
            
            return () => clearInterval(interval);
        }
    }, []);
    
    const handlePrint = async () => {
        if (!hasAndroidPOS) {
            alert('Print feature only works in mobile app');
            return;
        }
        
        if (!isConnected) {
            alert('Not connected to printer. Connecting...');
            AndroidPOS.scanDevices();
            return;
        }
        
        // Format ticket
        const ticket = `
================================
    LOTTERY TICKET
================================
Ticket #: ${ticketData.id}
Numbers: ${ticketData.numbers.join(', ')}
Amount: $${ticketData.amount}
================================
        `;
        
        try {
            AndroidPOS.printText(ticket);
            alert('✅ Ticket printed!');
        } catch (error) {
            alert('❌ Print failed: ' + error.message);
        }
    };
    
    if (!hasAndroidPOS) {
        return <button disabled>Print (App Only)</button>;
    }
    
    return (
        <button 
            onClick={handlePrint}
            disabled={!isConnected}
            style={{
                backgroundColor: isConnected ? '#10b981' : '#ef4444',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '5px',
                cursor: isConnected ? 'pointer' : 'not-allowed'
            }}
        >
            {isConnected ? '🖨️ Print Ticket' : '⚠️ Connect Printer'}
        </button>
    );
}

export default PrintButton;
```

---

### Vue Component

```vue
<template>
  <div>
    <button 
      @click="handlePrint" 
      :disabled="!isConnected"
      :class="{ connected: isConnected, disconnected: !isConnected }"
    >
      {{ isConnected ? '🖨️ Print Ticket' : '⚠️ Connect Printer' }}
    </button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      isConnected: false,
      hasAndroidPOS: false
    };
  },
  mounted() {
    // Check if AndroidPOS exists
    this.hasAndroidPOS = typeof AndroidPOS !== 'undefined';
    
    if (this.hasAndroidPOS) {
      this.checkConnection();
      
      // Poll connection status
      this.interval = setInterval(this.checkConnection, 3000);
    }
  },
  beforeUnmount() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  },
  methods: {
    checkConnection() {
      if (typeof AndroidPOS !== 'undefined') {
        this.isConnected = AndroidPOS.isConnected();
      }
    },
    handlePrint() {
      if (!this.hasAndroidPOS) {
        alert('Print feature only works in mobile app');
        return;
      }
      
      if (!this.isConnected) {
        alert('Connecting to printer...');
        AndroidPOS.scanDevices();
        return;
      }
      
      const ticket = `
================================
    LOTTERY TICKET
================================
Ticket #: ${this.ticketData.id}
Numbers: ${this.ticketData.numbers.join(', ')}
Amount: $${this.ticketData.amount}
================================
      `;
      
      try {
        AndroidPOS.printText(ticket);
        this.$emit('printed');
      } catch (error) {
        alert('Print failed: ' + error.message);
      }
    }
  }
};
</script>

<style scoped>
button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
}

button.connected {
  background-color: #10b981;
}

button.disconnected {
  background-color: #ef4444;
  cursor: not-allowed;
}

button:disabled {
  opacity: 0.5;
}
</style>
```

---

## 🔍 Debugging Checklist

Use this checklist to debug print issues:

```javascript
function debugPrint() {
    console.log('=== PRINT DEBUG ===');
    
    // 1. Check AndroidPOS exists
    console.log('1. AndroidPOS available:', typeof AndroidPOS !== 'undefined');
    
    if (typeof AndroidPOS === 'undefined') {
        console.log('❌ STOP: Not running in Android app');
        return;
    }
    
    // 2. Check connection
    console.log('2. Connected:', AndroidPOS.isConnected());
    
    // 3. Get status
    console.log('3. Status:', AndroidPOS.getStatus());
    
    // 4. Get device info
    console.log('4. Device:', AndroidPOS.getDeviceInfo());
    
    // 5. Try test print
    if (AndroidPOS.isConnected()) {
        console.log('5. Sending test print...');
        AndroidPOS.testPrint();
    } else {
        console.log('5. Cannot test - not connected');
        console.log('   Attempting to connect...');
        AndroidPOS.scanDevices();
    }
    
    console.log('===================');
}

// Run debug
debugPrint();
```

---

## 📱 Available AndroidPOS Methods

### Connection Methods
- `AndroidPOS.scanDevices()` - Scan and connect to POS devices
- `AndroidPOS.connectPOS()` - Manually connect
- `AndroidPOS.disconnectPOS()` - Disconnect
- `AndroidPOS.isConnected()` - Check if connected (returns boolean)

### Print Methods
- `AndroidPOS.printText(text)` - Print text/receipt ✅
- `AndroidPOS.printImage(base64)` - Print image (QR code, logo) ✅ **NEW!**
- `AndroidPOS.testPrint()` - Print test receipt

### Info Methods
- `AndroidPOS.getStatus()` - Get connection status
- `AndroidPOS.getDeviceInfo()` - Get device name and address
- `AndroidPOS.printDebugInfo()` - Print debug info to printer

### Bluetooth Methods
- `AndroidPOS.enableBluetooth()` - Enable Bluetooth

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T: Use browser print
```javascript
// WRONG - Opens browser print dialog
window.print();
```

### ✅ DO: Use AndroidPOS
```javascript
// CORRECT - Prints to POS device
AndroidPOS.printText('Hello');
```

---

### ❌ DON'T: Forget to check connection
```javascript
// WRONG - Will fail if not connected
AndroidPOS.printText('Hello');
```

### ✅ DO: Always check first
```javascript
// CORRECT - Check before printing
if (AndroidPOS.isConnected()) {
    AndroidPOS.printText('Hello');
} else {
    alert('Not connected to printer');
}
```

---

### ❌ DON'T: Assume AndroidPOS exists
```javascript
// WRONG - Will crash if not in app
AndroidPOS.printText('Hello');
```

### ✅ DO: Check if it exists
```javascript
// CORRECT - Safe check
if (typeof AndroidPOS !== 'undefined') {
    AndroidPOS.printText('Hello');
} else {
    console.log('Not in Android app');
}
```

---

## 🚀 Quick Test

Copy and paste this into your browser console (when app is loaded):

```javascript
// Quick test function
(function testPOS() {
    console.log('🧪 Testing POS...');
    
    if (typeof AndroidPOS === 'undefined') {
        console.log('❌ AndroidPOS not found - not in Android app');
        return;
    }
    
    console.log('✅ AndroidPOS found');
    console.log('Status:', AndroidPOS.getStatus());
    console.log('Connected:', AndroidPOS.isConnected());
    console.log('Device:', AndroidPOS.getDeviceInfo());
    
    if (AndroidPOS.isConnected()) {
        console.log('✅ Connected! Sending test print...');
        AndroidPOS.printText('Test from console!\n\n');
    } else {
        console.log('⚠️ Not connected. Scanning...');
        AndroidPOS.scanDevices();
    }
})();
```

---

## ✅ Summary

1. **Always check** if `AndroidPOS` exists before using it
2. **Always check** connection status with `isConnected()`
3. **Use `printText()`** for receipts and text
4. **Use `printImage()`** for QR codes and images (now available!)
5. **Handle errors** with try-catch
6. **Test first** with `testPrint()` before implementing

---

## 📞 Still Having Issues?

1. Load the debug page: `file:///android_asset/pos_debug.html`
2. Use the visual interface to test all functions
3. Check the activity log for errors
4. Review `POS_DEBUG_GUIDE.md` for detailed troubleshooting

---

**Last Updated**: 2025-10-01  
**Status**: ✅ All methods implemented and working
