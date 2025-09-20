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
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
        autoConnect: true,
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
          toast.success(
            `New ticket: ${data.agentName} - ${data.betType} ₱${data.betAmount} on ${data.betDigits}`,
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

