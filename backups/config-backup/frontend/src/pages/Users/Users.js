import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { 
  MagnifyingGlassIcon,
  UserIcon,
  UsersIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, activeTab, searchTerm]);

  const filterUsers = () => {
    let filtered = users;
    
    // Hide SuperAdmin users from regular admin view
    if (user.role !== 'superadmin') {
      filtered = filtered.filter(userData => userData.role !== 'superadmin');
    }
    
    // Filter by role
    if (activeTab !== 'all') {
      filtered = filtered.filter(userData => userData.role === activeTab);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(userData => 
        userData.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userData.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (userData.fullName && userData.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredUsers(filtered);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
      setUsers([]); // Ensure users is always an array
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', name: 'All Users', icon: UsersIcon },
    { id: 'area_coordinator', name: 'Area Coordinators', icon: UserGroupIcon },
    { id: 'coordinator', name: 'Coordinators', icon: UserIcon },
    { id: 'agent', name: 'Agents', icon: UserIcon }
  ];

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError('Failed to update user role');
      console.error('Error updating user role:', err);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      if (newStatus === 'active') {
        const confirmed = window.confirm('Unlock this user and set status to Active?');
        if (!confirmed) return;
      } else if (newStatus === 'suspended') {
        const confirmed = window.confirm('Suspend this user?');
        if (!confirmed) return;
      } else if (newStatus === 'inactive') {
        const confirmed = window.confirm('Deactivate this user?');
        if (!confirmed) return;
      }

      const response = await api.put(`/users/${userId}/status`, { status: newStatus });
      console.log('Status update response:', response.data);
      
      // Update the user in the local state immediately
      setUsers(prevUsers => 
        prevUsers.map(userData => 
          userData.id === userId 
            ? { ...userData, status: newStatus }
            : userData
        )
      );
      
      // Also refresh from server to ensure consistency
      fetchUsers();

      try {
        // Optional: show toast if available
        if (window?.toast) {
          window.toast.success(newStatus === 'active' ? 'User unlocked' : `Status set to ${newStatus}`);
        }
      } catch {}
    } catch (err) {
      setError('Failed to update user status');
      console.error('Error updating user status:', err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/users/${userId}`);
      setError(null); // Clear any previous errors
      fetchUsers(); // Refresh the list
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-2">Manage users and their roles</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="text-sm text-gray-500">
                Total Users: {users.length}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const count = tab.id === 'all' 
                  ? filteredUsers.length 
                  : users.filter(u => u.role === tab.id && (user.role === 'superadmin' || u.role !== 'superadmin')).length;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                    <span className={`${
                      isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    } ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {activeTab === 'all' ? 'All Users' : 
               activeTab === 'area_coordinator' ? 'Area Coordinators' :
               activeTab === 'coordinator' ? 'Coordinators' : 'Agents'}
            </h2>
          </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((userData) => (
                <tr key={userData.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {userData.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {userData.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {userData.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(user.role === 'admin' || user.role === 'superadmin') ? (
                      <select
                        value={userData.role}
                        onChange={(e) => handleRoleChange(userData.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                        disabled={userData.id === user.id} // Can't change own role
                      >
                        <option value="agent">Agent</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="area_coordinator">Area Coordinator</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userData.role === 'agent' ? 'bg-blue-100 text-blue-800' :
                        userData.role === 'coordinator' ? 'bg-green-100 text-green-800' :
                        userData.role === 'area_coordinator' ? 'bg-purple-100 text-purple-800' :
                        userData.role === 'admin' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {userData.role === 'area_coordinator' ? 'Area Coordinator' :
                         userData.role === 'superadmin' ? 'Super Admin' :
                         userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      userData.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : userData.status === 'suspended'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {userData.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(userData.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {userData.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(userData.id, 'inactive')}
                            className="inline-flex items-center px-3 py-1 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            disabled={userData.id === user.id}
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                            Deactivate
                          </button>
                          <button
                            onClick={() => handleStatusChange(userData.id, 'suspended')}
                            className="inline-flex items-center px-3 py-1 border border-yellow-300 text-sm leading-4 font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                            disabled={userData.id === user.id}
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Suspend
                          </button>
                        </>
                      )}
                      {userData.status === 'inactive' && (
                        <button
                          onClick={() => handleStatusChange(userData.id, 'active')}
                          className="inline-flex items-center px-3 py-1 border border-green-300 text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          disabled={userData.id === user.id}
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Activate
                        </button>
                      )}
                      {userData.status === 'suspended' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(userData.id, 'active')}
                            className="inline-flex items-center px-3 py-1 border border-green-300 text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            disabled={userData.id === user.id}
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Unlock
                          </button>
                          <button
                            onClick={() => handleStatusChange(userData.id, 'inactive')}
                            className="inline-flex items-center px-3 py-1 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            disabled={userData.id === user.id}
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                            </svg>
                            Deactivate
                          </button>
                        </>
                      )}
                      {/* Delete button - only show for non-current user */}
                      {userData.id !== user.id && (
                        <button
                          onClick={() => handleDeleteUser(userData.id)}
                          className="inline-flex items-center px-3 py-1 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Users;

