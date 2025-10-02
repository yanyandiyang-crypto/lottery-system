import QRCode from 'qrcode';

/**
 * Generate QR code as base64 data URL (offline, no external API needed)
 * @param {string} text - Text to encode in QR code
 * @param {number} size - Size of QR code in pixels (default: 100)
 * @returns {Promise<string>} Base64 data URL
 */
export async function generateQRCodeDataURL(text, size = 100) {
  try {
    const dataURL = await QRCode.toDataURL(text, {
      width: size,
      margin: 0,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return dataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    // Fallback to empty data URL if generation fails
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  }
}

/**
 * Generate QR code synchronously (for templates that need immediate rendering)
 * Note: This is a workaround - ideally use async version
 * @param {string} text - Text to encode
 * @param {number} size - Size in pixels
 * @returns {string} Placeholder or cached QR code
 */
export function generateQRCodeSync(text, size = 100) {
  // Return a placeholder - actual QR will be generated async
  // This is used when templates need immediate HTML
  return `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="#fff"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="10" fill="#666">
        Loading QR...
      </text>
    </svg>
  `)}`;
}

export default {
  generateQRCodeDataURL,
  generateQRCodeSync
};
