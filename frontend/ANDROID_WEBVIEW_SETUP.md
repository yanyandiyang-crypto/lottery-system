# Android WebView Setup Guide

## Project Structure

```
lotteryonline/                          # Your Android project
├── app/
│   ├── src/
│   │   └── main/
│   │       ├── assets/
│   │       │   └── build/              # Copy React build here
│   │       │       ├── index.html
│   │       │       ├── static/
│   │       │       └── ...
│   │       ├── java/
│   │       │   └── com/yourpackage/
│   │       │       └── MainActivity.java
│   │       ├── res/
│   │       └── AndroidManifest.xml
│   └── build.gradle
└── build.gradle
```

## Step 1: Configure AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.pistingyawa.lottery">

    <!-- Required Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

    <!-- Camera features -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.AppCompat.Light.NoActionBar"
        android:usesCleartextTraffic="true">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

## Step 2: Create MainActivity.java

```java
package com.pistingyawa.lottery;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class MainActivity extends Activity {
    private WebView webView;
    private static final int PERMISSION_REQUEST_CODE = 100;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Request permissions
        requestPermissions();

        // Initialize WebView
        webView = findViewById(R.id.webview);
        setupWebView();

        // Load app
        webView.loadUrl("file:///android_asset/build/index.html");
    }

    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        
        // Enable JavaScript
        webSettings.setJavaScriptEnabled(true);
        
        // Enable DOM storage
        webSettings.setDomStorageEnabled(true);
        
        // Enable file access
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        
        // Enable database
        webSettings.setDatabaseEnabled(true);
        
        // Enable caching
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setAppCacheEnabled(true);
        
        // Enable zoom
        webSettings.setSupportZoom(true);
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false);
        
        // Mixed content (HTTPS + HTTP)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
        
        // User agent
        webSettings.setUserAgentString(webSettings.getUserAgentString() + " LotteryApp/1.0");
        
        // Enable debugging (remove for production)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        
        // WebViewClient - Handle page navigation
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                // Allow navigation within app
                if (url.startsWith("file://") || 
                    url.contains("lottery-backend") || 
                    url.contains("localhost")) {
                    return false;
                }
                // Block external navigation
                return true;
            }
        });
        
        // WebChromeClient - Handle permissions and alerts
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                // Grant camera and other permissions
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }
            
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, 
                    GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }
        });
    }

    private void requestPermissions() {
        String[] permissions = {
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.READ_EXTERNAL_STORAGE
        };

        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(this, permission) 
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, permissions, PERMISSION_REQUEST_CODE);
                break;
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
```

## Step 3: Create activity_main.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<RelativeLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent">

    <WebView
        android:id="@+id/webview"
        android:layout_width="match_parent"
        android:layout_height="match_parent" />

</RelativeLayout>
```

## Step 4: Update build.gradle (app level)

```gradle
android {
    compileSdkVersion 34
    
    defaultConfig {
        applicationId "com.pistingyawa.lottery"
        minSdkVersion 24
        targetSdkVersion 34
        versionCode 1
        versionName "1.0"
    }
    
    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
}
```

## Step 5: Build and Deploy

### Copy React Build to Android
```bash
# From frontend directory
npm run build

# Copy to Android assets
xcopy /E /I /Y build "C:\Users\Lags\AndroidStudioProjects\lotteryonline\app\src\main\assets\build"
```

### Build APK
```bash
cd C:\Users\Lags\AndroidStudioProjects\lotteryonline

# Debug build
gradlew assembleDebug

# Release build
gradlew assembleRelease
```

### Install on Device
```bash
# Install debug APK
gradlew installDebug

# Or manually install
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Debugging

### Enable USB Debugging
1. On Android device: Settings > About Phone
2. Tap "Build Number" 7 times
3. Go back to Settings > Developer Options
4. Enable "USB Debugging"

### Debug WebView in Chrome
1. Connect device via USB
2. Open Chrome on computer
3. Navigate to `chrome://inspect`
4. Find your app and click "inspect"
5. Use Chrome DevTools to debug

### View Logs
```bash
# View all logs
adb logcat

# Filter by app
adb logcat | findstr "chromium"

# Clear logs
adb logcat -c
```

## JavaScript Interface (Optional)

If you need native features like thermal printer:

### Add Interface to MainActivity
```java
public class WebAppInterface {
    Context mContext;

    WebAppInterface(Context c) {
        mContext = c;
    }

    @JavascriptInterface
    public void printTicket(String ticketData) {
        // Your thermal printer code here
        Log.d("WebApp", "Print ticket: " + ticketData);
    }
    
    @JavascriptInterface
    public String getDeviceInfo() {
        return Build.MODEL + " " + Build.VERSION.RELEASE;
    }
}

// In onCreate, add interface
webView.addJavascriptInterface(new WebAppInterface(this), "Android");
```

### Call from JavaScript
```javascript
// Check if Android interface exists
if (window.Android) {
    // Call native function
    window.Android.printTicket(JSON.stringify(ticketData));
    
    // Get device info
    const deviceInfo = window.Android.getDeviceInfo();
    console.log('Device:', deviceInfo);
}
```

## Production Checklist

- [ ] Disable WebView debugging: `WebView.setWebContentsDebuggingEnabled(false)`
- [ ] Enable ProGuard minification
- [ ] Sign APK with release keystore
- [ ] Test on multiple Android versions
- [ ] Test camera permissions
- [ ] Test location permissions
- [ ] Test offline mode
- [ ] Optimize images and assets
- [ ] Test on low-end devices
- [ ] Verify API connections work

## Troubleshooting

### WebView shows blank screen
- Check if build files are in `assets/build/`
- Verify `index.html` exists
- Check Chrome DevTools console for errors
- Ensure JavaScript is enabled

### Camera not working
- Check camera permissions in AndroidManifest.xml
- Grant permissions at runtime
- Test with `chrome://inspect` console

### API calls failing
- Add `android:usesCleartextTraffic="true"` to AndroidManifest
- Check CORS settings on backend
- Verify network permissions

### App crashes on startup
- Check logcat for errors: `adb logcat`
- Verify all permissions are declared
- Check if WebView is properly initialized

---

**Your Android WebView app is now ready!** 🚀

The React app will run inside the WebView with full access to camera, location, and other browser APIs.
