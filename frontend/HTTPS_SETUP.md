# HTTPS Setup for QR Scanner Mobile Support

## Why HTTPS is Required
- Camera access (`getUserMedia`) requires HTTPS on mobile devices
- PWA features need secure context
- QR scanner won't work on HTTP in production

## Option 1: Local HTTPS Development

### Install mkcert (Recommended)
```bash
# Install mkcert
npm install -g mkcert

# Create local CA
mkcert -install

# Generate certificates
mkcert localhost 127.0.0.1 ::1
```

### Start React with HTTPS
```bash
# Set environment variable
set HTTPS=true
set SSL_CRT_FILE=localhost+2.pem
set SSL_KEY_FILE=localhost+2-key.pem

# Start development server
npm start
```

## Option 2: ngrok Tunnel (Easy Mobile Testing)

### Install ngrok
```bash
npm install -g ngrok
```

### Start tunnel
```bash
# Start React app normally
npm start

# In another terminal, create HTTPS tunnel
ngrok http 3002
```

### Access via HTTPS
- Use the `https://xxxxx.ngrok.io` URL
- Test on mobile devices using this URL

## Option 3: Production Deployment
- Deploy to Vercel/Netlify (automatic HTTPS)
- Deploy to Render (automatic HTTPS)
- Use Cloudflare for HTTPS proxy

## Testing QR Scanner
1. Open app in HTTPS URL
2. Navigate to Ticket Claiming
3. Click "Scan QR Code"
4. Allow camera permissions
5. Point camera at QR code

## Mobile Testing Checklist
- ✅ HTTPS URL
- ✅ Camera permissions allowed
- ✅ PWA manifest loaded
- ✅ Service worker registered
- ✅ QR scanner UI appears
- ✅ Camera stream visible
- ✅ QR code detection working

## Troubleshooting
- **Camera not working**: Check HTTPS and permissions
- **PWA not installing**: Verify manifest.json
- **QR not scanning**: Ensure good lighting and focus
- **Mobile issues**: Test with ngrok HTTPS tunnel
