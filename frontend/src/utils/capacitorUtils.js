/**
 * Capacitor Utilities - Stub version for non-Capacitor webview apps
 * All Capacitor dependencies removed - using browser APIs only
 */

class CapacitorUtils {
  // Check if running on native platform (always false now)
  static isNative() {
    return false;
  }

  // Initialize app (no-op without Capacitor)
  static async initializeApp() {
    // Capacitor disabled
    return;
  }

  // Camera utilities - Use browser MediaDevices API
  static async takePicture() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      
      stream.getTracks().forEach(track => track.stop());
      
      return canvas.toDataURL('image/jpeg', 0.9);
    } catch (error) {
      console.error('Error taking picture:', error);
      throw error;
    }
  }

  // Share ticket images - Use Web Share API
  static async shareTicket(title, text, imageUrl = null) {
    if (!navigator.share) {
      throw new Error('Web Share API not supported');
    }
    
    try {
      const shareOptions = {
        title: title,
        text: text
      };

      if (imageUrl) {
        shareOptions.url = imageUrl;
      }

      await navigator.share(shareOptions);
    } catch (error) {
      console.error('Error sharing ticket:', error);
      throw error;
    }
  }

  // Network status monitoring - Use Navigator API
  static async getNetworkStatus() {
    return {
      connected: navigator.onLine,
      connectionType: navigator.connection?.effectiveType || 'unknown'
    };
  }

  // Listen for network changes - Use browser events
  static onNetworkChange(callback) {
    window.addEventListener('online', () => {
      callback({ connected: true, connectionType: 'unknown' });
    });
    window.addEventListener('offline', () => {
      callback({ connected: false, connectionType: 'none' });
    });
  }

  // Keyboard utilities - Blur active element
  static async hideKeyboard() {
    if (document.activeElement) {
      document.activeElement.blur();
    }
  }

  // Show keyboard - Focus on element (no-op)
  static async showKeyboard() {
    // Browser handles keyboard automatically
    return;
  }

  // Listen for keyboard events - Use window resize
  static onKeyboardChange(callback) {
    let lastHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight;
      const heightDiff = lastHeight - currentHeight;
      
      if (heightDiff > 100) {
        callback({ visible: true, height: heightDiff });
      } else if (heightDiff < -100) {
        callback({ visible: false, height: 0 });
      }
      
      lastHeight = currentHeight;
    });
  }

  // Enhanced share for ticket images - Web Share API
  static async shareTicketImage(ticketData, imageBlob) {
    if (!navigator.share) {
      throw new Error('Web Share API not supported');
    }
    
    try {
      await navigator.share({
        title: `Lottery Ticket #${ticketData.ticketNumber}`,
        text: `My lottery ticket for draw ${ticketData.drawId}`,
        files: [new File([imageBlob], 'ticket.png', { type: 'image/png' })]
      });
    } catch (error) {
      console.error('Web share failed:', error);
      throw error;
    }
  }

  // Get current location - Browser Geolocation API
  static async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        }),
        (error) => reject(error)
      );
    });
  }

  // Watch location changes - Browser Geolocation API
  static async watchLocation(callback) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }
    return navigator.geolocation.watchPosition(
      (position) => callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp
      }),
      (error) => console.error('Location watch error:', error)
    );
  }

  // Clear location watch - Browser API
  static async clearLocationWatch(watchId) {
    if (navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  }

  // Check location permissions - Permissions API
  static async checkLocationPermissions() {
    if (!navigator.permissions) {
      return { location: 'granted' };
    }
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return { location: result.state };
    } catch (error) {
      return { location: 'prompt' };
    }
  }

  // Request location permissions - Triggered by getCurrentLocation
  static async requestLocationPermissions() {
    // Browser requests permission automatically when accessing geolocation
    return { location: 'prompt' };
  }
}

export default CapacitorUtils;
