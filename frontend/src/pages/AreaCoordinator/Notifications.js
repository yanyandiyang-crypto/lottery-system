import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { BellIcon, CheckIcon, CalendarDaysIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import { getCurrentDatePH } from '../../utils/dateUtils';

const AreaCoordinatorNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: getCurrentDatePH(),
    type: 'all',
    status: 'all' // all, read, unread
  });

  const notificationTypes = [
    { id: 'info', name: 'Information', color: 'bg-blue-100 text-blue-800' },
    { id: 'success', name: 'Success', color: 'bg-green-100 text-green-800' },
    { id: 'warning', name: 'Warning', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'win', name: 'Winning Ticket', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'error', name: 'Error', color: 'bg-red-100 text-red-800' }
  ];

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      const payload = response.data;
      const list = Array.isArray(payload) ? payload : (payload?.data || []);
      setNotifications(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Error marking notification as read:', err);
      if (err.response?.status === 404) {
        fetchNotifications();
      } else {
        setError('Failed to mark notification as read');
      }
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      fetchNotifications();
      setError(null);
    } catch (err) {
      setError('Failed to delete notification');
      console.error('Error deleting notification:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      if (unreadNotifications.length === 0) {
        return;
      }
      
      await Promise.all(
        unreadNotifications.map(notification => 
          api.put(`/notifications/${notification.id}/read`)
        )
      );
      
      fetchNotifications();
      setError(null);
    } catch (err) {
      setError('Failed to mark all notifications as read');
      console.error('Error marking all as read:', err);
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filters.startDate) {
      const notificationDate = new Date(notification.createdAt).toISOString().split('T')[0];
      if (notificationDate < filters.startDate) return false;
    }
    if (filters.endDate) {
      const notificationDate = new Date(notification.createdAt).toISOString().split('T')[0];
      if (notificationDate > filters.endDate) return false;
    }
    if (filters.type !== 'all' && notification.type !== filters.type) {
      return false;
    }
    if (filters.status === 'read' && !notification.isRead) {
      return false;
    }
    if (filters.status === 'unread' && notification.isRead) {
      return false;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeColor = (type) => {
    const notificationType = notificationTypes.find(nt => nt.id === type);
    return notificationType?.color || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
        <PageHeader
          title="My Notifications"
          icon={BellIcon}
          subtitle="View and manage notifications"
        >
          <div className="flex flex-wrap gap-2">
            <ModernButton
              onClick={() => setShowFilters(!showFilters)}
              variant="secondary"
              size="md"
            >
              <CalendarDaysIcon className="h-4 w-4 mr-2" />
              Filters
            </ModernButton>
            
            {unreadCount > 0 && (
              <ModernButton
                onClick={handleMarkAllAsRead}
                variant="success"
                size="md"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Mark All Read ({unreadCount})
              </ModernButton>
            )}
          </div>
        </PageHeader>

        {error && (
          <ModernCard className="mb-6 border-l-4 border-red-500 bg-red-50">
            <div className="p-4">
              <div className="text-red-700 font-medium">{error}</div>
            </div>
          </ModernCard>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <ModernCard className="mb-6">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Notifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Types</option>
                    {notificationTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="unread">Unread Only</option>
                    <option value="read">Read Only</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <ModernButton
                  onClick={() => setFilters({
                    startDate: '',
                    endDate: getCurrentDatePH(),
                    type: 'all',
                    status: 'all'
                  })}
                  variant="secondary"
                  size="sm"
                >
                  Clear Filters
                </ModernButton>
                <div className="text-sm text-gray-600 flex items-center">
                  Showing {filteredNotifications.length} of {notifications.length} notifications
                </div>
              </div>
            </div>
          </ModernCard>
        )}

        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <ModernCard
              key={notification.id}
              className={`transition-all duration-200 hover:shadow-sm ${
                !notification.isRead ? 'border-l-4 border-blue-500' : ''
              } ${
                notification.type === 'win' ? 'border-l-4 border-yellow-500 bg-yellow-50' : ''
              }`}
            >
              <div className="p-2 sm:p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {notification.title}
                      </h3>
                      <span className={`inline-flex px-1 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${getTypeColor(notification.type)}`}>
                        {notificationTypes.find(nt => nt.id === notification.type)?.name || notification.type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1 leading-tight">{notification.message}</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                      <span className="text-xs">
                        📅 {new Date(notification.createdAt).toLocaleString('en-PH', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {notification.relatedTicket && (
                        <span className="text-xs">
                          🎫 {notification.relatedTicket.ticketNumber}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!notification.isRead && (
                      <ModernButton
                        onClick={() => handleMarkAsRead(notification.id)}
                        variant="secondary"
                        size="sm"
                        className="!text-xs !px-1.5 !py-0.5 !rounded-md !min-h-0 h-auto"
                      >
                        Read
                      </ModernButton>
                    )}
                    <ModernButton
                      onClick={() => {
                        if (window.confirm('Delete?')) {
                          handleDeleteNotification(notification.id);
                        }
                      }}
                      variant="danger"
                      size="sm"
                      className="!text-xs !px-1.5 !py-0.5 !rounded-md !min-h-0 h-auto"
                    >
                      Delete
                    </ModernButton>
                  </div>
                </div>
              </div>
            </ModernCard>
          ))}
        </div>

        {filteredNotifications.length === 0 && !loading && (
          <ModernCard className="text-center py-12">
            <div className="flex flex-col items-center">
              <BellIcon className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">
                {notifications.length === 0 ? 'No notifications yet' : 'No notifications match your filters'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {notifications.length === 0 
                  ? 'You will be notified about winning tickets and important updates'
                  : 'Try adjusting your filter criteria'
                }
              </p>
            </div>
          </ModernCard>
        )}
      </div>
    </div>
  );
};

export default AreaCoordinatorNotifications;

