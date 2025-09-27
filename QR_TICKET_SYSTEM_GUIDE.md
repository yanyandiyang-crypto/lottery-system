# 🎫 Enhanced QR Code & Ticket Verification System

## Overview

This document outlines the enhanced QR code and ticket number system implemented for secure ticket verification and claiming in the lottery system.

## 🔧 System Components

### 1. **17-Digit Numeric Ticket Numbers**

**Format:** `TTTTTTTTTTTTTRRR` (13-digit timestamp + 4-digit random)

**Benefits:**
- ✅ **Purely Numeric**: No letters to avoid confusion (0/O, 1/I)
- ✅ **Searchable**: Easy to type and search
- ✅ **Scannable**: OCR-friendly for mobile apps
- ✅ **Unique**: Timestamp + random ensures uniqueness
- ✅ **Display Format**: `12345 67890 12345 67` (with spaces for readability)

**Example:**
```
Raw: 17234567890123456
Display: 17234 56789 01234 56
```

### 2. **Secure QR Code System**

**QR Data Format:** `{ticketNumber}|{hash}`

**Hash Generation:**
```javascript
const hashInput = `${ticketNumber}:${totalAmount}:${drawId}:${userId}:${timestamp}`;
const hash = crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
const qrData = `${ticketNumber}|${hash}`;
```

**Security Features:**
- 🔐 **Tamper-Proof**: Hash prevents QR code modification
- 🔍 **Verifiable**: Server can validate hash against database
- 📱 **Compact**: 16-character hash keeps QR codes scannable
- 🛡️ **Privacy**: No sensitive data exposed in QR code

### 3. **Verification & Claiming System**

**API Endpoints:**

#### Search by Ticket Number
```
GET /api/v1/tickets/search/{ticketNumber}
```

#### Verify QR Code
```
POST /api/v1/tickets/verify-qr
Body: { "qrData": "12345678901234567|a1b2c3d4e5f6g7h8" }
```

#### Claim Winning Ticket
```
POST /api/v1/tickets/claim
Body: {
  "ticketNumber": "12345678901234567",
  "claimerName": "Juan Dela Cruz",
  "claimerPhone": "09123456789",
  "claimerAddress": "123 Main St, City"
}
```

## 🎯 Implementation Details

### Backend Changes

1. **Enhanced Ticket Generator** (`utils/enhancedTicketGenerator.js`)
   - Pure numeric ticket number generation
   - Secure hash generation for QR codes
   - Validation and verification functions

2. **Verification Routes** (`routes/ticket-verification.js`)
   - QR code verification
   - Ticket number search
   - Claiming functionality
   - Audit logging

3. **Updated Ticket Generator** (`utils/ticketGenerator.js`)
   - Modified to use 17-digit numeric format
   - Enhanced QR code generation with security hash

### Frontend Changes

1. **Updated Templates**
   - `umatikCenterTemplate.js`
   - `umatikTemplate.js`
   - `umatik58mmTemplate.js`
   - All now use secure QR format and formatted ticket numbers

2. **Verification Component** (`components/TicketVerification.js`)
   - QR code scanner using camera
   - Ticket number search interface
   - Claiming functionality
   - Real-time verification results

### Database Changes

1. **New Fields** (Migration `005_add_claiming_fields.sql`)
   ```sql
   ALTER TABLE tickets ADD COLUMN claimed_at TIMESTAMP NULL;
   ALTER TABLE tickets ADD COLUMN claimer_name VARCHAR(255) NULL;
   ALTER TABLE tickets ADD COLUMN claimer_phone VARCHAR(50) NULL;
   ALTER TABLE tickets ADD COLUMN claimer_address TEXT NULL;
   ```

2. **Indexes for Performance**
   ```sql
   CREATE INDEX idx_tickets_status_claimed ON tickets(status) WHERE status = 'claimed';
   CREATE INDEX idx_tickets_win_amount ON tickets(win_amount) WHERE win_amount > 0;
   ```

## 🚀 Usage Guide

### For Agents (Ticket Creation)

1. **Ticket Generation**: System automatically generates 17-digit numeric ticket numbers
2. **QR Codes**: Each ticket includes a secure QR code with verification hash
3. **Printing**: All templates now support the new format

### For Players (Ticket Verification)

1. **By Ticket Number**:
   - Enter 17-digit number: `12345 67890 12345 67`
   - System validates format and searches database
   - Shows ticket details and winning status

2. **By QR Code**:
   - Scan QR code with camera
   - System verifies hash authenticity
   - Displays ticket information instantly

### For Claiming Winnings

1. **Verification**: Scan QR or enter ticket number
2. **Winning Check**: System confirms if ticket won
3. **Claim Process**: Enter claimer details (name, phone, address)
4. **Completion**: Ticket marked as claimed with timestamp

## 🔒 Security Features

### QR Code Security
- **Hash Verification**: Prevents counterfeit tickets
- **Tamper Detection**: Modified QR codes fail verification
- **No Sensitive Data**: QR only contains ticket number and hash

### Claiming Security
- **Audit Trail**: All claims logged with details
- **One-Time Claiming**: Prevents duplicate claims
- **Verification Required**: Must verify before claiming

### Database Security
- **Constraints**: Ensure claimed tickets have claimer info
- **Indexes**: Fast lookups for verification
- **Audit Logging**: Complete transaction history

## 📱 Frontend Integration

### Adding to Your App

1. **Install Dependencies**:
   ```bash
   npm install react-qr-reader
   ```

2. **Import Component**:
   ```javascript
   import TicketVerification from './components/TicketVerification';
   ```

3. **Use in Route**:
   ```javascript
   <Route path="/verify" component={TicketVerification} />
   ```

### Mobile Considerations

- **Camera Access**: Requires HTTPS for camera access
- **Responsive Design**: Works on all screen sizes
- **Touch-Friendly**: Large buttons and inputs
- **Offline Fallback**: Manual number entry when camera unavailable

## 🧪 Testing

### Test Scenarios

1. **Valid Ticket Verification**:
   - Create ticket → Scan QR → Verify details match

2. **Invalid QR Detection**:
   - Modify QR data → Scan → Should fail verification

3. **Claiming Flow**:
   - Winning ticket → Verify → Claim → Check status

4. **Duplicate Claim Prevention**:
   - Claimed ticket → Attempt re-claim → Should fail

### Sample Test Data

```javascript
// Valid QR Data Format
const qrData = "17234567890123456|a1b2c3d4e5f6g7h8";

// Valid Ticket Number Formats
const ticketNumbers = [
  "17234567890123456",           // Raw format
  "17234 56789 01234 56",        // Display format
  "17234-56789-01234-56"         // Alternative format
];
```

## 🔧 Configuration

### Environment Variables

```env
# QR Code Service URLs
QR_PRIMARY_SERVICE=https://quickchart.io/qr
QR_FALLBACK_SERVICE=https://api.qrserver.com/v1/create-qr-code

# Security Settings
QR_HASH_LENGTH=16
TICKET_NUMBER_LENGTH=17

# Claiming Settings
CLAIM_PERIOD_DAYS=365
REQUIRE_CLAIMER_PHONE=true
```

### Server Configuration

```javascript
// Add to server.js
app.use('/api/v1/tickets', ticketVerificationRoutes);
```

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **Verification Success Rate**: QR scans vs successful verifications
2. **Claiming Rate**: Winning tickets vs claimed tickets
3. **Security Events**: Failed verifications, tamper attempts
4. **Performance**: Verification response times

### Audit Events

- `TICKET_VERIFIED`: Successful ticket verification
- `TICKET_CLAIMED`: Winning ticket claimed
- `QR_VERIFICATION_FAILED`: Invalid QR code scanned
- `DUPLICATE_CLAIM_ATTEMPT`: Attempt to claim already claimed ticket

## 🚨 Troubleshooting

### Common Issues

1. **QR Code Not Scanning**:
   - Check camera permissions
   - Ensure good lighting
   - Try manual number entry

2. **Verification Failed**:
   - Verify ticket number format (17 digits)
   - Check if ticket exists in database
   - Ensure QR code is not damaged

3. **Claiming Issues**:
   - Confirm ticket is a winner
   - Check if already claimed
   - Verify all required fields provided

### Error Codes

- `400`: Invalid format or missing data
- `404`: Ticket not found
- `409`: Ticket already claimed
- `500`: Server error during verification

## 📈 Future Enhancements

### Planned Features

1. **Mobile App**: Dedicated mobile app for verification
2. **Bulk Verification**: Scan multiple tickets at once
3. **NFC Support**: Near-field communication for verification
4. **Biometric Claiming**: Fingerprint verification for high-value claims
5. **SMS Notifications**: Claim confirmations via SMS

### API Versioning

Current implementation uses `/api/v1/` endpoints. Future versions will maintain backward compatibility while adding new features.

---

## 📞 Support

For technical support or questions about the QR ticket system:

1. Check this documentation first
2. Review error logs in the audit system
3. Test with sample data provided above
4. Contact system administrator if issues persist

**System Status**: ✅ Active and Ready for Production Use
