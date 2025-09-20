import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api, { notificationsAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import { 
  BellIcon, 
  TrophyIcon,
  CalendarDaysIcon,
  TicketIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const WinnerNotifications = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, today, week

  const fetchWinnerNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsAPI.getWinnerNotifications({
        filter,
        type: 'win'
      });
      setNotifications(response.data.data);
    } catch (error) {
      console.error('Failed to fetch winner notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWinnerNotifications();
    }
  }, [isOpen, filter]);

  const markAsRead = async (notificationId) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getFilteredNotifications = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'today':
        return notifications.filter(n => new Date(n.createdAt) >= today);
      case 'week':
        return notifications.filter(n => new Date(n.createdAt) >= weekAgo);
      default:
        return notifications;
    }
  };

  // Using utility function for draw time formatting

  if (!isOpen) return null;

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <TrophyIcon className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Winning Numbers Notifications
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 mb-6">
            {[
              { key: 'all', label: 'All Time' },
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'This Week' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  filter === tab.key
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border-l-4 ${
                    notification.isRead 
                      ? 'bg-gray-50 border-l-gray-300' 
                      : 'bg-green-50 border-l-green-400'
                  } hover:shadow-md transition-shadow`}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <TrophyIcon className="h-5 w-5 text-green-500 mr-2" />
                        <h4 className="text-sm font-semibold text-gray-900">
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            New
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3">
                        {notification.message}
                      </p>

                      {notification.relatedTicket && (
                        <div className="bg-white rounded-md p-3 border">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center">
                              <TicketIcon className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-gray-600">Ticket:</span>
                              <span className="ml-1 font-medium">
                                {notification.relatedTicket.ticketNumber}
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <span className="text-gray-600">Combination:</span>
                              <span className="ml-1 font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded">
                                {notification.relatedTicket.betCombination}
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <span className="text-gray-600">Type:</span>
                              <span className="ml-1 font-medium">
                                {notification.relatedTicket.betType}
                              </span>
                            </div>
                            
                            <div className="flex items-center">
                              <CurrencyDollarIcon className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-gray-600">Prize:</span>
                              <span className="ml-1 font-bold text-green-600">
                                ₱{notification.relatedTicket.prizeAmount?.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {notification.relatedDraw && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="flex items-center text-sm text-gray-600">
                                <CalendarDaysIcon className="h-4 w-4 mr-1" />
                                <span>
                                  {formatDrawTime(notification.relatedDraw.drawTime)} - {' '}
                                  {new Date(notification.relatedDraw.drawDate).toLocaleDateString()}
                                </span>
                                <span className="ml-4">
                                  Winning Number: <span className="font-bold text-primary-600">
                                    {notification.relatedDraw.winningNumber}
                                  </span>
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 ml-4">
                      {new Date(notification.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? 'No winning notifications yet.' 
                  : `No winning notifications for ${filter === 'today' ? 'today' : 'this week'}.`
                }
              </p>
            </div>
          )}

          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinnerNotifications;
