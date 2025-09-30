# 📱 Mobile POS Features Guide

## ✅ Installed Plugins (10 Total)

Your Pisting Yawa Lottery Android app now has complete mobile POS functionality!

### Core Features
1. ✅ **@capacitor/camera** - QR scanning & photos
2. ✅ **@capacitor/filesystem** - File storage
3. ✅ **@capacitor/keyboard** - Keyboard control
4. ✅ **@capacitor/network** - Network monitoring
5. ✅ **@capacitor/share** - Native sharing
6. ✅ **@capacitor/splash-screen** - Branded splash
7. ✅ **@capacitor/status-bar** - Status bar styling

### Mobile POS Features
8. ✅ **@capacitor/geolocation** - GPS location tracking
9. ✅ **@capacitor-community/bluetooth-le** - Bluetooth connectivity
10. ✅ **capacitor-thermal-printer** - Thermal printer support

---

## 🖨️ Thermal Printer Usage

### Supported Printers
- 58mm thermal printers (ESC/POS)
- 80mm thermal printers (ESC/POS)
- Bluetooth-enabled POS printers
- Compatible brands: Epson, Star, Xprinter, etc.

### Basic Usage

```javascript
import thermalPrinter from './utils/thermalPrinterUtils';

// 1. Scan for available printers
const printers = await thermalPrinter.scanPrinters();
console.log('Available printers:', printers);

// 2. Connect to printer
await thermalPrinter.connect(printers[0].address);

// 3. Print lottery ticket
await thermalPrinter.printLotteryTicket({
  ticketNumber: '12345678901234567',
  drawTime: '2PM',
  drawDate: '2025-09-30',
  bets: [
    { combination: '123', type: 'standard', amount: 10 },
    { combination: '456', type: 'rambolito', amount: 10 }
  ],
  totalAmount: 20,
  agentName: 'Juan Dela Cruz',
  agentCode: 'AGENT001',
  qrCode: '12345678901234567|abc123hash',
  createdAt: new Date()
});

// 4. Disconnect when done
await thermalPrinter.disconnect();
```

### Print Test Page

```javascript
// Test if printer is working
await thermalPrinter.printTestPage();
```

---

## 📍 Location Tracking Usage

### Get Current Location

```javascript
import CapacitorUtils from './utils/capacitorUtils';

// Request permission first
const permissions = await CapacitorUtils.requestLocationPermissions();

if (permissions.location === 'granted') {
  // Get current location
  const location = await CapacitorUtils.getCurrentLocation();
  console.log('Location:', location);
  // { latitude: 14.5995, longitude: 120.9842, accuracy: 10, ... }
}
```

### Track Agent Location

```javascript
// Watch location changes (for delivery tracking)
const watchId = await CapacitorUtils.watchLocation((position) => {
  console.log('Agent moved:', position);
  // Send to backend for tracking
  api.post('/agent/location', {
    latitude: position.latitude,
    longitude: position.longitude,
    timestamp: position.timestamp
  });
});

// Stop watching when done
await CapacitorUtils.clearLocationWatch(watchId);
```

### Use Cases
- **Agent Tracking**: Monitor agent locations in real-time
- **Geofencing**: Verify agents are in authorized areas
- **Delivery Tracking**: Track ticket delivery to customers
- **Audit Trail**: Log where tickets were sold

---

## 📷 Camera & QR Scanning

### Take Photo

```javascript
import CapacitorUtils from './utils/capacitorUtils';

// Take photo (for verification, etc.)
const imageUrl = await CapacitorUtils.takePicture();
// Use imageUrl for display or upload
```

### QR Code Scanning

Already integrated in your TicketVerification component!

```javascript
// Scan QR code for ticket verification
// Camera opens automatically
// QR data is verified against backend
```

---

## 🔗 Bluetooth Features

### Bluetooth Printer Connection

```javascript
import { BluetoothLE } from '@capacitor-community/bluetooth-le';

// Scan for Bluetooth devices
await BluetoothLE.requestLEScan({}, (result) => {
  console.log('Found device:', result);
});

// Connect to printer
await BluetoothLE.connect({ deviceId: 'printer-id' });
```

---

## 🌐 Network Monitoring

### Check Connection

```javascript
import CapacitorUtils from './utils/capacitorUtils';

// Get network status
const status = await CapacitorUtils.getNetworkStatus();
console.log('Connected:', status.connected);
console.log('Type:', status.connectionType); // wifi, cellular, none

// Listen for changes
CapacitorUtils.onNetworkChange((status) => {
  if (!status.connected) {
    alert('No internet connection!');
  }
});
```

---

## 📤 Native Sharing

### Share Ticket

```javascript
import CapacitorUtils from './utils/capacitorUtils';

// Share ticket image
await CapacitorUtils.shareTicket(
  'My Lottery Ticket',
  'Check out my ticket for today\'s draw!',
  ticketImageUrl
);

// Or share with image blob
await CapacitorUtils.shareTicketImage(ticketData, imageBlob);
```

---

## 🎯 Complete Mobile POS Workflow

### 1. Agent Opens App
```javascript
// Initialize Capacitor features
await CapacitorUtils.initializeApp();

// Check location permissions
const locationPerms = await CapacitorUtils.checkLocationPermissions();
if (locationPerms.location !== 'granted') {
  await CapacitorUtils.requestLocationPermissions();
}

// Get agent location
const location = await CapacitorUtils.getCurrentLocation();
```

### 2. Connect Printer
```javascript
// Scan for printers
const printers = await thermalPrinter.scanPrinters();

// Let agent select printer
const selectedPrinter = printers[0];

// Connect
await thermalPrinter.connect(selectedPrinter.address);
```

### 3. Create Ticket
```javascript
// Agent selects bets in BettingInterface
// Ticket is created via API
const ticket = await api.post('/tickets/create', ticketData);
```

### 4. Print Ticket
```javascript
// Print immediately after creation
await thermalPrinter.printLotteryTicket({
  ...ticket,
  agentName: user.fullName,
  agentCode: user.username
});
```

### 5. Share Ticket (Optional)
```javascript
// Customer wants digital copy
const ticketImage = await generateTicketImage(ticket);
await CapacitorUtils.shareTicket(
  `Ticket #${ticket.ticketNumber}`,
  'Your lottery ticket',
  ticketImage
);
```

### 6. Track Location
```javascript
// Log ticket sale location
await api.post('/tickets/location', {
  ticketId: ticket.id,
  latitude: location.latitude,
  longitude: location.longitude
});
```

---

## 🔐 Permissions Required

All permissions are already configured in `AndroidManifest.xml`:

### Camera
- ✅ `CAMERA` - QR scanning and photos

### Location
- ✅ `ACCESS_FINE_LOCATION` - GPS tracking
- ✅ `ACCESS_COARSE_LOCATION` - Network-based location

### Bluetooth
- ✅ `BLUETOOTH` - Bluetooth connectivity
- ✅ `BLUETOOTH_ADMIN` - Bluetooth management
- ✅ `BLUETOOTH_SCAN` - Scan for devices
- ✅ `BLUETOOTH_CONNECT` - Connect to devices

### Storage
- ✅ `READ_EXTERNAL_STORAGE` - Read files
- ✅ `WRITE_EXTERNAL_STORAGE` - Save files
- ✅ `READ_MEDIA_IMAGES` - Access images

### Network
- ✅ `INTERNET` - API calls
- ✅ `ACCESS_NETWORK_STATE` - Check connectivity

---

## 📱 Testing Mobile POS Features

### 1. Test Printer
```javascript
// In your app, add a test button
<button onClick={async () => {
  try {
    const printers = await thermalPrinter.scanPrinters();
    alert(`Found ${printers.length} printers`);
    
    if (printers.length > 0) {
      await thermalPrinter.connect(printers[0].address);
      await thermalPrinter.printTestPage();
      alert('Test page printed!');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}}>
  Test Printer
</button>
```

### 2. Test Location
```javascript
<button onClick={async () => {
  try {
    const location = await CapacitorUtils.getCurrentLocation();
    alert(`Location: ${location.latitude}, ${location.longitude}`);
  } catch (error) {
    alert('Error: ' + error.message);
  }
}}>
  Get Location
</button>
```

### 3. Test Camera
```javascript
<button onClick={async () => {
  try {
    const image = await CapacitorUtils.takePicture();
    // Display image
    document.getElementById('preview').src = image;
  } catch (error) {
    alert('Error: ' + error.message);
  }
}}>
  Take Photo
</button>
```

---

## 🛠️ Troubleshooting

### Printer Not Found
- Ensure Bluetooth is enabled
- Printer must be in pairing mode
- Check printer is charged/powered
- Try restarting printer

### Location Not Working
- Check location permissions granted
- Enable GPS on device
- Try outdoors for better signal
- Check `ACCESS_FINE_LOCATION` permission

### Camera Not Opening
- Check camera permission granted
- Close other apps using camera
- Restart app if needed

### Bluetooth Connection Failed
- Unpair and re-pair printer
- Check printer is not connected to another device
- Restart Bluetooth on phone
- Update printer firmware if available

---

## 🎨 UI Integration Examples

### Printer Settings Page

```javascript
import { useState, useEffect } from 'react';
import thermalPrinter from '../utils/thermalPrinterUtils';

function PrinterSettings() {
  const [printers, setPrinters] = useState([]);
  const [connected, setConnected] = useState(false);

  const scanPrinters = async () => {
    const found = await thermalPrinter.scanPrinters();
    setPrinters(found);
  };

  const connectPrinter = async (address) => {
    await thermalPrinter.connect(address);
    setConnected(true);
  };

  return (
    <div>
      <button onClick={scanPrinters}>Scan Printers</button>
      {printers.map(printer => (
        <div key={printer.address}>
          <span>{printer.name}</span>
          <button onClick={() => connectPrinter(printer.address)}>
            Connect
          </button>
        </div>
      ))}
      {connected && <span>✅ Printer Connected</span>}
    </div>
  );
}
```

---

## 📊 Benefits

### For Agents
- ✅ **Instant Printing** - Print tickets immediately
- ✅ **No Internet Needed** - Bluetooth printing works offline
- ✅ **Professional Receipts** - Clean, readable tickets
- ✅ **Location Tracking** - Verify work locations
- ✅ **Easy Sharing** - Share tickets via any app

### For Admins
- ✅ **Agent Tracking** - Monitor agent locations
- ✅ **Audit Trail** - Know where tickets were sold
- ✅ **Geofencing** - Ensure agents work in authorized areas
- ✅ **Performance Monitoring** - Track agent movements

### For Customers
- ✅ **Physical Ticket** - Printed receipt
- ✅ **Digital Copy** - Share via WhatsApp, Messenger, etc.
- ✅ **QR Verification** - Scan to verify authenticity
- ✅ **Professional Service** - Modern POS experience

---

## 🚀 Your Mobile POS is Ready!

All features are installed and configured. Your lottery system now has:

- 🖨️ **Thermal Printer Support** - Print tickets on-the-go
- 📍 **GPS Location Tracking** - Monitor agent locations
- 📷 **Camera & QR Scanning** - Verify tickets instantly
- 🔗 **Bluetooth Connectivity** - Connect to POS devices
- 📤 **Native Sharing** - Share tickets easily
- 🌐 **Network Monitoring** - Handle offline scenarios

**Start testing in Android Studio!** 📱✨
