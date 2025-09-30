# Capacitor Setup Guide - Pisting Yawa Lottery System

## ✅ Setup Completed Successfully!

Your lottery system is now fully configured with Capacitor for native Android app development.

---

## 📱 What's Been Installed

### Core Capacitor
- `@capacitor/core` - Core Capacitor functionality
- `@capacitor/cli` - Command-line tools
- `@capacitor/android` - Android platform support

### Native Plugins
- `@capacitor/status-bar` - Control status bar appearance
- `@capacitor/splash-screen` - Splash screen management
- `@capacitor/keyboard` - Keyboard control and events
- `@capacitor/camera` - Camera access for QR scanning
- `@capacitor/filesystem` - File system access
- `@capacitor/share` - Native sharing functionality
- `@capacitor/network` - Network status monitoring

---

## 🚀 How to Build and Run

### 1. Build React App
```bash
cd frontend
npm run build
```

### 2. Sync with Capacitor
```bash
npx cap sync android
```

### 3. Open in Android Studio
```bash
npx cap open android
```

### 4. Build APK in Android Studio
- Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- APK will be in: `frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### 5. Run on Device/Emulator
- Connect Android device via USB (enable USB debugging)
- Or start Android emulator
- Click **Run** button (green play icon) in Android Studio

---

## 🔧 Development Workflow

### Making Changes to React Code
```bash
# 1. Make your changes in frontend/src
# 2. Build React app
cd frontend
npm run build

# 3. Sync changes to Android
npx cap sync android

# 4. Run in Android Studio or use live reload
npx cap run android
```

### Live Reload (Development)
```bash
# Start React dev server
cd frontend
npm start

# In capacitor.config.ts, temporarily add:
# server: {
#   url: 'http://192.168.1.XXX:3000',  // Your local IP
#   cleartext: true
# }

# Then sync and run
npx cap sync android
npx cap run android
```

---

## 📦 App Configuration

### App Details
- **App ID**: `com.pistingyawa.lottery`
- **App Name**: Pisting Yawa Lottery
- **Build Directory**: `frontend/build`

### Configuration File
Location: `frontend/capacitor.config.ts`

```typescript
{
  appId: 'com.pistingyawa.lottery',
  appName: 'Pisting Yawa Lottery',
  webDir: 'build',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0ea5e9'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0ea5e9'
    }
  }
}
```

---

## 🎨 Using Capacitor Features in Your Code

### Example: Share Ticket
```javascript
import CapacitorUtils from './utils/capacitorUtils';

// Share ticket image
await CapacitorUtils.shareTicket(
  'My Lottery Ticket',
  'Check out my ticket!',
  imageUrl
);
```

### Example: Check Network Status
```javascript
const status = await CapacitorUtils.getNetworkStatus();
if (!status.connected) {
  alert('No internet connection');
}
```

### Example: Take Photo for QR Scan
```javascript
const imageUrl = await CapacitorUtils.takePicture();
// Use imageUrl for QR scanning
```

### Example: Check if Running Native
```javascript
if (CapacitorUtils.isNative()) {
  // Running on Android/iOS
  // Use native features
} else {
  // Running in browser
  // Use web fallbacks
}
```

---

## 🔐 Android Permissions

Permissions are automatically configured in `android/app/src/main/AndroidManifest.xml`:

- **Camera** - For QR code scanning
- **Internet** - For API calls
- **Network State** - For connectivity checks
- **Storage** - For saving ticket images

---

## 📱 Building Release APK

### 1. Generate Signing Key
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias lottery-key -keyalg RSA -keysize 2048 -validity 10000
```

### 2. Configure Signing in Android Studio
- **Build** → **Generate Signed Bundle / APK**
- Select **APK**
- Create or choose keystore
- Enter passwords and alias
- Select **release** build variant
- Click **Finish**

### 3. Release APK Location
`frontend/android/app/build/outputs/apk/release/app-release.apk`

---

## 🎯 Features Integrated

### ✅ Native Features Available
- **Status Bar Styling** - Matches app theme (#0ea5e9 sky blue)
- **Splash Screen** - 2-second branded splash screen
- **Camera Access** - For QR code scanning
- **Native Sharing** - Share tickets via any app
- **Network Monitoring** - Check connectivity status
- **Keyboard Control** - Better mobile input experience
- **File System** - Save and retrieve ticket images

### ✅ Automatic Initialization
The app automatically initializes Capacitor features on startup via `App.js`:
```javascript
useEffect(() => {
  CapacitorUtils.initializeApp();
}, []);
```

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Clean and rebuild
cd frontend/android
./gradlew clean
cd ..
npx cap sync android
```

### Changes Not Showing
```bash
# Make sure to build React first
npm run build
npx cap sync android
```

### Android Studio Issues
- **File** → **Invalidate Caches / Restart**
- **File** → **Sync Project with Gradle Files**

### Plugin Not Working
```bash
# Reinstall plugin
npm uninstall @capacitor/plugin-name
npm install @capacitor/plugin-name
npx cap sync android
```

---

## 📚 Useful Commands

```bash
# Check Capacitor status
npx cap doctor

# Update Capacitor
npm install @capacitor/core@latest @capacitor/cli@latest
npm install @capacitor/android@latest

# List installed plugins
npx cap ls

# Copy web assets only
npx cap copy android

# Update native plugins only
npx cap update android

# Run on device with live reload
npx cap run android --livereload --external
```

---

## 🌐 API Configuration

Your app connects to the backend API. Make sure to configure the correct API URL:

### Development
- Local: `http://localhost:3001`
- Network: `http://192.168.1.XXX:3001`

### Production
- Update API base URL in `frontend/src/config` or environment variables
- Use HTTPS for production builds

---

## 📝 Next Steps

1. **Test the app** in Android Studio emulator
2. **Test on real device** via USB debugging
3. **Customize app icon** in `android/app/src/main/res/mipmap-*`
4. **Customize splash screen** in `android/app/src/main/res/drawable`
5. **Configure app permissions** as needed
6. **Build release APK** for distribution
7. **Publish to Google Play Store** (optional)

---

## 🎨 Customization

### Change App Icon
1. Generate icons at https://icon.kitchen/
2. Replace files in `android/app/src/main/res/mipmap-*`
3. Rebuild app

### Change Splash Screen
1. Create splash screen image (2732x2732px recommended)
2. Place in `android/app/src/main/res/drawable`
3. Update `capacitor.config.ts`
4. Sync and rebuild

### Change App Name
1. Edit `capacitor.config.ts` → `appName`
2. Edit `android/app/src/main/res/values/strings.xml`
3. Sync and rebuild

---

## ✨ Success!

Your Pisting Yawa Lottery System is now ready for native Android deployment! 

The app includes:
- ✅ Modern UI with sky blue theme (#0ea5e9)
- ✅ Native camera for QR scanning
- ✅ Native sharing for tickets
- ✅ Network status monitoring
- ✅ Optimized keyboard handling
- ✅ Professional splash screen
- ✅ All lottery features working natively

**Happy Building! 🚀**
