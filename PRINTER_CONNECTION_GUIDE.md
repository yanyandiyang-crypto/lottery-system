# 🖨️ How to Check if POS Printer is Connected

## 📱 Access Printer Manager

Your app now has a **Printer Manager** page to test and manage printer connections!

### Access the Page:
1. **Login as Agent** (only agents can access)
2. Navigate to: `/printer` or add a menu link
3. Or directly: `http://localhost:3000/printer` (web) or in-app navigation

---

## ✅ Check Connection Status

### Method 1: Using Printer Manager UI

**Visual Indicators:**
- ✅ **Green "Connected"** = Printer is connected
- ⭕ **Gray "Not Connected"** = No printer connected
- Shows printer name/address when connected

**Steps:**
1. Open Printer Manager page
2. Look at "Connection Status" section
3. Green checkmark = connected
4. Gray circle = not connected

### Method 2: Programmatically Check

```javascript
import thermalPrinter from './utils/thermalPrinterUtils';

// Check if printer is connected
const isConnected = thermalPrinter.isConnected();
console.log('Printer connected:', isConnected); // true or false

// Get connected printer info
if (isConnected) {
  const printer = thermalPrinter.getConnectedPrinter();
  console.log('Connected printer:', printer);
  // { address: 'XX:XX:XX:XX:XX:XX', name: 'Printer Name' }
}
```

---

## 🔍 How to Connect Printer

### Step-by-Step Guide:

#### 1. **Prepare Printer**
- Turn on your thermal printer
- Enable Bluetooth on printer
- Put printer in **pairing mode**:
  - Usually: Hold power button for 3-5 seconds
  - LED should blink (indicates pairing mode)
  - Check printer manual for specific instructions

#### 2. **Enable Bluetooth on Phone**
- Go to phone Settings
- Turn on Bluetooth
- (Don't pair manually - app will handle it)

#### 3. **Scan for Printers**
- Open Printer Manager in app
- Click **"🔍 Scan for Printers"** button
- Wait 5-10 seconds
- Available printers will appear in list

#### 4. **Connect to Printer**
- Select your printer from list
- Click **"Connect"** button
- Wait for connection confirmation
- Status will show **"✅ Connected"**

#### 5. **Test Connection**
- Click **"🧪 Print Test Page"** button
- Printer should print a test receipt
- If successful, printer is ready!

---

## 🧪 Test Printer Functions

### Print Test Page
```javascript
// Simple test print
await thermalPrinter.printTestPage();
```

**What it prints:**
- Various text sizes
- Bold text
- Different alignments
- Confirms printer is working

### Print Sample Ticket
```javascript
// Print a sample lottery ticket
await thermalPrinter.printLotteryTicket({
  ticketNumber: '12345678901234567',
  drawTime: '2PM',
  drawDate: new Date(),
  bets: [
    { combination: '123', type: 'standard', amount: 10 }
  ],
  totalAmount: 10,
  agentName: 'Test Agent',
  agentCode: 'TEST001',
  qrCode: 'ticket-qr-code',
  createdAt: new Date()
});
```

---

## 🔧 Troubleshooting

### Printer Not Found

**Problem:** No printers appear after scanning

**Solutions:**
1. ✅ Check printer is turned ON
2. ✅ Check printer is in pairing mode (LED blinking)
3. ✅ Check phone Bluetooth is enabled
4. ✅ Move phone closer to printer (within 1 meter)
5. ✅ Restart printer and try again
6. ✅ Check printer battery/power

### Connection Failed

**Problem:** "Connection failed" error

**Solutions:**
1. ✅ Unpair printer from phone Bluetooth settings
2. ✅ Restart printer
3. ✅ Restart app
4. ✅ Try scanning again
5. ✅ Check printer is not connected to another device
6. ✅ Update printer firmware (if available)

### Print Failed

**Problem:** Connected but printing fails

**Solutions:**
1. ✅ Check printer has paper
2. ✅ Check paper is loaded correctly
3. ✅ Check printer is not jammed
4. ✅ Disconnect and reconnect
5. ✅ Try test print first
6. ✅ Check printer error lights

### Printer Disconnects

**Problem:** Printer disconnects randomly

**Solutions:**
1. ✅ Keep phone close to printer
2. ✅ Check printer battery level
3. ✅ Disable phone power saving mode
4. ✅ Keep app in foreground
5. ✅ Check for Bluetooth interference

---

## 📊 Connection Status Indicators

### In Printer Manager:
- **✅ Connected** (Green) - Printer ready to use
- **⭕ Not Connected** (Gray) - No printer connected
- **🔍 Scanning...** (Blue) - Looking for printers
- **🔗 Connecting...** (Blue) - Connecting to printer
- **🖨️ Printing...** (Blue) - Print job in progress
- **❌ Error** (Red) - Connection/print failed

### In Code:
```javascript
// Check connection status
if (thermalPrinter.isConnected()) {
  console.log('✅ Printer ready');
  // Safe to print
} else {
  console.log('⭕ Printer not connected');
  // Show connection UI
}
```

---

## 🎯 Best Practices

### Before Selling Tickets:
1. ✅ Connect to printer at start of day
2. ✅ Print test page to verify
3. ✅ Keep printer charged/powered
4. ✅ Keep phone near printer

### During Sales:
1. ✅ Check connection before each print
2. ✅ Handle print errors gracefully
3. ✅ Offer digital ticket if print fails
4. ✅ Keep backup paper rolls

### End of Day:
1. ✅ Disconnect printer properly
2. ✅ Turn off printer to save battery
3. ✅ Store printer safely

---

## 💡 Quick Reference

### Check Connection:
```javascript
thermalPrinter.isConnected() // true/false
```

### Get Printer Info:
```javascript
thermalPrinter.getConnectedPrinter() // { address, name }
```

### Scan Printers:
```javascript
const printers = await thermalPrinter.scanPrinters()
```

### Connect:
```javascript
await thermalPrinter.connect(printerAddress)
```

### Disconnect:
```javascript
await thermalPrinter.disconnect()
```

### Print Test:
```javascript
await thermalPrinter.printTestPage()
```

### Print Ticket:
```javascript
await thermalPrinter.printLotteryTicket(ticketData)
```

---

## 📱 Accessing Printer Manager

### Option 1: Direct URL
- Navigate to `/printer` in your app
- Example: `https://your-app.com/printer`

### Option 2: Add Menu Link
Add to your navigation menu:
```javascript
{
  name: 'Printer',
  icon: PrinterIcon,
  path: '/printer',
  roles: ['agent']
}
```

### Option 3: Settings Page
Add printer settings to Account/Settings page

---

## ✨ Features

Your Printer Manager includes:
- ✅ **Scan for Printers** - Find available Bluetooth printers
- ✅ **Connection Status** - Real-time connection indicator
- ✅ **Connect/Disconnect** - Easy printer management
- ✅ **Test Print** - Verify printer is working
- ✅ **Sample Ticket** - Test full ticket printing
- ✅ **Error Handling** - Clear error messages
- ✅ **Instructions** - Built-in help guide

---

## 🚀 You're Ready!

Your mobile POS system now has complete printer management! Agents can:
- Check if printer is connected
- Scan and connect to printers
- Test printing before sales
- Print lottery tickets on-the-go

**Access the Printer Manager at `/printer` to get started!** 🖨️✨
