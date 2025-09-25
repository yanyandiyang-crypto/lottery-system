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
        console.error('Error fetching notifications:', error);
      }
      // Set empty state on error
      setNotifications([]);
      setNotificationCount(0);
    }
  };

  // Refresh balance every 15 seconds for more live updates
  useEffect(() => {
    if (canViewBalance) {
      const interval = setInterval(fetchUserBalance, 15000);
      return () => clearInterval(interval);
    }
  }, [canViewBalance]);

  // Refresh notifications every 60 seconds
  useEffect(() => {
    if (user?.id) {
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Listen for real-time balance update events
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
      console.error('Error fetching user balance:', err);
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center gap-x-1 sm:gap-x-2 lg:gap-x-4 border-b border-gray-200 bg-white px-1 sm:px-2 lg:px-4 xl:px-8 shadow-sm">
      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-1.5 p-1.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-4 sm:h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-2 sm:gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1"></div>
        
        <div className="flex items-center gap-x-1 sm:gap-x-2 lg:gap-x-4">
          {/* Connection Status - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-x-2">
            <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs text-gray-500">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Balance Display - Responsive for all users */}
          {canViewBalance && (
            <div 
              className="flex items-center gap-x-1 bg-green-50 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg transition-all duration-300 hover:bg-green-100"
              data-balance-display
            >
              <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-green-600 font-medium hidden sm:block">Balance</span>
                {balanceLoading ? (
                  <div className="h-3 sm:h-4 w-6 sm:w-8 lg:w-12 bg-green-200 rounded animate-pulse"></div>
                ) : (
                  <span className="text-xs sm:text-sm font-bold text-green-700 truncate transition-all duration-200">
                    ₱{userBalance?.currentBalance?.toLocaleString() || '0'}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notifications */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1 p-1 sm:-m-2.5 sm:p-2.5 text-gray-400 hover:text-gray-500 relative">
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" aria-hidden="true" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? '9+' : notificationCount}
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
              <Menu.Items className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((notification) => (
                      <Menu.Item key={notification.id}>
                        {({ active }) => (
                          <div
                            className={`${
                              active ? 'bg-gray-50' : ''
                            } px-4 py-3 border-b border-gray-100 cursor-pointer`}
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
                                  console.error('Error marking notification as read:', error);
                                  
                                  // If notification not found (404), refresh the notifications list
                                  if (error.response?.status === 404) {
                                    console.log('Notification not found, refreshing notifications list...');
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

          {/* Profile dropdown */}
          <Menu as="div" className="relative flex-shrink-0">
            <Menu.Button className="-m-1 p-1 sm:-m-1.5 sm:p-1.5 flex items-center">
              <span className="sr-only">Open user menu</span>
              <div className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-medium text-xs sm:text-sm">
                  {user?.fullName?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="ml-2 lg:ml-4 text-sm font-semibold leading-6 text-gray-900 truncate max-w-20 xl:max-w-none" aria-hidden="true">
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
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } block w-full text-left px-3 py-1 text-sm leading-6 text-gray-900`}
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
