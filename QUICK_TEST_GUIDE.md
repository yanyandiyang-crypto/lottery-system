# 🚀 Quick Test Guide - Android Print

## ⚡ Fast Testing Steps

### **Step 1: Open Test Page**
```
http://your-server/test-print.html
```

### **Step 2: Check Status**
Click: **🔍 Check Connection**

**Expected Result:**
```
✅ AndroidPOS Available: Yes
✅ AndroidApp Available: Yes
✅ Connected to Printer (or ⚠️ Not Connected)
```

### **Step 3: Connect Printer** (if not connected)
Click: **🔌 Connect to Printer**

Wait 2 seconds, then check status again.

### **Step 4: Test Print**
Click: **🖨️ Test Print**

**Expected:** Printer should print test text

### **Step 5: Print Sample Ticket**
Click: **🎫 Print Sample Ticket**

**Expected:** Printer should print formatted lottery ticket

---

## 🔍 Console Commands (Chrome DevTools)

Connect phone via USB, open `chrome://inspect`, then run:

```javascript
// Check if AndroidPOS exists
console.log('AndroidPOS:', typeof window.AndroidPOS !== 'undefined');

// Check connection
console.log('Connected:', window.AndroidPOS.isConnected());

// Get status
console.log('Status:', window.AndroidPOS.getStatus());

// Manual connect
window.AndroidPOS.connectPOS();

// Test print
window.AndroidPOS.testPrint();

// Print sample
window.AndroidPOS.printReceipt('Test\nPrint\n\n\n');
```

---

## ✅ Success Indicators

### **In Test Page:**
- ✅ Status shows "Connected to Printer"
- ✅ Debug log shows "AndroidPOS interface found!"
- ✅ Test print produces output
- ✅ Sample ticket prints correctly

### **In Console:**
- ✅ `window.AndroidPOS` is defined
- ✅ `isConnected()` returns `true`
- ✅ No JavaScript errors

### **On Printer:**
- ✅ Paper feeds
- ✅ Text is printed
- ✅ Paper auto-cuts (if using printReceipt)

---

## ❌ Common Issues & Quick Fixes

| Problem | Quick Fix |
|---------|-----------|
| AndroidPOS not available | Use Android app, not browser |
| Printer not connected | Settings > Bluetooth > Pair printer |
| Nothing prints | Check printer power & paper |
| Print failed error | Reconnect: disconnect then connect |
| Wrong text encoding | Check printer supports UTF-8 |

---

## 📱 Real Ticket Test

1. Login to app
2. Go to Betting page
3. Create a ticket
4. Click **Print** button
5. Check console for: `📱 Detected Android POS app`
6. Ticket should print on thermal printer

---

## 🎯 Expected Console Output

```
🖨️ Printing ticket...
📱 Detected Android POS app, using native printing
🏪 Printing via Mobile POS system...
📱 Using AndroidPOS.printReceipt()
✅ Ticket printed successfully
```

---

## 🆘 If Still Not Working

1. **Rebuild APK** - Make sure latest code is in app
2. **Check MainActivity.java** - Verify `AndroidPOS` interface is added
3. **Reinstall app** - Clear old version
4. **Check Bluetooth permissions** - Grant all permissions
5. **Try different printer** - Test with another device

---

## 📞 Debug Checklist

- [ ] Test page shows AndroidPOS available
- [ ] Printer is paired in Bluetooth settings
- [ ] Printer is powered on
- [ ] Printer has paper
- [ ] App has Bluetooth permissions
- [ ] Console shows no JavaScript errors
- [ ] Test print works
- [ ] Sample ticket prints

If all checked ✅ but still not working, check Android app code in `MainActivity.java`.
