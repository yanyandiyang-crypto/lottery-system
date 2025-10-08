import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { BellIcon, PlusIcon, TrashIcon, CheckIcon, CalendarDaysIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import { getCurrentDatePH } from '../../utils/dateUtils';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'info',
    targetRoles: []
  });
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
    { id: 'error', name: 'Error', color: 'bg-red-100 text-red-800' }
  ];

  const allRoles = [
    { id: 'superadmin', name: 'Super Admin' },
    { id: 'admin', name: 'Admin' },
    { id: 'area_coordinator', name: 'Area Coordinator' },
    { id: 'coordinator', name: 'Coordinator' },
    { id: 'agent', name: 'Agent' },
    { id: 'operator', name: 'Operator' }
  ];

  // Filter roles based on current user - hide superadmin from admin users
  const roles = user.role === 'admin' 
    ? allRoles.filter(role => role.id !== 'superadmin')
    : allRoles;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      // Backend returns { success, data, pagination }. Guard for both shapes.
      const payload = response.data;
      const list = Array.isArray(payload) ? payload : (payload?.data || []);
      setNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    try {
      await api.post('/notifications', newNotification);
      setShowCreateModal(false);
      setNewNotification({ title: '', message: '', type: 'info', targetRoles: [] });
      fetchNotifications(); // Refresh the list
    } catch (err) {
      setError('Failed to create notification');
      console.error('Error creating notification:', err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      fetchNotifications(); // Refresh the list
    } catch (err) {
      console.error('Error marking notification as read:', err);
      
      // If notification not found (404), just refresh the list
      if (err.response?.status === 404) {
        console.log('Notification not found, refreshing notifications list...');
        fetchNotifications();
      } else {
        setError('Failed to mark notification as read');
      }
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      fetchNotifications(); // Refresh the list
    } catch (err) {
      setError('Failed to delete notification');
      console.error('Error deleting notification:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      if (unreadNotifications.length === 0) {
        setError('No unread notifications to mark as read');
        return;
      }
      
      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map(notification => 
          api.put(`/notifications/${notification.id}/read`)
        )
      );
      
      fetchNotifications(); // Refresh the list
      setError(null);
    } catch (err) {
      setError('Failed to mark all notifications as read');
      console.error('Error marking all as read:', err);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to delete ALL notifications? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete all notifications
      await Promise.all(
        notifications.map(notification => 
          api.delete(`/notifications/${notification.id}`)
        )
      );
      
      fetchNotifications(); // Refresh the list
      setError(null);
    } catch (err) {
      setError('Failed to delete all notifications');
      console.error('Error deleting all notifications:', err);
    }
  };

  const canCreateNotifications = ['superadmin', 'admin'].includes(user.role);

  // Filter notifications based on date and type filters
  const filteredNotifications = notifications.filter(notification => {
    // Date filter
    if (filters.startDate) {
      const notificationDate = new Date(notification.createdAt).toISOString().split('T')[0];
      if (notificationDate < filters.startDate) return false;
    }
    if (filters.endDate) {
      const notificationDate = new Date(notification.createdAt).toISOString().split('T')[0];
      if (notificationDate > filters.endDate) return false;
    }
    
    // Type filter
    if (filters.type !== 'all' && notification.type !== filters.type) {
      return false;
    }
    
    // Status filter (read/unread)
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
        <PageHeader
          title="Notifications"
          icon={BellIcon}
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
            
            {canCreateNotifications && notifications.length > 0 && (
              <ModernButton
                onClick={handleDeleteAllNotifications}
                variant="danger"
                size="md"
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Delete All
              </ModernButton>
            )}
            
            {canCreateNotifications && (
              <ModernButton
                onClick={() => setShowCreateModal(true)}
                variant="primary"
                size="md"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Notification
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-blue-500"
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

        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <ModernCard
              key={notification.id}
              className={`transition-all duration-200 hover:shadow-lg ${
                !notification.isRead ? 'border-l-4 border-red-500' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {notification.title}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                        {notificationTypes.find(nt => nt.id === notification.type)?.name}
                      </span>
                      {!notification.isRead && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4 leading-relaxed">{notification.message}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                      <span className="truncate">Created: {new Date(notification.createdAt).toLocaleString()}</span>
                      <span className="truncate">Target: {notification.targetRoles?.join(', ') || 'All Users'}</span>
                      <span className="truncate">By: {notification.createdBy?.username || 'System'}</span>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2">
                    {!notification.isRead && (
                      <ModernButton
                        onClick={() => handleMarkAsRead(notification.id)}
                        variant="secondary"
                        size="sm"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Mark as Read
                      </ModernButton>
                    )}
                    <ModernButton
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this notification?')) {
                          handleDeleteNotification(notification.id);
                        }
                      }}
                      variant="danger"
                      size="sm"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
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
                {notifications.length === 0 ? 'No notifications found' : 'No notifications match your filters'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {notifications.length === 0 
                  ? 'Notifications will appear here when created'
                  : 'Try adjusting your filter criteria'
                }
              </p>
            </div>
          </ModernCard>
        )}

        {/* Create Notification Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <ModernCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Create New Notification</h3>
                <p className="text-sm text-gray-600 mt-1">Send a notification to selected user roles</p>
              </div>
              <div className="p-6">
                <form onSubmit={handleCreateNotification} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newNotification.title}
                      onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-blue-500"
                      placeholder="Enter notification title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={newNotification.message}
                      onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-blue-500 resize-vertical"
                      rows="4"
                      placeholder="Enter notification message"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-blue-500"
                    >
                      {notificationTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Target Roles
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {roles.map((role) => (
                        <label key={role.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newNotification.targetRoles.includes(role.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewNotification({
                                  ...newNotification,
                                  targetRoles: [...newNotification.targetRoles, role.id]
                                });
                              } else {
                                setNewNotification({
                                  ...newNotification,
                                  targetRoles: newNotification.targetRoles.filter(r => r !== role.id)
                                });
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-red-500 border-gray-300 rounded mr-3"
                          />
                          <span className="text-sm font-medium text-gray-700">{role.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 border-t border-gray-200">
                    <ModernButton
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      variant="secondary"
                      size="md"
                      className="order-2 sm:order-1"
                    >
                      Cancel
                    </ModernButton>
                    <ModernButton
                      type="submit"
                      variant="primary"
                      size="md"
                      className="order-1 sm:order-2"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Notification
                    </ModernButton>
                  </div>
                </form>
              </div>
            </ModernCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

