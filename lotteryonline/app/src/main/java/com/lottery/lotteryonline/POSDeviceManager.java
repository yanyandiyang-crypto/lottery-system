package com.lottery.lotteryonline;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;

public class POSDeviceManager {
    private static final String TAG = "POSDeviceManager";
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
    
    private Context context;
    private BluetoothAdapter bluetoothAdapter;
    private BluetoothSocket bluetoothSocket;
    private OutputStream outputStream;
    private InputStream inputStream;
    private boolean isConnected = false;

    public POSDeviceManager(Context context) {
        this.context = context;
        this.bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
    }

    /**
     * Auto-connect to paired POS devices (printers, card readers, etc.)
     * NO DRIVER INSTALLATION NEEDED - Uses Bluetooth SPP (Serial Port Profile)
     */
    public void autoConnectToPOSDevices() {
        if (bluetoothAdapter == null) {
            Toast.makeText(context, "❌ Bluetooth not supported", Toast.LENGTH_LONG).show();
            Log.e(TAG, "Bluetooth adapter is null");
            return;
        }

        if (!bluetoothAdapter.isEnabled()) {
            Toast.makeText(context, "⚠️ Please enable Bluetooth", Toast.LENGTH_LONG).show();
            Log.w(TAG, "Bluetooth is disabled");
            return;
        }

        // Check permissions
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                Toast.makeText(context, "⚠️ Bluetooth permission needed", Toast.LENGTH_LONG).show();
                Log.w(TAG, "Bluetooth permission not granted");
                return;
            }
        }

        // Get paired devices
        Set<BluetoothDevice> pairedDevices = bluetoothAdapter.getBondedDevices();
        
        Log.d(TAG, "Found " + pairedDevices.size() + " paired devices");
        
        if (pairedDevices.size() > 0) {
            boolean foundPOS = false;
            
            // DEBUG: List all paired devices
            for (BluetoothDevice device : pairedDevices) {
                String deviceName = device.getName();
                Log.d(TAG, "Paired device: " + deviceName + " [" + device.getAddress() + "]");
            }
            
            // Try to connect to POS devices
            for (BluetoothDevice device : pairedDevices) {
                String deviceName = device.getName().toLowerCase();
                
                // Auto-connect to common POS device names
                if (isPOSDevice(deviceName)) {
                    Log.d(TAG, "Found POS device: " + device.getName());
                    Toast.makeText(context, "🔍 Found: " + device.getName(), Toast.LENGTH_SHORT).show();
                    connectToDevice(device);
                    foundPOS = true;
                    break; // Connect to first found POS device
                }
            }
            
            if (!foundPOS) {
                Toast.makeText(context, "⚠️ No POS device found. Please pair your printer first.", Toast.LENGTH_LONG).show();
                Log.w(TAG, "No POS device found in paired devices");
            }
        } else {
            Toast.makeText(context, "⚠️ No paired devices. Go to Settings > Bluetooth to pair.", Toast.LENGTH_LONG).show();
            Log.d(TAG, "No paired Bluetooth devices found");
        }
    }

    /**
     * Check if device is a POS device based on name
     */
    private boolean isPOSDevice(String deviceName) {
        // Common POS device keywords
        String[] posKeywords = {
            "printer", "pos", "receipt", "thermal", "bluetooth printer",
            "card reader", "payment", "terminal", "sunmi", "rongta",
            "xprinter", "goojprt", "zjiang", "bixolon", "epson",
            "star", "citizen", "sewoo", "custom", "pax", "verifone",
            "ingenico", "newland", "urovo", "mobile pos"
        };

        for (String keyword : posKeywords) {
            if (deviceName.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Connect to specific Bluetooth device
     */
    public void connectToDevice(BluetoothDevice device) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                return;
            }
        }

        new Thread(() -> {
            try {
                // Close existing connection
                disconnect();

                // Create socket connection
                bluetoothSocket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                bluetoothSocket.connect();

                outputStream = bluetoothSocket.getOutputStream();
                inputStream = bluetoothSocket.getInputStream();
                isConnected = true;

                Log.d(TAG, "✅ Connected to POS device: " + device.getName());
                
                // Notify on main thread
                ((MainActivity) context).runOnUiThread(() -> {
                    Toast.makeText(context, "✅ Connected: " + device.getName(), Toast.LENGTH_LONG).show();
                });

            } catch (IOException e) {
                Log.e(TAG, "❌ Failed to connect: " + e.getMessage());
                e.printStackTrace();
                isConnected = false;
                
                ((MainActivity) context).runOnUiThread(() -> {
                    Toast.makeText(context, "❌ Connection failed: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
            }
        }).start();
    }

    /**
     * Send data to POS device (for printing, card reading, etc.)
     */
    public boolean sendData(byte[] data) {
        if (!isConnected || outputStream == null) {
            Log.e(TAG, "Not connected to any POS device");
            return false;
        }

        try {
            outputStream.write(data);
            outputStream.flush();
            return true;
        } catch (IOException e) {
            Log.e(TAG, "Failed to send data: " + e.getMessage());
            isConnected = false;
            return false;
        }
    }

    /**
     * Read data from POS device
     */
    public byte[] readData() {
        if (!isConnected || inputStream == null) {
            return null;
        }

        try {
            byte[] buffer = new byte[1024];
            int bytes = inputStream.read(buffer);
            byte[] data = new byte[bytes];
            System.arraycopy(buffer, 0, data, 0, bytes);
            return data;
        } catch (IOException e) {
            Log.e(TAG, "Failed to read data: " + e.getMessage());
            return null;
        }
    }

    /**
     * Disconnect from POS device
     */
    public void disconnect() {
        try {
            if (outputStream != null) {
                outputStream.close();
                outputStream = null;
            }
            if (inputStream != null) {
                inputStream.close();
                inputStream = null;
            }
            if (bluetoothSocket != null) {
                bluetoothSocket.close();
                bluetoothSocket = null;
            }
            isConnected = false;
            Log.d(TAG, "Disconnected from POS device");
        } catch (IOException e) {
            Log.e(TAG, "Error disconnecting: " + e.getMessage());
        }
    }

    /**
     * Check if connected to POS device
     */
    public boolean isConnected() {
        return isConnected;
    }

    /**
     * Get list of paired POS devices
     */
    public Set<BluetoothDevice> getPairedPOSDevices() {
        if (bluetoothAdapter == null) {
            return null;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                return null;
            }
        }

        return bluetoothAdapter.getBondedDevices();
    }

    /**
     * Enable Bluetooth
     */
    public void enableBluetooth() {
        if (bluetoothAdapter != null && !bluetoothAdapter.isEnabled()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (ActivityCompat.checkSelfPermission(context, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                    return;
                }
            }
            bluetoothAdapter.enable();
        }
    }

    /**
     * DEBUG: Test print to verify POS connection
     * Prints a test receipt to check if printer is working
     */
    public void testPrint() {
        if (!isConnected) {
            Toast.makeText(context, "❌ Not connected to printer", Toast.LENGTH_LONG).show();
            Log.e(TAG, "Cannot test print - not connected");
            return;
        }

        new Thread(() -> {
            try {
                // ESC/POS commands for thermal printers
                String testReceipt = 
                    "\n" +
                    "================================\n" +
                    "      🖨️ TEST PRINT 🖨️\n" +
                    "================================\n" +
                    "\n" +
                    "Printer: WORKING ✅\n" +
                    "Connection: SUCCESS ✅\n" +
                    "Date: " + new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()) + "\n" +
                    "\n" +
                    "--------------------------------\n" +
                    "This is a test print from your\n" +
                    "Lottery Online App.\n" +
                    "--------------------------------\n" +
                    "\n" +
                    "If you can read this, your\n" +
                    "POS printer is working!\n" +
                    "\n" +
                    "================================\n" +
                    "\n\n\n";

                // Send test receipt
                boolean success = sendData(testReceipt.getBytes());

                // Cut paper command (ESC/POS)
                byte[] cutPaper = {0x1D, 0x56, 0x00}; // GS V 0
                if (success) {
                    sendData(cutPaper);
                }

                ((MainActivity) context).runOnUiThread(() -> {
                    if (success) {
                        Toast.makeText(context, "✅ Test print sent! Check your printer.", Toast.LENGTH_LONG).show();
                        Log.d(TAG, "Test print successful");
                    } else {
                        Toast.makeText(context, "❌ Test print failed", Toast.LENGTH_LONG).show();
                        Log.e(TAG, "Test print failed");
                    }
                });

            } catch (Exception e) {
                Log.e(TAG, "Test print error: " + e.getMessage());
                e.printStackTrace();
                ((MainActivity) context).runOnUiThread(() -> {
                    Toast.makeText(context, "❌ Print error: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
            }
        }).start();
    }

    /**
     * DEBUG: Get connection status with details
     */
    public String getConnectionStatus() {
        if (bluetoothAdapter == null) {
            return "❌ Bluetooth not supported";
        }
        if (!bluetoothAdapter.isEnabled()) {
            return "⚠️ Bluetooth disabled";
        }
        if (isConnected) {
            return "✅ Connected to POS device";
        }
        return "⚠️ Not connected";
    }
}
