# 🖼️ Add printImage Method to MainActivity.java

## ✅ What to Add

Your web app now supports **base64 image printing** for better quality thermal printer output!

---

## 📝 Add This Method to MainActivity.java

Open: `app/src/main/java/com/lottery/lotteryonline/MainActivity.java`

Find the `POSJavaScriptInterface` class and add this new method:

```java
@JavascriptInterface
public void printImage(String base64Image) {
    runOnUiThread(() -> {
        if (posDeviceManager.isConnected()) {
            new Thread(() -> {
                try {
                    // Decode base64 to bitmap
                    byte[] imageBytes = android.util.Base64.decode(base64Image, android.util.Base64.DEFAULT);
                    android.graphics.Bitmap bitmap = android.graphics.BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);
                    
                    if (bitmap == null) {
                        runOnUiThread(() -> {
                            Toast.makeText(MainActivity.this, "❌ Invalid image data", Toast.LENGTH_SHORT).show();
                        });
                        return;
                    }
                    
                    // Resize for 58mm thermal printer (220px width)
                    int targetWidth = 384; // 58mm = 384 dots for most thermal printers
                    float scale = (float) targetWidth / bitmap.getWidth();
                    int targetHeight = (int) (bitmap.getHeight() * scale);
                    
                    android.graphics.Bitmap resizedBitmap = android.graphics.Bitmap.createScaledBitmap(
                        bitmap, targetWidth, targetHeight, true
                    );
                    
                    // Convert bitmap to ESC/POS commands
                    byte[] imageData = convertBitmapToESCPOS(resizedBitmap);
                    
                    // Initialize printer
                    byte[] init = {0x1B, 0x40}; // ESC @
                    posDeviceManager.sendData(init);
                    
                    // Send image data
                    boolean success = posDeviceManager.sendData(imageData);
                    
                    if (success) {
                        // Feed paper
                        posDeviceManager.sendData("\n\n\n".getBytes());
                        
                        // Cut paper (GS V 0)
                        byte[] cutPaper = {0x1D, 0x56, 0x00};
                        posDeviceManager.sendData(cutPaper);
                        
                        runOnUiThread(() -> {
                            Toast.makeText(MainActivity.this, "✅ Image printed!", Toast.LENGTH_SHORT).show();
                        });
                    } else {
                        runOnUiThread(() -> {
                            Toast.makeText(MainActivity.this, "❌ Print failed", Toast.LENGTH_SHORT).show();
                        });
                    }
                    
                    // Clean up
                    bitmap.recycle();
                    resizedBitmap.recycle();
                    
                } catch (Exception e) {
                    runOnUiThread(() -> {
                        Toast.makeText(MainActivity.this, "❌ Print error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    });
                }
            }).start();
        } else {
            Toast.makeText(MainActivity.this, "❌ Not connected to printer", Toast.LENGTH_LONG).show();
            posDeviceManager.autoConnectToPOSDevices();
        }
    });
}

// Helper method to convert bitmap to ESC/POS image commands
private byte[] convertBitmapToESCPOS(android.graphics.Bitmap bitmap) {
    int width = bitmap.getWidth();
    int height = bitmap.getHeight();
    
    // ESC/POS image command: GS v 0
    // Format: GS v 0 m xL xH yL yH d1...dk
    int widthBytes = (width + 7) / 8;
    int totalBytes = widthBytes * height;
    
    byte[] imageData = new byte[8 + totalBytes];
    
    // GS v 0 command
    imageData[0] = 0x1D; // GS
    imageData[1] = 0x76; // v
    imageData[2] = 0x30; // 0
    imageData[3] = 0x00; // Normal mode
    
    // Width (xL, xH)
    imageData[4] = (byte) (widthBytes & 0xFF);
    imageData[5] = (byte) ((widthBytes >> 8) & 0xFF);
    
    // Height (yL, yH)
    imageData[6] = (byte) (height & 0xFF);
    imageData[7] = (byte) ((height >> 8) & 0xFF);
    
    // Convert bitmap to monochrome data
    int offset = 8;
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < widthBytes; x++) {
            byte b = 0;
            for (int bit = 0; bit < 8; bit++) {
                int px = x * 8 + bit;
                if (px < width) {
                    int pixel = bitmap.getPixel(px, y);
                    int gray = (android.graphics.Color.red(pixel) + 
                               android.graphics.Color.green(pixel) + 
                               android.graphics.Color.blue(pixel)) / 3;
                    
                    // Threshold: < 128 = black (1), >= 128 = white (0)
                    if (gray < 128) {
                        b |= (1 << (7 - bit));
                    }
                }
            }
            imageData[offset++] = b;
        }
    }
    
    return imageData;
}
```

---

## 🎯 How It Works

### **1. Web App Generates Base64 Image**
```javascript
// Frontend generates ticket as PNG image
const imageBlob = await getPreGeneratedImage(ticket);

// Convert to base64
const base64Image = await blobToBase64(imageBlob);

// Send to Android
window.AndroidPOS.printImage(base64Image);
```

### **2. Android Receives Base64**
```java
@JavascriptInterface
public void printImage(String base64Image) {
    // Decode base64 → Bitmap
    // Resize to 384px (58mm)
    // Convert to ESC/POS commands
    // Send to thermal printer
}
```

### **3. Thermal Printer Prints Image**
- High quality ticket image
- Exact layout as designed
- QR codes print perfectly
- Logos and graphics supported

---

## ✅ Benefits of Image Printing

| Feature | Text Printing | Image Printing |
|---------|---------------|----------------|
| **Layout** | Plain text only | Exact HTML layout |
| **QR Codes** | Placeholder text | Actual QR code |
| **Logos** | Not supported | Full support |
| **Formatting** | Limited | Perfect |
| **Quality** | Basic | High quality |

---

## 🧪 Testing

### **1. Check if Method Exists**

In web app console:
```javascript
console.log('printImage available:', typeof window.AndroidPOS.printImage !== 'undefined');
```

### **2. Test Print**

```javascript
// Will automatically use image printing if available
await TicketGenerator.printTicket(ticket, user);
```

### **3. Check Console Logs**

Look for:
```
🖼️ Using image-based printing (base64)...
📄 Base64 image generated, length: 12345
✅ Image print command sent successfully!
```

---

## 🔄 Fallback Behavior

If `printImage` is not available, the system automatically falls back to text printing:

```
🖼️ Using image-based printing (base64)...
❌ printImage not available
⚠️ Falling back to text printing...
📝 Using text-based printing...
✅ Print command sent successfully!
```

---

## 📱 Update Your APK

After adding the `printImage` method:

1. **Build the APK:**
   ```bash
   cd C:\Users\Lags\AndroidStudioProjects\lotteryonline
   gradlew assembleDebug
   ```

2. **Install on device:**
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Test printing:**
   - Open app
   - Create ticket
   - Should print as high-quality image!

---

## 🎉 Result

Your thermal printer will now print **high-quality ticket images** with:
- ✅ Perfect layout
- ✅ Actual QR codes
- ✅ Logos and graphics
- ✅ Exact formatting
- ✅ Professional appearance

**Much better than plain text printing!** 🖨️✨
