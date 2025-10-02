# POS Debug & Testing Guide

Complete guide for testing and debugging POS device connectivity in the Lottery Online app.

## 🚀 Quick Start

### Option 1: Use Debug Test Page (Recommended)
1. Open the app
2. Load `file:///android_asset/POS_DEBUG_TEST.html` in the WebView
3. Use the visual interface to test all POS functions

### Option 2: Use JavaScript Console
Call the functions directly from your web app's JavaScript console.

---

## 📱 Available Debug Functions

### Connection Functions

#### `AndroidPOS.scanDevices()`
Scans for paired POS devices and attempts to connect.
```javascript
AndroidPOS.scanDevices();
```

#### `AndroidPOS.connectPOS()`
Manually trigger connection to POS devices.
```javascript
AndroidPOS.connectPOS();
```

#### `AndroidPOS.disconnectPOS()`
Disconnect from current POS device.
```javascript
AndroidPOS.disconnectPOS();
```

#### `AndroidPOS.isConnected()`
Check if currently connected to a POS device.
```javascript
const connected = AndroidPOS.isConnected();
console.log('Connected:', connected); // true or false
```

---

### Status & Info Functions

#### `AndroidPOS.getStatus()`
Get current connection status with details.
```javascript
const status = AndroidPOS.getStatus();
console.log(status);
// Returns: "✅ Connected to POS device" or "⚠️ Not connected"
```

#### `AndroidPOS.getDeviceInfo()`
Get detailed information about connected device.
```javascript
const info = AndroidPOS.getDeviceInfo();
console.log(info);
// Returns: "Printer Name (XX:XX:XX:XX:XX:XX)" or "No device connected"
```

---

### Print Functions

#### `AndroidPOS.testPrint()`
Send a test receipt to verify printer is working.
```javascript
AndroidPOS.testPrint();
```
**Output**: Prints a formatted test receipt with date/time.

#### `AndroidPOS.printDebugInfo()`
Print debug information to the POS device.
```javascript
AndroidPOS.printDebugInfo();
```
**Output**: Prints connection status, device info, and debug data.

#### `AndroidPOS.printText(text)`
Print custom text to the POS device.
```javascript
const receipt = `
================================
    LOTTERY TICKET
================================
Ticket #: 12345
Date: 2025-10-01
Numbers: 12, 23, 34, 45, 56
================================
Total: $5.00
================================
`;

AndroidPOS.printText(receipt);
```

---

### Bluetooth Functions

#### `AndroidPOS.enableBluetooth()`
Enable Bluetooth if it's disabled.
```javascript
AndroidPOS.enableBluetooth();
```

---

## 🧪 Testing Workflow

### Step 1: Check Bluetooth
```javascript
// Enable Bluetooth
AndroidPOS.enableBluetooth();

// Wait 2 seconds for Bluetooth to enable
setTimeout(() => {
    console.log('Bluetooth should be enabled now');
}, 2000);
```

### Step 2: Scan for Devices
```javascript
// Scan and auto-connect to POS devices
AndroidPOS.scanDevices();

// Check status after 3 seconds
setTimeout(() => {
    const status = AndroidPOS.getStatus();
    const device = AndroidPOS.getDeviceInfo();
    console.log('Status:', status);
    console.log('Device:', device);
}, 3000);
```

### Step 3: Verify Connection
```javascript
// Check if connected
if (AndroidPOS.isConnected()) {
    console.log('✅ Connected!');
    console.log('Device:', AndroidPOS.getDeviceInfo());
} else {
    console.log('❌ Not connected');
    console.log('Status:', AndroidPOS.getStatus());
}
```

### Step 4: Test Print
```javascript
// Send test print
if (AndroidPOS.isConnected()) {
    AndroidPOS.testPrint();
    console.log('Test print sent. Check your printer.');
} else {
    console.log('Cannot print - not connected');
}
```

---

## 🐛 Troubleshooting

### Problem: "Bluetooth not supported"
**Solution**: Device doesn't have Bluetooth hardware. Use a different device.

### Problem: "Bluetooth disabled"
**Solution**: 
```javascript
AndroidPOS.enableBluetooth();
```
Or manually enable in Settings > Bluetooth.

### Problem: "No POS device found"
**Solutions**:
1. Pair your printer in Android Settings > Bluetooth first
2. Make sure printer is turned on
3. Check if printer name contains keywords like "printer", "pos", "thermal", etc.

### Problem: "Not connected to printer"
**Solutions**:
1. Check Bluetooth is enabled
2. Scan for devices: `AndroidPOS.scanDevices()`
3. Check device is paired in Settings
4. Restart printer and try again

### Problem: Print command sent but nothing prints
**Solutions**:
1. Check printer has paper
2. Check printer is powered on
3. Try test print: `AndroidPOS.testPrint()`
4. Check printer is in ready state (not in error mode)
5. Reconnect: `AndroidPOS.disconnectPOS()` then `AndroidPOS.scanDevices()`

---

## 📊 Debug Monitoring

### Real-time Status Monitoring
```javascript
// Check status every 2 seconds
setInterval(() => {
    const status = AndroidPOS.getStatus();
    const connected = AndroidPOS.isConnected();
    console.log(`[${new Date().toLocaleTimeString()}] Status: ${status}, Connected: ${connected}`);
}, 2000);
```

### Connection Event Logging
```javascript
function logPOSStatus() {
    console.log('=== POS STATUS ===');
    console.log('Status:', AndroidPOS.getStatus());
    console.log('Device:', AndroidPOS.getDeviceInfo());
    console.log('Connected:', AndroidPOS.isConnected());
    console.log('==================');
}

// Call whenever you need to check
logPOSStatus();
```

---

## 🎯 Common Test Scenarios

### Scenario 1: First Time Setup
```javascript
// 1. Enable Bluetooth
AndroidPOS.enableBluetooth();

// 2. Wait and scan
setTimeout(() => {
    AndroidPOS.scanDevices();
}, 2000);

// 3. Wait and test
setTimeout(() => {
    if (AndroidPOS.isConnected()) {
        AndroidPOS.testPrint();
    }
}, 5000);
```

### Scenario 2: Quick Connection Test
```javascript
// One-liner to check everything
console.log(
    'Connected:', AndroidPOS.isConnected(),
    '| Status:', AndroidPOS.getStatus(),
    '| Device:', AndroidPOS.getDeviceInfo()
);
```

### Scenario 3: Print Lottery Ticket
```javascript
function printLotteryTicket(ticketData) {
    if (!AndroidPOS.isConnected()) {
        console.error('Not connected to printer');
        return false;
    }

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

    AndroidPOS.printText(ticket);
    console.log('Ticket printed successfully');
    return true;
}

// Usage
printLotteryTicket({
    id: '12345',
    date: '2025-10-01',
    time: '19:41',
    numbers: [12, 23, 34, 45, 56],
    amount: '5.00'
});
```

---

## 📝 Integration Example

### Complete Integration in Your Web App
```html
<!DOCTYPE html>
<html>
<head>
    <title>Lottery App with POS</title>
</head>
<body>
    <button onclick="connectPrinter()">Connect Printer</button>
    <button onclick="printTicket()">Print Ticket</button>
    <div id="status">Status: Unknown</div>

    <script>
        // Check if running in Android app
        const hasPOS = typeof AndroidPOS !== 'undefined';

        // Auto-connect on page load
        window.addEventListener('load', function() {
            if (hasPOS) {
                setTimeout(() => {
                    AndroidPOS.scanDevices();
                    updateStatus();
                }, 1000);
            }
        });

        // Update status display
        function updateStatus() {
            if (!hasPOS) {
                document.getElementById('status').textContent = 'Status: Not in app';
                return;
            }

            const status = AndroidPOS.getStatus();
            const device = AndroidPOS.getDeviceInfo();
            document.getElementById('status').textContent = 
                `Status: ${status} | Device: ${device}`;
        }

        // Connect to printer
        function connectPrinter() {
            if (!hasPOS) {
                alert('Not running in Android app');
                return;
            }

            AndroidPOS.scanDevices();
            setTimeout(updateStatus, 2000);
        }

        // Print ticket
        function printTicket() {
            if (!hasPOS) {
                alert('Not running in Android app');
                return;
            }

            if (!AndroidPOS.isConnected()) {
                alert('Not connected to printer. Please connect first.');
                return;
            }

            const ticket = `
================================
    LOTTERY TICKET
================================
Ticket #: ${Math.floor(Math.random() * 100000)}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}
================================
`;

            AndroidPOS.printText(ticket);
            alert('Ticket sent to printer!');
        }

        // Update status every 3 seconds
        setInterval(updateStatus, 3000);
    </script>
</body>
</html>
```

---

## 🔧 Advanced Debugging

### Enable Verbose Logging
Check Android Logcat for detailed logs:
```bash
adb logcat | grep POSDeviceManager
```

### Common Log Messages
- `✅ Connected to POS device:` - Successfully connected
- `❌ Failed to connect:` - Connection failed (check error message)
- `Found X paired devices` - Number of paired Bluetooth devices
- `Paired device: [Name]` - List of all paired devices
- `Found POS device:` - Detected a POS device by name

---

## 📱 Supported POS Devices

The app auto-detects devices with these keywords in their name:
- printer, pos, receipt, thermal
- card reader, payment, terminal
- sunmi, rongta, xprinter, goojprt, zjiang
- bixolon, epson, star, citizen, sewoo
- pax, verifone, ingenico, newland, urovo

**Tip**: If your device isn't detected, pair it and check its name in Bluetooth settings. If it doesn't contain any of these keywords, you may need to manually add it to the list in `POSDeviceManager.java`.

---

## ✅ Testing Checklist

- [ ] Bluetooth is enabled
- [ ] POS device is paired in Android Settings
- [ ] POS device is powered on
- [ ] `AndroidPOS.scanDevices()` finds the device
- [ ] `AndroidPOS.isConnected()` returns `true`
- [ ] `AndroidPOS.testPrint()` prints successfully
- [ ] Custom text prints correctly
- [ ] Device info shows correct name and address

---

## 🎉 Success Indicators

When everything is working correctly, you should see:
1. ✅ Toast message: "Connected: [Device Name]"
2. ✅ Status: "✅ Connected to POS device"
3. ✅ Device info shows name and MAC address
4. ✅ Test print produces a receipt
5. ✅ Custom text prints as expected

---

## 📞 Need Help?

If you're still having issues:
1. Check the Activity Log in the debug panel
2. Review Android Logcat for error messages
3. Verify printer is compatible with ESC/POS commands
4. Try with a different POS device to isolate the issue
5. Check Bluetooth permissions are granted in app settings
