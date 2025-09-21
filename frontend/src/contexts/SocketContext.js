import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'https://lottery-system-tna9.onrender.com', {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        // Connection timeout configuration
        timeout: 45000,           // 45 seconds connection timeout
        forceNew: false,          // Reuse existing connection if available
        // Retry configuration
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 5,
        // Ping/pong configuration
        pingTimeout: 60000,       // 60 seconds
        pingInterval: 25000,      // 25 seconds
        // Upgrade timeout
        upgradeTimeout: 10000,    // 10 seconds
        // Additional options
        rememberUpgrade: true,
        // Debug mode in development
        debug: process.env.NODE_ENV === 'development'
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
        
        // Join user to their role-based room
        newSocket.emit('join-room', {
          userId: user.id,
          role: user.role
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
        
        // Show user-friendly error message for timeout
        if (error.message === 'timeout') {
          toast.error('Connection timeout. Retrying...', {
            duration: 3000,
            icon: '⚠️'
          });
        } else {
          toast.error('Connection failed. Retrying...', {
            duration: 3000,
            icon: '⚠️'
          });
        }
      });

      // Handle reconnection events
      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        setConnected(true);
        toast.success('Connection restored!', {
          duration: 2000,
          icon: '✅'
        });
      });

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Socket reconnection attempt:', attemptNumber);
      });

      newSocket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
      });

      newSocket.on('reconnect_failed', () => {
        console.error('Socket reconnection failed');
        setConnected(false);
        toast.error('Unable to reconnect. Please refresh the page.', {
          duration: 5000,
          icon: '❌'
        });
      });

      // Listen for notifications (toast disabled)
      newSocket.on('notification', (data) => {
        // Toast notification disabled - just log for debugging
        console.log('Notification received:', data);
      });

      // Listen for winning notifications
      newSocket.on('you-won', (data) => {
        const winningPrize = data.totalWinningPrize || data.winningPrize || 0;
        const winningNumbers = data.winningBets ? 
          data.winningBets.map(bet => bet.betCombination).join(', ') : 
          data.betDigits || 'unknown';
        
        toast.success(
          `🎉 Congratulations! You won ₱${winningPrize} with number(s) ${winningNumbers}!`,
          {
            duration: 10000,
            icon: '🏆',
          }
        );
      });

      // Listen for dashboard refresh events
      newSocket.on('dashboard-refresh', (data) => {
        console.log('Dashboard refresh event received:', data);
        
        // Show notification for user deletion/deactivation
        if (data.type === 'user-deleted' || data.type === 'user-deactivated') {
          toast.info('Dashboard data updated - user changes detected', {
            duration: 3000,
            icon: '🔄'
          });
        }
        
        // Emit custom event for components to listen to
        window.dispatchEvent(new CustomEvent('dashboard-refresh', { detail: data }));
      });

      newSocket.on('agent-won', (data) => {
        const winningPrize = data.totalWinningPrize || data.winningPrize || 0;
        const winningNumbers = data.winningBets ? 
          data.winningBets.map(bet => bet.betCombination).join(', ') : 
          data.betDigits || 'unknown';
        
        toast.success(
          `🎊 ${data.agentName} won ₱${winningPrize} with number(s) ${winningNumbers}!`,
          {
            duration: 8000,
            icon: '🎯',
          }
        );
      });

      // Listen for new tickets
      newSocket.on('new-ticket', (data) => {
        if (['coordinator', 'admin', 'superadmin'].includes(user.role)) {
          // Handle multiple bets format
          const betInfo = data.bets && data.bets.length > 0 
            ? `${data.bets.length} bet(s) totaling ₱${data.totalAmount || 0}`
            : `₱${data.totalAmount || 0}`;
          
          const drawTime = data.drawTime || 'unknown draw';
          
          toast.success(
            `New ticket: ${data.agentName || 'Unknown Agent'} - ${betInfo} for ${drawTime}`,
            {
              duration: 5000,
              icon: '🎫',
            }
          );
        }
      });

      // Listen for draw results
      newSocket.on('draw-result', (data) => {
        toast.success(
          `Draw Result: ${data.winningNumber} - ${data.totalWinners} winners, ₱${data.totalPrize} total prize`,
          {
            duration: 10000,
            icon: '🎲',
          }
        );
      });

      // Listen for balance updates
      newSocket.on('balance-updated', (data) => {
        // Dispatch custom event for balance update
        window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: data }));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
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

