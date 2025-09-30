import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { BellIcon, Bars3Icon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import api from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [userBalance, setUserBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);

  // Check if user can view balance (hide for admin and superadmin)
  const canViewBalance = user?.role && ['area_coordinator', 'coordinator', 'agent'].includes(user.role);

  useEffect(() => {
    if (canViewBalance) {
      fetchUserBalance();
    }
    if (user?.id) {
      fetchNotifications();
    }
  }, [canViewBalance, user?.id]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        const notificationsData = response.data.data || [];
        setNotifications(notificationsData);
        setNotificationCount(notificationsData.filter(n => !n.isRead).length);
      }
    } catch (error) {
      // Only log error if it's not an authentication issue
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        // Silently handle notification errors to reduce console noise
      }
      // Set empty state on error
      setNotifications([]);
      setNotificationCount(0);
    }
  };

  // Refresh balance every 30 seconds (reduced from 5s to minimize server load)
  useEffect(() => {
    if (canViewBalance) {
      const interval = setInterval(fetchUserBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [canViewBalance]);

  // Refresh notifications every 2 minutes (reduced from 60s)
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(fetchNotifications, 120000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Listen for real-time balance update events from SocketContext (window event)
  useEffect(() => {
    const handleBalanceUpdate = (event) => {
      if (canViewBalance) {
        // Update balance immediately from socket data if available
        if (event.detail && event.detail.userId === user?.id) {
          setUserBalance(event.detail);
          // Add visual feedback for balance update
          const balanceElement = document.querySelector('[data-balance-display]');
          if (balanceElement) {
            balanceElement.classList.add('animate-pulse');
            setTimeout(() => balanceElement.classList.remove('animate-pulse'), 1000);
          }
        } else {
          // Fallback to fetching from API
          fetchUserBalance();
        }
      }
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    return () => window.removeEventListener('balanceUpdated', handleBalanceUpdate);
  }, [canViewBalance, user?.id]);

  const fetchUserBalance = async () => {
    try {
      setBalanceLoading(true);
      const response = await api.get('/balance/current');
      setUserBalance(response.data);
    } catch (err) {
      // Silently handle balance fetch errors
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="sticky top-0 z-40 flex h-12 sm:h-14 md:h-16 shrink-0 items-center gap-x-1 sm:gap-x-2 lg:gap-x-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-2 sm:px-4 lg:px-6 xl:px-8 shadow-sm">
      {/* Mobile menu button - Enhanced touch target */}
      <button
        type="button"
        className="-m-2 p-2 text-gray-700 lg:hidden touch-target hover:bg-gray-100 rounded-md transition-colors duration-200"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
      </button>

      {/* Separator - Responsive */}
      <div className="h-4 sm:h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-1 sm:gap-x-2 md:gap-x-4 self-stretch lg:gap-x-6">
        {/* Spacer */}
        <div className="flex flex-1"></div>
        
        {/* Header actions - Responsive layout */}
        <div className="flex items-center gap-x-1 sm:gap-x-2 md:gap-x-3 lg:gap-x-4">
          {/* Connection Status - Progressive disclosure */}
          <div className="hidden md:flex items-center gap-x-2">
            <div className={`h-2 w-2 rounded-full transition-colors duration-200 ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs lg:text-sm text-gray-500 font-medium">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Balance Display - Enhanced responsive design */}
          {canViewBalance && (
            <div 
              className="flex items-center gap-x-1 bg-green-50 px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 rounded-md md:rounded-lg transition-all duration-300 hover:bg-green-100 border border-green-200"
              data-balance-display
            >
              <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-green-600 font-medium hidden sm:block">Balance</span>
                {balanceLoading ? (
                  <div className="h-3 sm:h-4 w-8 sm:w-12 md:w-16 bg-green-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-xs sm:text-sm md:text-base font-bold text-green-700 truncate transition-all duration-200">
                    ₱{userBalance?.currentBalance?.toLocaleString() || '0'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notifications - Enhanced touch target */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 p-1.5 sm:-m-2 sm:p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors duration-200 relative touch-target">
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" aria-hidden="true" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {notificationCount > 99 ? '99+' : notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-72 sm:w-80 md:w-96 origin-top-right rounded-lg bg-white py-2 shadow-xl ring-1 ring-gray-900/10 focus:outline-none border border-gray-200">
                <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900">Notifications</h3>
                  {notificationCount > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{notificationCount} unread</p>
                  )}
                </div>
                <div className="max-h-64 sm:max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <Menu.Item key={notification.id}>
                        {({ active }) => (
                          <div
                            className={`${
                              active ? 'bg-gray-50' : ''
                            } px-3 sm:px-4 py-3 sm:py-4 border-b border-gray-100 cursor-pointer touch-target hover:bg-gray-50 transition-colors duration-150`}
                            onClick={async () => {
                              // Mark as read if not already read
                              if (!notification.isRead) {
                                try {
                                  await api.put(`/notifications/${notification.id}/read`);
                                  // Update local state
                                  setNotifications(prev => 
                                    prev.map(n => 
                                      n.id === notification.id 
                                        ? { ...n, isRead: true }
                                        : n
                                    )
                                  );
                                  setNotificationCount(prev => Math.max(0, prev - 1));
                                } catch (error) {
                                  // Silently handle notification read errors
                                  
                                  // If notification not found (404), refresh the notifications list
                                  if (error.response?.status === 404) {
                                    fetchNotifications();
                                  }
                                }
                              }
                              
                              // Navigate to notifications page
                              navigate('/notifications');
                            }}
                          >
                            <div className="flex items-start">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notification.isRead ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="ml-2 h-2 w-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                          </div>
                        )}
                      </Menu.Item>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <BellIcon className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No notifications</p>
                    </div>
                  )}
                </div>
                {notifications.length > 5 && (
                  <div className="px-4 py-2 border-t border-gray-200">
                    <button
                      onClick={() => navigate('/notifications')}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

          {/* Profile dropdown - Enhanced for mobile */}
          <Menu as="div" className="relative flex-shrink-0">
            <Menu.Button className="-m-1.5 p-1.5 sm:-m-2 sm:p-2 flex items-center hover:bg-gray-100 rounded-md transition-colors duration-200 touch-target">
              <span className="sr-only">Open user menu</span>
              <div className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-primary-200">
                <span className="text-primary-600 font-semibold text-xs sm:text-sm md:text-base">
                  {user?.fullName?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden md:flex md:items-center">
                <span className="ml-2 md:ml-3 lg:ml-4 text-sm md:text-base font-semibold leading-6 text-gray-900 truncate max-w-24 lg:max-w-32 xl:max-w-none" aria-hidden="true">
                  {user?.fullName}
                </span>
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-40 sm:w-44 origin-top-right rounded-lg bg-white py-2 shadow-xl ring-1 ring-gray-900/10 focus:outline-none border border-gray-200">
                <div className="px-3 py-2 border-b border-gray-200">
                  <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                </div>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-red-50 text-red-700' : 'text-gray-900'
                      } block w-full text-left px-3 py-2.5 text-sm font-medium transition-colors duration-150 touch-target hover:bg-red-50 hover:text-red-700`}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default Header;
