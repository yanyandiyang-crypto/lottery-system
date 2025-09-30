package com.lottery.lotteryonline;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;

/**
 * Network Monitor - Detects online/offline status and provides callbacks
 */
public class NetworkMonitor {
    private static final String TAG = "NetworkMonitor";
    
    private Context context;
    private ConnectivityManager connectivityManager;
    private NetworkCallback networkCallback;
    private OnNetworkStatusChangeListener listener;
    private boolean isConnected = false;
    
    public interface OnNetworkStatusChangeListener {
        void onNetworkAvailable();
        void onNetworkLost();
    }
    
    public NetworkMonitor(Context context) {
        this.context = context;
        this.connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
    }
    
    /**
     * Start monitoring network status
     */
    public void startMonitoring(OnNetworkStatusChangeListener listener) {
        this.listener = listener;
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            networkCallback = new NetworkCallback();
            connectivityManager.registerDefaultNetworkCallback(networkCallback);
        } else {
            NetworkRequest networkRequest = new NetworkRequest.Builder()
                    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                    .build();
            networkCallback = new NetworkCallback();
            connectivityManager.registerNetworkCallback(networkRequest, networkCallback);
        }
        
        isConnected = isNetworkAvailable();
        Log.d(TAG, "Network monitoring started. Initial status: " + (isConnected ? "Connected" : "Disconnected"));
    }
    
    /**
     * Stop monitoring network status
     */
    public void stopMonitoring() {
        if (networkCallback != null && connectivityManager != null) {
            try {
                connectivityManager.unregisterNetworkCallback(networkCallback);
                Log.d(TAG, "Network monitoring stopped");
            } catch (Exception e) {
                Log.e(TAG, "Error stopping network monitor: " + e.getMessage());
            }
        }
    }
    
    /**
     * Check if network is currently available
     */
    public boolean isNetworkAvailable() {
        if (connectivityManager == null) {
            return false;
        }
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Network network = connectivityManager.getActiveNetwork();
            if (network == null) return false;
            
            NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(network);
            return capabilities != null && (
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                    capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
            );
        } else {
            android.net.NetworkInfo networkInfo = connectivityManager.getActiveNetworkInfo();
            return networkInfo != null && networkInfo.isConnected();
        }
    }
    
    /**
     * Get current connection status
     */
    public boolean isConnected() {
        return isConnected;
    }
    
    /**
     * Network Callback for monitoring changes
     */
    private class NetworkCallback extends ConnectivityManager.NetworkCallback {
        @Override
        public void onAvailable(@NonNull Network network) {
            super.onAvailable(network);
            isConnected = true;
            Log.d(TAG, "✅ Network available");
            if (listener != null) {
                listener.onNetworkAvailable();
            }
        }
        
        @Override
        public void onLost(@NonNull Network network) {
            super.onLost(network);
            isConnected = false;
            Log.d(TAG, "❌ Network lost");
            if (listener != null) {
                listener.onNetworkLost();
            }
        }
        
        @Override
        public void onCapabilitiesChanged(@NonNull Network network, @NonNull NetworkCapabilities networkCapabilities) {
            super.onCapabilitiesChanged(network, networkCapabilities);
            boolean hasInternet = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
            boolean validated = networkCapabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
            
            Log.d(TAG, "Network capabilities changed - Internet: " + hasInternet + ", Validated: " + validated);
        }
    }
}
