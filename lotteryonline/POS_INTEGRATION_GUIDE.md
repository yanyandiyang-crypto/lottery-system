# POS Device Integration Guide

## Overview
Your Android app now automatically connects to mobile POS devices (printers, card readers, etc.) via Bluetooth.

## Features
✅ **Auto-connect** - Automatically finds and connects to paired POS devices
✅ **Speed optimized** - Aggressive caching and performance settings
✅ **JavaScript Interface** - Control POS devices from your web app

## Supported POS Devices
The app automatically detects and connects to devices with these keywords in their name:
- Bluetooth Printers (thermal, receipt printers)
- Card Readers
- Payment Terminals
- Brands: Sunmi, Rongta, XPrinter, Goojprt, Zjiang, Bixolon, Epson, Star, PAX, Verifone, Ingenico, etc.

## How It Works
1. **On App Start**: Automatically enables Bluetooth
2. **After 2 seconds**: Scans for paired POS devices
3. **Auto-connects**: Connects to first detected POS device
4. **Web Integration**: Your web app can control the POS device

## JavaScript API (Use in your Web App)

### Check if POS is connected
```javascript
if (typeof window.AndroidPOS !== 'undefined') {
    const isConnected = window.AndroidPOS.isConnected();
    console.log('POS Connected:', isConnected);
}
```

### Connect to POS device
```javascript
window.AndroidPOS.connectPOS();
```

### Disconnect from POS device
```javascript
window.AndroidPOS.disconnectPOS();
```

### Print text (for receipt printers)
```javascript
// Simple text printing
window.AndroidPOS.printText("Hello from Web App!\n");

// Print receipt
const receipt = `
================================
        YOUR STORE NAME
================================
Date: ${new Date().toLocaleString()}
--------------------------------
Item 1              $10.00
Item 2              $20.00
--------------------------------
Total:              $30.00
================================
Thank you for your purchase!
\n\n\n
`;
window.AndroidPOS.printText(receipt);
```

### Enable Bluetooth
```javascript
window.AndroidPOS.enableBluetooth();
```

## Example: Complete Integration

```javascript
// Check if running in Android app
function isPOSAvailable() {
    return typeof window.AndroidPOS !== 'undefined';
}

// Initialize POS on page load
document.addEventListener('DOMContentLoaded', function() {
    if (isPOSAvailable()) {
        console.log('POS device available');
        
        // Check connection status
        setTimeout(() => {
            if (window.AndroidPOS.isConnected()) {
                console.log('POS device connected!');
                showPOSStatus('Connected');
            } else {
                console.log('POS device not connected');
                showPOSStatus('Disconnected');
            }
        }, 3000);
    }
});

// Print button handler
function handlePrint() {
    if (isPOSAvailable()) {
        if (window.AndroidPOS.isConnected()) {
            // Generate receipt
            const receipt = generateReceipt();
            window.AndroidPOS.printText(receipt);
        } else {
            alert('Please connect to a POS device first');
            window.AndroidPOS.connectPOS();
        }
    } else {
        alert('POS printing only available in mobile app');
    }
}

// Manual connect button
function connectPOS() {
    if (isPOSAvailable()) {
        window.AndroidPOS.connectPOS();
    }
}

// Manual disconnect button
function disconnectPOS() {
    if (isPOSAvailable()) {
        window.AndroidPOS.disconnectPOS();
    }
}
```

## Speed Optimizations Implemented

### WebView Performance
- ✅ **Cache-first loading** - Uses cached content when available
- ✅ **Hardware acceleration** - GPU rendering enabled
- ✅ **High render priority** - Prioritizes rendering performance
- ✅ **App cache enabled** - Stores web app data locally
- ✅ **Image optimization** - Efficient image loading

### Network Optimizations
- ✅ **Aggressive caching** - Reduces network requests
- ✅ **Resource interception** - Optimizes resource loading
- ✅ **SSL optimization** - Faster SSL handshakes

## Setup Instructions

### 1. Pair Your POS Device
1. Go to Android Settings > Bluetooth
2. Turn on Bluetooth
3. Pair your POS device (printer, card reader, etc.)
4. Remember the device name

### 2. Launch the App
- App automatically enables Bluetooth
- App automatically connects to paired POS devices
- Toast notification shows connection status

### 3. Use in Web App
- Add JavaScript code to your web app
- Use `window.AndroidPOS` API to control devices
- Test printing and connectivity

## Troubleshooting

### POS device not connecting?
1. Check if device is paired in Bluetooth settings
2. Check if device name contains POS keywords
3. Manually call `window.AndroidPOS.connectPOS()`
4. Check Bluetooth permissions are granted

### Printing not working?
1. Verify connection: `window.AndroidPOS.isConnected()`
2. Check printer has paper
3. Check printer is powered on
4. Try reconnecting: `window.AndroidPOS.connectPOS()`

### Slow loading?
- Clear app cache: Settings > Apps > Your App > Clear Cache
- Check internet connection
- App uses aggressive caching for faster loads

## Security Notes
- URL is stored securely in `local.properties` (not in source code)
- Release builds are obfuscated with ProGuard
- Bluetooth permissions are requested at runtime
- All POS communication is local (Bluetooth only)

## Permissions Required
- ✅ Internet
- ✅ Bluetooth & Bluetooth Admin
- ✅ Bluetooth Connect & Scan (Android 12+)
- ✅ Camera (for QR/barcode scanning)
- ✅ Location (for Bluetooth scanning)

All permissions are automatically requested on app start.
