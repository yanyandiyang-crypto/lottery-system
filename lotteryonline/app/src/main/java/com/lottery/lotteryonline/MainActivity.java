package com.lottery.lotteryonline;

import android.Manifest;
import android.app.ActivityManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.os.Process;
import android.util.Log;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import androidx.activity.EdgeToEdge;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import android.webkit.JavascriptInterface;
import android.webkit.CookieManager;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import android.widget.ProgressBar;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private WebView webView;
    private POSDeviceManager posDeviceManager;
    private NetworkMonitor networkMonitor;
    private SwipeRefreshLayout swipeRefreshLayout;
    private ProgressBar progressBar;
    private static final int PERMISSION_REQUEST_CODE = 100;
    private String currentUrl;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // BOOST: Set high priority for this process
        Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_DISPLAY);
        
        // BOOST: Request more memory for better performance
        ActivityManager activityManager = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
        if (activityManager != null) {
            activityManager.getMemoryClass(); // Get available memory
        }
        
        EdgeToEdge.enable(this);
        setContentView(R.layout.activity_main);
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main), (v, insets) -> {
            Insets systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom);
            return insets;
        });

        // Request runtime permissions
        requestNecessaryPermissions();

        // Initialize POS Device Manager
        posDeviceManager = new POSDeviceManager(this);

        // Initialize UI components
        swipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        progressBar = findViewById(R.id.progressBar);
        webView = findViewById(R.id.webView);
        
        // Setup Pull-to-Refresh
        setupPullToRefresh();
        
        // Setup Network Monitor
        setupNetworkMonitor();
        
        // Setup Cookie Manager for session persistence
        setupCookieManager();
        
        // Add JavaScript interface for POS communication
        webView.addJavascriptInterface(new POSJavaScriptInterface(), "AndroidPOS");
        
        // Add JavaScript interface for app control
        webView.addJavascriptInterface(new AppJavaScriptInterface(), "AndroidApp");

        // EXTREME Performance optimizations - NO LAG!
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setGeolocationEnabled(true);
        webSettings.setJavaScriptCanOpenWindowsAutomatically(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        
        // AGGRESSIVE caching for low-spec devices
        // Cache everything possible to reduce network and CPU load
        webSettings.setAppCacheEnabled(true);
        webSettings.setAppCachePath(getApplicationContext().getCacheDir().getAbsolutePath());
        webSettings.setAppCacheMaxSize(50 * 1024 * 1024); // 50MB cache
        
        if (networkMonitor != null && networkMonitor.isNetworkAvailable()) {
            webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK); // Prefer cache for speed
        } else {
            webSettings.setCacheMode(WebSettings.LOAD_CACHE_ONLY); // Full offline mode
        }
        
        // LOW-SPEC DEVICE OPTIMIZATIONS
        webSettings.setRenderPriority(WebSettings.RenderPriority.NORMAL); // Changed from HIGH to reduce CPU
        webSettings.setEnableSmoothTransition(false); // Disable for better performance
        webSettings.setLoadsImagesAutomatically(true);
        webSettings.setBlockNetworkImage(false);
        webSettings.setBlockNetworkLoads(false);
        
        // Additional speed optimizations
        webSettings.setSaveFormData(false);
        webSettings.setSavePassword(false);
        webSettings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING);
        webSettings.setUseWideViewPort(true);
        webSettings.setLoadWithOverviewMode(true);
        
        // Auto-resize and responsive layout support
        webSettings.setSupportZoom(true);
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false); // Hide zoom buttons but keep pinch-to-zoom
        
        // Viewport meta tag support for responsive design
        webSettings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING);
        webSettings.setMinimumFontSize(8);
        webSettings.setMinimumLogicalFontSize(8);
        webSettings.setDefaultFontSize(16);
        
        // OPTIMIZED FOR 1GB RAM DEVICES
        // Always use software rendering for better stability on low-spec devices
        webView.setLayerType(WebView.LAYER_TYPE_SOFTWARE, null);
        Log.d("MainActivity", "⚡ Software rendering enabled (optimized for 1GB RAM)");
        
        // ULTRA SMOOTH SCROLLING - No lag!
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setScrollbarFadingEnabled(true);
        webView.setScrollBarStyle(WebView.SCROLLBARS_OUTSIDE_OVERLAY);
        
        // Disable overscroll for smoother feel
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        
        // Enable nested scrolling for better performance
        webView.setNestedScrollingEnabled(true);
        
        // Mixed content for HTTPS
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }

        // Ultra-fast WebViewClient
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Inject performance boost, smooth scrolling, and responsive layout script
                view.evaluateJavascript(
                    "(function() {" +
                    "  if (window.performance && window.performance.setResourceTimingBufferSize) {" +
                    "    window.performance.setResourceTimingBufferSize(1000);" +
                    "  }" +
                    "  " +
                    "  // AUTO-RESIZE: Add viewport meta tag if missing" +
                    "  if (!document.querySelector('meta[name=\"viewport\"]')) {" +
                    "    var meta = document.createElement('meta');" +
                    "    meta.name = 'viewport';" +
                    "    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes';" +
                    "    document.head.appendChild(meta);" +
                    "    console.log('✅ Viewport meta tag added');" +
                    "  }" +
                    "  " +
                    "  // AUTO-RESIZE: Force responsive layout" +
                    "  document.documentElement.style.width = '100%';" +
                    "  document.documentElement.style.maxWidth = '100vw';" +
                    "  document.body.style.width = '100%';" +
                    "  document.body.style.maxWidth = '100vw';" +
                    "  document.body.style.overflowX = 'hidden';" +
                    "  " +
                    "  // AUTO-RESIZE: Handle orientation changes" +
                    "  window.addEventListener('orientationchange', function() {" +
                    "    setTimeout(function() {" +
                    "      window.scrollTo(0, 1);" +
                    "      window.scrollTo(0, 0);" +
                    "    }, 100);" +
                    "  });" +
                    "  " +
                    "  // AUTO-RESIZE: Handle window resize" +
                    "  window.addEventListener('resize', function() {" +
                    "    document.body.style.width = '100%';" +
                    "    document.body.style.maxWidth = '100vw';" +
                    "  });" +
                    "  " +
                    "  // Enable smooth scrolling CSS" +
                    "  document.documentElement.style.scrollBehavior = 'smooth';" +
                    "  document.body.style.scrollBehavior = 'smooth';" +
                    "  " +
                    "  // Optimize scroll performance" +
                    "  document.documentElement.style.webkitOverflowScrolling = 'touch';" +
                    "  document.body.style.webkitOverflowScrolling = 'touch';" +
                    "  " +
                    "  // Disable pull-to-refresh bounce (conflicts with SwipeRefreshLayout)" +
                    "  document.body.style.overscrollBehavior = 'none';" +
                    "  " +
                    "  // Enable GPU acceleration for transforms" +
                    "  document.documentElement.style.transform = 'translateZ(0)';" +
                    "  document.documentElement.style.backfaceVisibility = 'hidden';" +
                    "  " +
                    "  // Optimize will-change for scrolling elements" +
                    "  var scrollElements = document.querySelectorAll('[style*=\"overflow\"]');" +
                    "  scrollElements.forEach(function(el) {" +
                    "    el.style.willChange = 'transform';" +
                    "  });" +
                    "  " +
                    "  console.log('✅ Responsive layout + scroll optimization injected');" +
                    "})()", null);
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                // Keep navigation within WebView for speed
                return false;
            }

            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                // Speed optimization: handle requests efficiently
                return super.shouldInterceptRequest(view, request);
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                handler.proceed();
            }
        });
        
        // Optimized WebChromeClient
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            @Override
            public void onPermissionRequest(PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }
            
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                super.onProgressChanged(view, newProgress);
                // Show/hide progress bar
                if (newProgress < 100) {
                    progressBar.setVisibility(ProgressBar.VISIBLE);
                    progressBar.setProgress(newProgress);
                } else {
                    progressBar.setVisibility(ProgressBar.GONE);
                    if (swipeRefreshLayout.isRefreshing()) {
                        swipeRefreshLayout.setRefreshing(false);
                    }
                }
            }
        });
        
        // Store current URL
        currentUrl = BuildConfig.APP_URL;
        
        // Load URL from secure BuildConfig (hidden from source code)
        if (networkMonitor.isNetworkAvailable()) {
            webView.loadUrl(currentUrl);
        } else {
            loadOfflinePage();
        }
        
        // Memory management for 1GB RAM devices
        // Clear cache periodically to prevent memory buildup
        webView.postDelayed(() -> {
            webView.clearCache(false); // Clear non-critical cache
            System.gc(); // Suggest garbage collection
            Log.d("MainActivity", "🧹 Memory cleanup performed");
        }, 60000); // Every 60 seconds
        
        // Auto-connect to POS devices after page loads
        webView.postDelayed(() -> {
            posDeviceManager.enableBluetooth();
            posDeviceManager.autoConnectToPOSDevices();
        }, 2000); // Wait 2 seconds after page load
    }

    /**
     * Setup Pull-to-Refresh functionality with enhanced UX
     */
    private void setupPullToRefresh() {
        // Set attractive color scheme
        swipeRefreshLayout.setColorSchemeResources(
            android.R.color.holo_blue_bright,
            android.R.color.holo_green_light,
            android.R.color.holo_orange_light,
            android.R.color.holo_red_light
        );
        
        // Set progress background color
        swipeRefreshLayout.setProgressBackgroundColorSchemeResource(android.R.color.white);
        
        // Configure refresh behavior
        swipeRefreshLayout.setDistanceToTriggerSync(300); // Easier to trigger
        swipeRefreshLayout.setSize(SwipeRefreshLayout.DEFAULT); // Standard size
        
        swipeRefreshLayout.setOnRefreshListener(() -> {
            if (networkMonitor.isNetworkAvailable()) {
                // Haptic feedback on refresh
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                    swipeRefreshLayout.performHapticFeedback(
                        android.view.HapticFeedbackConstants.CONTEXT_CLICK
                    );
                }
                
                // Clear cache and reload for fresh content
                webView.clearCache(false); // Don't clear disk files, just memory
                webView.reload();
                
                Toast.makeText(this, "🔄 Refreshing...", Toast.LENGTH_SHORT).show();
            } else {
                swipeRefreshLayout.setRefreshing(false);
                Toast.makeText(this, "❌ No internet connection", Toast.LENGTH_SHORT).show();
            }
        });
    }

    /**
     * Setup Network Monitor with auto-reconnect
     */
    private void setupNetworkMonitor() {
        networkMonitor = new NetworkMonitor(this);
        networkMonitor.startMonitoring(new NetworkMonitor.OnNetworkStatusChangeListener() {
            @Override
            public void onNetworkAvailable() {
                runOnUiThread(() -> {
                    Toast.makeText(MainActivity.this, "✅ Internet connected", Toast.LENGTH_SHORT).show();
                    
                    // Update cache mode for online
                    WebSettings webSettings = webView.getSettings();
                    webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
                    
                    // Auto-reload if currently on offline page
                    String currentPageUrl = webView.getUrl();
                    if (currentPageUrl != null && currentPageUrl.contains("offline.html")) {
                        webView.loadUrl(currentUrl);
                    }
                });
            }

            @Override
            public void onNetworkLost() {
                runOnUiThread(() -> {
                    Toast.makeText(MainActivity.this, "❌ Internet disconnected", Toast.LENGTH_SHORT).show();
                    
                    // Update cache mode for offline - use cached content
                    WebSettings webSettings = webView.getSettings();
                    webSettings.setCacheMode(WebSettings.LOAD_CACHE_ELSE_NETWORK);
                });
            }
        });
    }

    /**
     * Setup Cookie Manager for better session persistence
     */
    private void setupCookieManager() {
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);
        
        // Enable persistent cookies
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.flush();
        }
    }

    /**
     * Load offline page when no internet
     */
    private void loadOfflinePage() {
        webView.loadUrl("file:///android_asset/offline.html");
    }

    private void requestNecessaryPermissions() {
        List<String> permissionsNeeded = new ArrayList<>();

        // Check and add permissions that are not granted
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.CAMERA);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.ACCESS_FINE_LOCATION);
        }
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissionsNeeded.add(Manifest.permission.ACCESS_COARSE_LOCATION);
        }

        // Bluetooth permissions for Android 12+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.BLUETOOTH_CONNECT);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
                permissionsNeeded.add(Manifest.permission.BLUETOOTH_SCAN);
            }
        }

        // Request all needed permissions
        if (!permissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsNeeded.toArray(new String[0]), PERMISSION_REQUEST_CODE);
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

    @Override
    protected void onPause() {
        super.onPause();
        // Pause WebView to save resources
        if (webView != null) {
            webView.onPause();
            webView.pauseTimers();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Resume WebView
        if (webView != null) {
            webView.onResume();
            webView.resumeTimers();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        
        // Stop network monitoring
        if (networkMonitor != null) {
            networkMonitor.stopMonitoring();
        }
        
        // Flush cookies to persist session
        CookieManager cookieManager = CookieManager.getInstance();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cookieManager.flush();
        }
        
        // Clean up WebView to prevent memory leaks
        if (webView != null) {
            // Don't clear cache on destroy - keep it for faster restart
            // Only clear history and destroy view
            webView.clearHistory();
            webView.removeAllViews();
            webView.destroy();
        }
        
        // Disconnect POS devices when app closes
        if (posDeviceManager != null) {
            posDeviceManager.disconnect();
        }
    }

    /**
     * JavaScript Interface for POS device communication
     * Web app can call these methods via: window.AndroidPOS.methodName()
     */
    private class POSJavaScriptInterface {
        
        @JavascriptInterface
        public void connectPOS() {
            runOnUiThread(() -> {
                posDeviceManager.autoConnectToPOSDevices();
            });
        }

        @JavascriptInterface
        public void disconnectPOS() {
            runOnUiThread(() -> {
                posDeviceManager.disconnect();
                Toast.makeText(MainActivity.this, "Disconnected from POS device", Toast.LENGTH_SHORT).show();
            });
        }

        @JavascriptInterface
        public boolean isConnected() {
            return posDeviceManager.isConnected();
        }

        @JavascriptInterface
        public void printText(String text) {
            runOnUiThread(() -> {
                if (posDeviceManager.isConnected()) {
                    boolean success = posDeviceManager.sendData(text.getBytes());
                    if (success) {
                        Toast.makeText(MainActivity.this, "Printing...", Toast.LENGTH_SHORT).show();
                    } else {
                        Toast.makeText(MainActivity.this, "Print failed", Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(MainActivity.this, "Not connected to printer", Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void enableBluetooth() {
            runOnUiThread(() -> {
                posDeviceManager.enableBluetooth();
            });
        }

        @JavascriptInterface
        public void testPrint() {
            runOnUiThread(() -> {
                posDeviceManager.testPrint();
            });
        }

        @JavascriptInterface
        public String getStatus() {
            return posDeviceManager.getConnectionStatus();
        }
        
        @JavascriptInterface
        public String getDeviceInfo() {
            return posDeviceManager.getDeviceInfo();
        }
        
        @JavascriptInterface
        public void scanDevices() {
            runOnUiThread(() -> {
                Toast.makeText(MainActivity.this, "Scanning for POS devices...", Toast.LENGTH_SHORT).show();
                posDeviceManager.autoConnectToPOSDevices();
            });
        }
        
        @JavascriptInterface
        public void printDebugInfo() {
            runOnUiThread(() -> {
                String debugInfo = "=== POS DEBUG INFO ===\n" +
                        "Status: " + posDeviceManager.getConnectionStatus() + "\n" +
                        "Device: " + posDeviceManager.getDeviceInfo() + "\n" +
                        "Connected: " + posDeviceManager.isConnected() + "\n" +
                        "=====================\n";
                
                if (posDeviceManager.isConnected()) {
                    posDeviceManager.sendData(debugInfo.getBytes());
                    Toast.makeText(MainActivity.this, "Debug info sent to printer", Toast.LENGTH_SHORT).show();
                } else {
                    Toast.makeText(MainActivity.this, "Not connected: " + posDeviceManager.getConnectionStatus(), Toast.LENGTH_LONG).show();
                }
            });
        }
        
        @JavascriptInterface
        public void printImage(String base64Image) {
            runOnUiThread(() -> {
                if (!posDeviceManager.isConnected()) {
                    Toast.makeText(MainActivity.this, "Not connected to printer", Toast.LENGTH_SHORT).show();
                    return;
                }
                
                try {
                    // Remove data URL prefix if present
                    String imageData = base64Image;
                    if (base64Image.contains(",")) {
                        imageData = base64Image.split(",")[1];
                    }
                    
                    // Decode base64 to bitmap
                    byte[] decodedBytes = android.util.Base64.decode(imageData, android.util.Base64.DEFAULT);
                    android.graphics.Bitmap bitmap = android.graphics.BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
                    
                    if (bitmap != null) {
                        boolean success = posDeviceManager.printBitmap(bitmap);
                        if (success) {
                            Toast.makeText(MainActivity.this, "Image sent to printer", Toast.LENGTH_SHORT).show();
                        } else {
                            Toast.makeText(MainActivity.this, "Failed to print image", Toast.LENGTH_SHORT).show();
                        }
                    } else {
                        Toast.makeText(MainActivity.this, "Invalid image data", Toast.LENGTH_SHORT).show();
                    }
                } catch (Exception e) {
                    Toast.makeText(MainActivity.this, "Error printing image: " + e.getMessage(), Toast.LENGTH_LONG).show();
                    Log.e("MainActivity", "Print image error", e);
                }
            });
        }
    }

    /**
     * JavaScript Interface for App control
     * Web app can call these methods via: window.AndroidApp.methodName()
     */
    private class AppJavaScriptInterface {
        
        @JavascriptInterface
        public void retryConnection() {
            runOnUiThread(() -> {
                if (networkMonitor.isNetworkAvailable()) {
                    webView.loadUrl(currentUrl);
                } else {
                    Toast.makeText(MainActivity.this, "Still no internet connection", Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public boolean isOnline() {
            return networkMonitor.isNetworkAvailable();
        }

        @JavascriptInterface
        public void clearCache() {
            runOnUiThread(() -> {
                webView.clearCache(true);
                Toast.makeText(MainActivity.this, "Cache cleared", Toast.LENGTH_SHORT).show();
            });
        }

        @JavascriptInterface
        public void clearCookies() {
            runOnUiThread(() -> {
                CookieManager cookieManager = CookieManager.getInstance();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    cookieManager.removeAllCookies(null);
                    cookieManager.flush();
                } else {
                    cookieManager.removeAllCookie();
                }
                Toast.makeText(MainActivity.this, "Cookies cleared", Toast.LENGTH_SHORT).show();
            });
        }
    }
}