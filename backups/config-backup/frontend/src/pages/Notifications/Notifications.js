import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

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

  const canCreateNotifications = ['superadmin', 'admin', 'area_coordinator'].includes(user.role);

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
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-2">Manage system notifications and announcements</p>
        </div>
        {canCreateNotifications && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Notification
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white p-6 rounded-lg shadow ${
              !notification.isRead ? 'border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {notification.title}
                  </h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                    {notificationTypes.find(nt => nt.id === notification.type)?.name}
                  </span>
                  {!notification.isRead && (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      New
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-3">{notification.message}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Created: {new Date(notification.createdAt).toLocaleString()}</span>
                  <span>Target: {notification.targetRoles?.join(', ') || 'All Users'}</span>
                  <span>By: {notification.createdBy?.username || 'System'}</span>
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                {!notification.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Mark as Read
                  </button>
                )}
                {canCreateNotifications && (
                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No notifications found.</p>
        </div>
      )}

      {/* Create Notification Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Notification</h3>
              <form onSubmit={handleCreateNotification}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={newNotification.type}
                    onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {notificationTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Roles
                  </label>
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <label key={role.id} className="flex items-center">
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
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{role.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Create Notification
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;

