import React, { createContext, useContext, useEffect, useState } from 'react';
// import { io } from 'socket.io-client'; // DISABLED - Socket.IO turned off
import { useAuth } from './AuthContext';
// import toast from 'react-hot-toast'; // DISABLED - No real-time notifications

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket] = useState(null); // Socket.IO disabled
  const [connected] = useState(false); // Always disconnected when Socket.IO is off
  const { user } = useAuth();

  useEffect(() => {
    // Socket.IO DISABLED - Backend has real-time features turned off
    // The app works without real-time notifications
    console.log('Socket.IO disabled - real-time features turned off');
    
    // No socket connection - prevents WebSocket errors
    return () => {
      // Cleanup function (no-op when socket is disabled)
    };
  }, [user]);

  const emit = (event, data) => {
    if (socket && connected) {
      socket.emit(event, data);
    }
  };

  const on = (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const value = {
    socket,
    connected,
    emit,
    on,
    off
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

