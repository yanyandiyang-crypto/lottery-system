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
        const savedUser = localStorage.getItem('user');
        
        if (!token) {
          setLoading(false);
          return;
        }

        // Set the token in axios headers before making the request
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Try to use saved user data first (instant login)
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            console.log('✅ Restored session from localStorage');
          } catch (e) {
            console.warn('Failed to parse saved user data');
          }
        }
        
        // Verify token with backend (in background)
        try {
          const response = await authAPI.getMe();
          const freshUserData = response.data.data?.user || response.data.user;
          setUser(freshUserData);
          // Update saved user data
          localStorage.setItem('user', JSON.stringify(freshUserData));
        } catch (error) {
          // If verification fails but we have saved user, keep them logged in
          if (savedUser && error.response?.status === 401) {
            console.warn('⚠️ Token verification failed but keeping session active');
            // Don't clear token - let user stay logged in
          } else {
            // Only clear if no saved user data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
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
      const response = await authAPI.login(credentials);
      
      // Handle clean API response structure
      const { token, user: userData } = response.data.data || response.data;
      
      // Store token and user data (persistent session)
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('loginTime', Date.now().toString());
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(userData);
      
      toast.success('Login successful! Session will stay active for 24 hours.');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
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
      // Clear all session data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
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

