# 🚀 Quick Reference - POS Printing

## ⚡ Quick Start

```javascript
// 1. Check if in Android app
if (typeof AndroidPOS === 'undefined') {
    alert('Not in Android app');
    return;
}

// 2. Connect to printer
AndroidPOS.scanDevices();

// 3. Wait 2 seconds, then print
setTimeout(() => {
    if (AndroidPOS.isConnected()) {
        AndroidPOS.printText('Hello World!\n\n');
    }
}, 2000);
```

---

## 📱 All Methods

### Connection
```javascript
AndroidPOS.scanDevices()        // Scan & connect
AndroidPOS.isConnected()        // Check if connected
AndroidPOS.disconnectPOS()      // Disconnect
AndroidPOS.enableBluetooth()    // Enable BT
```

### Printing
```javascript
AndroidPOS.printText(text)      // Print text
AndroidPOS.printImage(base64)   // Print image ⭐ NEW!
AndroidPOS.testPrint()          // Test print
```

### Info
```javascript
AndroidPOS.getStatus()          // Get status
AndroidPOS.getDeviceInfo()      // Get device info ⭐ NEW!
AndroidPOS.printDebugInfo()     // Print debug ⭐ NEW!
```

---

## 🖨️ Print Text Example

```javascript
const ticket = `
================================
    LOTTERY TICKET
================================
Ticket #: 12345
Numbers: 12, 23, 34, 45, 56
Amount: $5.00
================================


`;

AndroidPOS.printText(ticket);
```

---

## 🖼️ Print Image Example

```javascript
// From canvas
const canvas = document.getElementById('ticket');
const base64 = canvas.toDataURL('image/png');
AndroidPOS.printImage(base64);

// From QR code library
QRCode.toDataURL('https://lottery.com/12345')
    .then(url => AndroidPOS.printImage(url));
```

---

## ✅ Safe Print Function

```javascript
function safePrint(text) {
    // Check AndroidPOS exists
    if (typeof AndroidPOS === 'undefined') {
        alert('Not in Android app');
        return false;
    }
    
    // Check connected
    if (!AndroidPOS.isConnected()) {
        alert('Not connected. Connecting...');
        AndroidPOS.scanDevices();
        return false;
    }
    
    // Print
    try {
        AndroidPOS.printText(text);
        return true;
    } catch (error) {
        alert('Print failed: ' + error.message);
        return false;
    }
}
```

---

## 🐛 Debug One-Liner

```javascript
console.log('POS:', typeof AndroidPOS !== 'undefined', '| Connected:', AndroidPOS?.isConnected(), '| Device:', AndroidPOS?.getDeviceInfo());
```

---

## 📄 Documents

- `PRINT_NOT_WORKING_FIX.md` - Complete troubleshooting
- `POS_DEBUG_GUIDE.md` - Detailed guide
- `IMPLEMENTATION_SUMMARY.md` - What was added
- `POS_DEBUG_TEST.html` - Visual test page

---

## 🎯 Common Issues

| Issue | Solution |
|-------|----------|
| `AndroidPOS is not defined` | Not in Android app |
| `Not connected to printer` | Run `AndroidPOS.scanDevices()` |
| `printImage is not a function` | Update APK with new code |
| Print opens browser | Use `AndroidPOS.printText()` not `window.print()` |

---

## ⚡ Super Quick Test

```javascript
// Copy-paste this in console
AndroidPOS?.testPrint();
```

---

**Need more help?** Check `PRINT_NOT_WORKING_FIX.md`
