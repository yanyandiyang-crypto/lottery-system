import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Configure axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Set the token in axios headers before making the request
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const response = await authAPI.getMe();
        setUser(response.data.data?.user || response.data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear invalid token
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      
      // Add timeout for Android 6 (15 seconds)
      const loginTimeout = setTimeout(() => {
        setLoading(false);
        toast.error('Login timeout. Please check your connection and try again.');
      }, 15000);
      
      const response = await authAPI.login(credentials);
      clearTimeout(loginTimeout);
      
      // Clear SSL retry count on success
      if (window.sslRetryCount) window.sslRetryCount = 0;
      
      // Handle clean API response structure
      const { token, user: userData } = response.data.data || response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      toast.success('Login successful!');
      return { success: true };
    } catch (error) {
      // Check for SSL/TLS errors on Android 6-8
      const isSSLError = error.code === 'ERR_NETWORK' || 
                        error.message?.includes('SSL') || 
                        error.message?.includes('certificate') ||
                        error.message?.includes('ECONNREFUSED');
      
      if (isSSLError && /Android [6-8]/.test(navigator.userAgent)) {
        toast.error('Connection failed. Android ' + navigator.userAgent.match(/Android ([0-9])/)?.[1] + ' SSL issue. Try switching network or use WiFi.', {
          duration: 8000
        });
      } else {
        const message = error.response?.data?.message || 'Login failed. Please try again.';
        toast.error(message);
      }
      
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await authAPI.changePassword(passwordData);
      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
      return { success: false, message };
    }
  };

  const updateUser = (userData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const canManageUser = (targetUserId) => {
    if (!user) return false;
    
    // SuperAdmin and Admin can manage everyone
    if (['superadmin', 'admin'].includes(user.role)) {
      return true;
    }
    
    // Area coordinators can manage users in their region
    if (user.role === 'area_coordinator') {
      // This would need to be checked against the target user's region
      return true; // Simplified for now
    }
    
    // Coordinators can manage their agents
    if (user.role === 'coordinator') {
      // This would need to be checked against the target user's coordinator
      return true; // Simplified for now
    }
    
    return false;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    changePassword,
    updateUser,
    hasRole,
    canManageUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

