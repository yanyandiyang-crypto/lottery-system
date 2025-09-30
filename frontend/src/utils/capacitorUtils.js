import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Share } from '@capacitor/share';
import { Network } from '@capacitor/network';
import { Geolocation } from '@capacitor/geolocation';

class CapacitorUtils {
  // Check if running on native platform
  static isNative() {
    return Capacitor.isNativePlatform();
  }

  // Initialize app on native platforms
  static async initializeApp() {
    if (!this.isNative()) return;

    try {
      // Hide splash screen after app loads
      await SplashScreen.hide();
      
      // Set status bar style
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#0ea5e9' });
      
      console.log('Capacitor app initialized successfully');
    } catch (error) {
      console.error('Error initializing Capacitor app:', error);
    }
  }

  // Camera utilities for QR scanning and ticket photos
  static async takePicture() {
    if (!this.isNative()) {
      throw new Error('Camera only available on native platforms');
    }

    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      return image.dataUrl;
    } catch (error) {
      console.error('Error taking picture:', error);
      throw error;
    }
  }

  // Share ticket images
  static async shareTicket(title, text, imageUrl = null) {
    try {
      const shareOptions = {
        title: title,
        text: text,
        dialogTitle: 'Share Lottery Ticket'
      };

      if (imageUrl) {
        shareOptions.url = imageUrl;
      }

      await Share.share(shareOptions);
    } catch (error) {
      console.error('Error sharing ticket:', error);
      throw error;
    }
  }

  // Network status monitoring
  static async getNetworkStatus() {
    try {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType
      };
    } catch (error) {
      console.error('Error getting network status:', error);
      return { connected: true, connectionType: 'unknown' };
    }
  }

  // Listen for network changes
  static onNetworkChange(callback) {
    if (!this.isNative()) return;

    Network.addListener('networkStatusChange', callback);
  }

  // Keyboard utilities
  static async hideKeyboard() {
    if (!this.isNative()) return;
    
    try {
      await Keyboard.hide();
    } catch (error) {
      console.error('Error hiding keyboard:', error);
    }
  }

  // Show keyboard
  static async showKeyboard() {
    if (!this.isNative()) return;
    
    try {
      await Keyboard.show();
    } catch (error) {
      console.error('Error showing keyboard:', error);
    }
  }

  // Listen for keyboard events
  static onKeyboardChange(callback) {
    if (!this.isNative()) return;

    Keyboard.addListener('keyboardWillShow', (info) => {
      callback({ visible: true, height: info.keyboardHeight });
    });

    Keyboard.addListener('keyboardWillHide', () => {
      callback({ visible: false, height: 0 });
    });
  }

  // Enhanced share for ticket images with native sharing
  static async shareTicketImage(ticketData, imageBlob) {
    if (!this.isNative()) {
      // Fallback to web sharing
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Lottery Ticket #${ticketData.ticketNumber}`,
            text: `My lottery ticket for draw ${ticketData.drawId}`,
            files: [new File([imageBlob], 'ticket.png', { type: 'image/png' })]
          });
        } catch (error) {
          console.error('Web share failed:', error);
        }
      }
      return;
    }

    try {
      // Convert blob to base64 for native sharing
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;
        await this.shareTicket(
          `Lottery Ticket #${ticketData.ticketNumber}`,
          `My lottery ticket for draw ${ticketData.drawId}`,
          base64Data
        );
      };
      reader.readAsDataURL(imageBlob);
    } catch (error) {
      console.error('Error sharing ticket image:', error);
      throw error;
    }
  }

  // Get current location
  static async getCurrentLocation() {
    if (!this.isNative()) {
      // Fallback to browser geolocation
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
            timestamp: position.timestamp
          }),
          (error) => reject(error)
        );
      });
    }

    try {
      const position = await Geolocation.getCurrentPosition();
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp
      };
    } catch (error) {
      console.error('Error getting location:', error);
      throw error;
    }
  }

  // Watch location changes
  static async watchLocation(callback) {
    if (!this.isNative()) {
      // Fallback to browser geolocation
      if (!navigator.geolocation) {
        throw new Error('Geolocation not supported');
      }
      return navigator.geolocation.watchPosition(
        (position) => callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        }),
        (error) => console.error('Location watch error:', error)
      );
    }

    try {
      const watchId = await Geolocation.watchPosition({}, callback);
      return watchId;
    } catch (error) {
      console.error('Error watching location:', error);
      throw error;
    }
  }

  // Clear location watch
  static async clearLocationWatch(watchId) {
    if (!this.isNative()) {
      if (navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      return;
    }

    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (error) {
      console.error('Error clearing location watch:', error);
    }
  }

  // Check location permissions
  static async checkLocationPermissions() {
    if (!this.isNative()) {
      return { location: 'granted' };
    }

    try {
      const permissions = await Geolocation.checkPermissions();
      return permissions;
    } catch (error) {
      console.error('Error checking location permissions:', error);
      return { location: 'denied' };
    }
  }

  // Request location permissions
  static async requestLocationPermissions() {
    if (!this.isNative()) {
      return { location: 'granted' };
    }

    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      throw error;
    }
  }
}

export default CapacitorUtils;
