# 🖨️ POS Printer Setup & Testing Guide

## ❓ Unsaon Pag-Install ang Driver?

### **ANSWER: WALA NAY DRIVER INSTALLATION! 🎉**

Ang imong app **AUTOMATIC** na mo-connect sa POS devices gamit ang **Bluetooth SPP (Serial Port Profile)**.

**Bluetooth SPP** is built-in sa Android - WALA NAY DRIVER NEEDED!

---

## 📱 How It Works (Automatic)

### **Step 1: Pair Your Printer (One-time only)**
1. Go to **Settings > Bluetooth**
2. Turn ON Bluetooth
3. Find your POS printer (e.g., "BlueTooth Printer", "RPP02N", etc.)
4. Click to pair
5. Enter PIN if asked (usually `0000` or `1234`)

### **Step 2: Open Your App**
- App automatically enables Bluetooth ✅
- App automatically scans for paired POS devices ✅
- App automatically connects to first POS device found ✅

### **Step 3: Test Print**
- Use the test page or JavaScript API
- Print receipt to verify connection

---

## 🔍 Supported POS Devices (Auto-Detected)

Your app automatically detects devices with these keywords in their name:

### **Printers:**
- ✅ Bluetooth Printer
- ✅ Thermal Printer
- ✅ Receipt Printer
- ✅ POS Printer

### **Brands (Auto-detected):**
- ✅ **Sunmi** (Mobile POS)
- ✅ **Rongta** (RPP series)
- ✅ **XPrinter** (XP series)
- ✅ **Goojprt** (PT series)
- ✅ **Zjiang** (ZJ series)
- ✅ **Bixolon** (SPP series)
- ✅ **Epson** (TM series)
- ✅ **Star** (TSP series)
- ✅ **Citizen** (CT series)

### **Payment Terminals:**
- ✅ PAX
- ✅ Verifone
- ✅ Ingenico
- ✅ Newland
- ✅ Urovo

---

## 🧪 How to Test (Debug)

### **Method 1: Use Test Page (Easiest)**

1. Copy `POS_TEST_PAGE.html` to your web server
2. Open it in your app
3. Click "Connect to POS"
4. Click "Test Print"
5. Check if receipt prints

### **Method 2: Use JavaScript Console**

Open your web app and run these commands in console:

```javascript
// Check if POS is available
console.log('POS Available:', typeof window.AndroidPOS !== 'undefined');

// Connect to POS
window.AndroidPOS.connectPOS();

// Check connection status
console.log('Connected:', window.AndroidPOS.isConnected());
console.log('Status:', window.AndroidPOS.getStatus());

// Test print
window.AndroidPOS.testPrint();
```

### **Method 3: Check Android Logs (Advanced)**

1. Connect phone to computer via USB
2. Enable USB Debugging
3. Run: `adb logcat | grep POSDeviceManager`
4. You'll see:
   - ✅ Found paired devices
   - ✅ Connection attempts
   - ✅ Print commands
   - ❌ Errors (if any)

---

## 📊 Debug Messages Explained

### **Toast Messages:**

| Message | Meaning | Action |
|---------|---------|--------|
| ✅ Connected: [Device Name] | Successfully connected | Test print now |
| 🔍 Found: [Device Name] | POS device detected | Connecting... |
| ⚠️ No POS device found | No printer paired | Pair printer in Bluetooth settings |
| ⚠️ No paired devices | Bluetooth has no paired devices | Pair your printer |
| ❌ Bluetooth not supported | Device has no Bluetooth | Use different phone |
| ⚠️ Please enable Bluetooth | Bluetooth is OFF | Turn ON Bluetooth |
| ❌ Connection failed | Cannot connect | Check printer is ON and in range |

### **Log Messages (adb logcat):**

```
POSDeviceManager: Found 3 paired devices
POSDeviceManager: Paired device: BlueTooth Printer [00:11:22:33:44:55]
POSDeviceManager: Found POS device: BlueTooth Printer
POSDeviceManager: ✅ Connected to POS device: BlueTooth Printer
POSDeviceManager: Test print successful
```

---

## 🛠️ Troubleshooting

### **Problem: "No POS device found"**

**Solution:**
1. Check printer name contains keywords: "printer", "pos", "thermal", etc.
2. Pair printer in Settings > Bluetooth
3. Make sure printer is ON
4. Restart app

### **Problem: "Connection failed"**

**Solution:**
1. Check printer is ON and charged
2. Check printer is in range (< 10 meters)
3. Unpair and re-pair printer
4. Restart printer
5. Restart phone

### **Problem: "Test print sent but nothing prints"**

**Solution:**
1. Check printer has paper
2. Check paper is loaded correctly
3. Check printer is not in error state (blinking lights)
4. Try printing from another app to verify printer works

### **Problem: Printer not auto-connecting**

**Solution:**
1. Check printer name - must contain POS keywords
2. Manually connect: `window.AndroidPOS.connectPOS()`
3. Check Bluetooth permissions are granted
4. Check logs: `adb logcat | grep POSDeviceManager`

---

## 💻 JavaScript API Reference

### **Connect to POS**
```javascript
window.AndroidPOS.connectPOS();
```

### **Disconnect**
```javascript
window.AndroidPOS.disconnectPOS();
```

### **Check if Connected**
```javascript
const isConnected = window.AndroidPOS.isConnected();
console.log('Connected:', isConnected);
```

### **Get Status**
```javascript
const status = window.AndroidPOS.getStatus();
console.log('Status:', status);
// Returns: "✅ Connected to POS device" or "⚠️ Not connected"
```

### **Test Print (DEBUG)**
```javascript
window.AndroidPOS.testPrint();
// Prints a test receipt with date/time
```

### **Print Custom Text**
```javascript
window.AndroidPOS.printText("Hello from Web App!\n\n\n");
```

### **Print Receipt**
```javascript
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
Thank you!
\n\n\n
`;
window.AndroidPOS.printText(receipt);
```

---

## 🎯 Quick Test Checklist

- [ ] Bluetooth is ON
- [ ] Printer is paired in Settings
- [ ] Printer is ON and has paper
- [ ] App has Bluetooth permissions
- [ ] Open app and wait 2 seconds
- [ ] Check for "Connected" toast message
- [ ] Run `window.AndroidPOS.testPrint()`
- [ ] Check if receipt prints

---

## 📝 Common Printer Names

If your printer has any of these in the name, it will auto-connect:

- BlueTooth Printer
- Thermal Printer
- Receipt Printer
- POS Printer
- RPP02N (Rongta)
- XP-80 (XPrinter)
- PT-210 (Goojprt)
- ZJ-5890 (Zjiang)
- SPP-R200 (Bixolon)
- TM-T88 (Epson)

---

## ✅ Success Indicators

You'll know it's working when you see:

1. **Toast message**: "✅ Connected: [Printer Name]"
2. **Test print**: Receipt prints successfully
3. **JavaScript**: `window.AndroidPOS.isConnected()` returns `true`
4. **Logs**: "✅ Connected to POS device"

---

## 🚀 Performance Notes

- **Auto-connect delay**: 2 seconds after app starts
- **Connection time**: 1-3 seconds
- **Print speed**: Depends on printer (usually instant)
- **No driver installation**: Uses Bluetooth SPP (built-in)
- **No internet needed**: Works 100% offline

---

## 📞 Need Help?

Check the logs:
```bash
adb logcat | grep POSDeviceManager
```

This will show you exactly what's happening! 🔍
