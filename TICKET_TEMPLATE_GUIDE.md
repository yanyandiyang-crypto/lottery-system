# 🎨 Ticket Template Design Guide

## 📍 Asa ang Ticket Design?

Ang ticket image design nag-base sa **template files** ug **backend HTML generation**.

---

## 🗂️ Template Files Location

### **Frontend Templates:**
```
frontend/src/utils/templates/
├── umatikTemplate.js          (Main template)
└── umatikCenterTemplate.js    (Center-aligned template)
```

**Kini ang files nga i-edit para sa design changes!**

---

## 🔄 How Ticket Image Generation Works

### **Flow:**

```
1. User creates ticket
   ↓
2. Backend generates HTML using template
   ↓
3. HTML saved to database (generatedHTML field)
   ↓
4. Frontend requests HTML: GET /tickets/:id/html
   ↓
5. Convert HTML to image (html2canvas)
   ↓
6. Convert image to base64
   ↓
7. Send to printer: AndroidPOS.printImage(base64)
   ↓
8. ✅ Prints with exact template design!
```

---

## 📝 Editing Template Design

### **Option 1: Edit Frontend Template (RECOMMENDED)**

**File:** `frontend/src/utils/templates/umatikTemplate.js`

```javascript
export const generateUmatikTemplate = (ticket, user, options = {}) => {
  return `
    <div style="width: 220px; background: white; padding: 8px;">
      <!-- EDIT DESIGN HERE -->
      
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 8px;">
        <img src="${logoUrl}" style="width: 60px; height: 60px;" />
        <div style="font-size: 14px; font-weight: bold;">
          LOTTERY TICKET
        </div>
      </div>
      
      <!-- Ticket Number -->
      <div style="font-size: 10px; text-align: center;">
        #${ticket.ticketNumber}
      </div>
      
      <!-- Bets -->
      ${betsHTML}
      
      <!-- Total -->
      <div style="font-size: 12px; font-weight: bold;">
        TOTAL: ₱${ticket.totalAmount}
      </div>
      
      <!-- QR Code -->
      <div style="text-align: center;">
        <img src="${qrCodeDataUrl}" style="width: 100px; height: 100px;" />
      </div>
      
      <!-- Footer -->
      <div style="text-align: center; font-size: 8px;">
        GOOD LUCK! 🍀
      </div>
    </div>
  `;
};
```

**What you can edit:**
- ✅ Layout (width, padding, margins)
- ✅ Colors (background, text colors)
- ✅ Fonts (size, weight, family)
- ✅ Logo size and position
- ✅ QR code size
- ✅ Text content
- ✅ Borders and spacing

---

### **Option 2: Edit Backend Template Generation**

**File:** `routes/tickets-clean.js` (line ~200-300)

This is where the backend generates HTML after ticket creation.

---

## 🎨 Common Design Changes

### **1. Change Logo Size**

```javascript
// In umatikTemplate.js
<img src="${logoUrl}" style="width: 80px; height: 80px;" />
//                            ↑ Change these values
```

### **2. Change QR Code Size**

```javascript
<img src="${qrCodeDataUrl}" style="width: 120px; height: 120px;" />
//                                  ↑ Change these values
```

### **3. Change Font Sizes**

```javascript
// Header
<div style="font-size: 16px; font-weight: bold;">  ← Bigger header

// Ticket number
<div style="font-size: 12px;">  ← Bigger ticket number

// Bets
<div style="font-size: 11px;">  ← Bigger bet text
```

### **4. Change Colors**

```javascript
// Background
<div style="background: #f0f0f0;">  ← Gray background

// Text color
<div style="color: #333;">  ← Dark gray text

// Border
<div style="border: 2px solid #000;">  ← Black border
```

### **5. Change Layout Width**

```javascript
// For 58mm thermal printer
<div style="width: 220px;">  ← 58mm = 220px

// For 80mm thermal printer
<div style="width: 300px;">  ← 80mm = 300px
```

---

## 🖼️ Image Generation Settings

**File:** `frontend/src/utils/mobileTicketUtils.js`

```javascript
// convertHTMLToImage() function
const canvas = await html2canvas(tempContainer, {
  width: 220,        // ← Template width
  scale: 3,          // ← Quality (higher = better)
  backgroundColor: 'white',
  useCORS: true,
  logging: false
});
```

**Adjust for better quality:**
- `scale: 2` - Normal quality (faster)
- `scale: 3` - High quality (recommended)
- `scale: 4` - Ultra quality (slower)

---

## 🧪 Testing Template Changes

### **1. Edit Template File**

```bash
# Open in VS Code
code frontend/src/utils/templates/umatikTemplate.js
```

### **2. Save Changes**

### **3. Rebuild Frontend**

```bash
cd frontend
npm run build
```

### **4. Test in App**

1. Create a ticket
2. Check if design changed
3. If not, clear cache and try again

---

## 📱 Smart Behavior (NEW!)

Your system now has smart detection:

### **Has Printer:**
```
Create Ticket → Auto Print → No modal
```

### **No Printer:**
```
Create Ticket → Auto Share Dialog → User shares image
```

### **No printImage:**
```
Create Ticket → Show modal → Manual print/share
```

---

## 🎯 Current Template

Your current template is **umatikTemplate.js** which includes:

- ✅ Logo at top
- ✅ Ticket number
- ✅ Draw time and date
- ✅ Bets with sequences (A, B, C...)
- ✅ Total amount
- ✅ QR code
- ✅ Agent info
- ✅ Footer with timestamp

**Width:** 220px (58mm thermal printer)
**Format:** HTML with inline CSS
**Quality:** High (scale: 3)

---

## 🔧 Quick Edits

### **Make Logo Bigger:**
```javascript
// Line ~50 in umatikTemplate.js
width: 80px; height: 80px;  // Was 60px
```

### **Make QR Code Bigger:**
```javascript
// Line ~150 in umatikTemplate.js
width: 120px; height: 120px;  // Was 100px
```

### **Add Border:**
```javascript
// Add to main container
<div style="width: 220px; border: 2px solid #000; padding: 8px;">
```

### **Change Background:**
```javascript
// Add to main container
<div style="width: 220px; background: #f5f5f5; padding: 8px;">
```

---

## 📋 Summary

**To edit ticket design:**

1. Open: `frontend/src/utils/templates/umatikTemplate.js`
2. Edit HTML/CSS
3. Save file
4. Rebuild: `npm run build`
5. Test in app

**Design is converted to image for printing, so any HTML/CSS changes will appear in the printed ticket!** 🎨🖨️
