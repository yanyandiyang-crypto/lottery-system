// Logo assets as base64 data URLs for ticket templates
// This ensures logos work properly when tickets are shared as images

// Function to convert image file to base64 (for development use)
const convertImageToBase64 = async (imagePath) => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

// Default logo assets - these will be loaded dynamically
export const logoAssets = {
  logo3dDataUrl: null,
  logoUmatikDataUrl: null, 
  logoDataUrl: null, // For pisting-logo.png
};

// Initialize logos by converting them to base64
export const initializeLogos = async () => {
  try {
    // Convert all logos to base64
    const [logo3d, logoUmatik, logoPisting] = await Promise.all([
      convertImageToBase64('/logos/3d-lotto.png'),
      convertImageToBase64('/logos/umatik.png'),
      convertImageToBase64('/logos/pisting-logo.png')
    ]);

    logoAssets.logo3dDataUrl = logo3d;
    logoAssets.logoUmatikDataUrl = logoUmatik;
    logoAssets.logoDataUrl = logoPisting;

    console.log('✅ Logos initialized successfully');
    return logoAssets;
  } catch (error) {
    console.error('❌ Error initializing logos:', error);
    return logoAssets;
  }
};

// Get logo assets (initialize if not already done)
export const getLogoAssets = async () => {
  if (!logoAssets.logo3dDataUrl) {
    await initializeLogos();
  }
  return logoAssets;
};

// Fallback base64 logos (1x1 transparent pixel) if loading fails
export const fallbackLogos = {
  logo3dDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  logoUmatikDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  logoDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
};
