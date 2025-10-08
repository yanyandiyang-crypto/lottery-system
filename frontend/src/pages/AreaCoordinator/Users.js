import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { 
  MagnifyingGlassIcon,
  UserIcon,
  UsersIcon,
  UserGroupIcon,
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import ModernTable from '../../components/UI/ModernTable';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const filterUsers = useCallback(() => {
    // Ensure users is an array before filtering
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }
    
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
  }, [users, activeTab, searchTerm, user.role]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [filterUsers]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/users');
      console.log('Users API response for', user.role, ':', response.data);
      console.log('Current user details:', { 
        role: user.role, 
        id: user.id, 
        regionId: user.regionId,
        coordinatorId: user.coordinatorId 
      });
      
      // Handle the nested data structure: response.data.data.items
      const usersData = response.data.data?.items || response.data.items || response.data.data || [];
      console.log('Extracted users for', user.role, ':', usersData);
      console.log('Number of users found:', usersData.length);
      
      if (usersData.length === 0 && user.role === 'area_coordinator') {
        console.warn('Area coordinator found no users. Check if regionId is set and users exist in this region.');
        console.log('Attempting to fetch all users for debugging...');
        
        // Temporary: Try to fetch all users to see what exists
        try {
          const debugResponse = await api.get('/users', { 
            params: { debug: true } // This might bypass filtering if backend supports it
          });
          console.log('Debug - All users in system:', debugResponse.data);
        } catch (debugErr) {
          console.log('Debug fetch failed, trying admin endpoint...');
        }
      }
      
      setUsers(usersData);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
      setUsers([]); // Ensure users is always an array
    } finally {
      setLoading(false);
    }
  };

  // Filter tabs based on user role
  const allTabs = [
    { id: 'all', name: 'All Users', icon: UsersIcon },
    { id: 'area_coordinator', name: 'Area Coordinators', icon: UserGroupIcon },
    { id: 'coordinator', name: 'Coordinators', icon: UserIcon },
    { id: 'agent', name: 'Agents', icon: UserIcon }
  ];

  const tabs = allTabs.filter(tab => {
    // For area coordinators, hide Area Coordinators tab (they manage coordinators and agents only)
    if (user.role === 'area_coordinator') {
      return tab.id === 'all' || tab.id === 'coordinator' || tab.id === 'agent';
    }
    // For coordinators, hide Area Coordinators and Coordinators tabs
    if (user.role === 'coordinator') {
      return tab.id === 'all' || tab.id === 'agent';
    }
    // For other roles, show all tabs
    return true;
  });

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
        Array.isArray(prevUsers) 
          ? prevUsers.map(userData => 
              userData.id === userId 
                ? { ...userData, status: newStatus }
                : userData
            )
          : []
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">Loading users...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        {/* Modern Header */}
        <PageHeader
          title={<span className="text-[clamp(18px,3.5vw,24px)]">User Management</span>}
        />

        {/* Search Bar */}
        <ModernCard className="p-4 mb-4" variant="glass">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-purple-600" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm transition-all duration-200"
              />
            </div>
            <ModernButton
              variant="ghost"
              size="sm"
              icon={FunnelIcon}
              className="hidden md:inline-flex"
            >
              Filters
            </ModernButton>
          </div>
        </ModernCard>

        {error && (
          <ModernCard className="p-4 mb-6 border-danger-200 bg-danger-50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-danger-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-danger-800">{error}</p>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Compact Tab Navigation */}
        <ModernCard className="mb-4" variant="elevated">
          <div className="px-3 py-2">
            <nav className="flex flex-wrap gap-2" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const count = tab.id === 'all' 
                  ? filteredUsers.length 
                  : Array.isArray(users) ? users.filter(u => u.role === tab.id && (user.role === 'superadmin' || u.role !== 'superadmin')).length : 0;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                    <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </ModernCard>

        {/* Desktop table */}
        <div className="hidden md:block">
          <ModernTable
            loading={loading}
            data={filteredUsers}
            emptyMessage={`No ${activeTab === 'all' ? 'users' : activeTab.replace('_', ' ')} found`}
            columns={[
              {
                key: 'user',
                title: 'User',
                render: (_, userData) => (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center ring-2 ring-white shadow-soft">
                        <span className="text-sm font-bold text-purple-700">{userData.username?.charAt(0).toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-gray-900">{userData.username}</div>
                      <div className="text-sm text-gray-500">{userData.email}</div>
                    </div>
                  </div>
                )
              },
              {
                key: 'role',
                title: 'Role',
                render: (_, userData) => (
                  (user.role === 'admin' || user.role === 'superadmin') ? (
                    <select
                      value={userData.role}
                      onChange={(e) => handleRoleChange(userData.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      disabled={userData.id === user.id}
                    >
                      <option value="agent">Agent</option>
                      <option value="coordinator">Coordinator</option>
                      <option value="area_coordinator">Area Coordinator</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                      userData.role === 'agent' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800' :
                      userData.role === 'coordinator' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800' :
                      userData.role === 'area_coordinator' ? 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800' :
                      userData.role === 'admin' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800' :
                      'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
                    }`}>
                      {userData.role === 'area_coordinator' ? 'Area Coordinator' : userData.role === 'superadmin' ? 'Super Admin' : userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
                    </span>
                  )
                )
              },
              {
                key: 'status',
                title: 'Status',
                render: (_, userData) => (
                  <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                    userData.status === 'active' ? 'bg-gradient-to-r from-success-100 to-success-200 text-success-800' : userData.status === 'suspended' ? 'bg-gradient-to-r from-warning-100 to-warning-200 text-warning-800' : 'bg-gradient-to-r from-danger-100 to-danger-200 text-danger-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${userData.status === 'active' ? 'bg-success-500' : userData.status === 'suspended' ? 'bg-warning-500' : 'bg-danger-500'}`}></div>
                    {userData.status.charAt(0).toUpperCase() + userData.status.slice(1)}
                  </span>
                )
              },
              {
                key: 'createdAt',
                title: 'Created',
                render: (createdAt) => (
                  <div className="text-sm text-gray-600">{new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                )
              },
              {
                key: 'actions',
                title: 'Actions',
                render: (_, userData) => (
                  <div className="flex items-center space-x-2">
                    {userData.status === 'active' && (<><ModernButton variant="danger" size="xs" onClick={() => handleStatusChange(userData.id, 'inactive')} disabled={userData.id === user.id}>Deactivate</ModernButton><ModernButton variant="warning" size="xs" onClick={() => handleStatusChange(userData.id, 'suspended')} disabled={userData.id === user.id}>Suspend</ModernButton></>)}
                    {userData.status === 'inactive' && (<ModernButton variant="success" size="xs" onClick={() => handleStatusChange(userData.id, 'active')} disabled={userData.id === user.id}>Activate</ModernButton>)}
                    {userData.status === 'suspended' && (<><ModernButton variant="success" size="xs" onClick={() => handleStatusChange(userData.id, 'active')} disabled={userData.id === user.id}>Unlock</ModernButton><ModernButton variant="danger" size="xs" onClick={() => handleStatusChange(userData.id, 'inactive')} disabled={userData.id === user.id}>Deactivate</ModernButton></>)}
                    {userData.id !== user.id && (<ModernButton variant="danger" size="xs" onClick={() => handleDeleteUser(userData.id)}>Delete</ModernButton>)}
                  </div>
                )
              }
            ]}
          />
        </div>

        {/* Mobile card list */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredUsers.map((u) => (
            <div key={u.id} className="p-3 rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-purple-700">{u.username?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{u.username}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </div>
                </div>
                <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-700">{u.role === 'area_coordinator' ? 'Area Coordinator' : (u.role || '').replace('_',' ')}</span>
              </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {u.status === 'active' && (<><ModernButton variant="warning" size="xs" onClick={() => handleStatusChange(u.id, 'suspended')} disabled={u.id === user.id}>Suspend</ModernButton><ModernButton variant="danger" size="xs" onClick={() => handleStatusChange(u.id, 'inactive')} disabled={u.id === user.id}>Deactivate</ModernButton></>)}
                {u.status === 'inactive' && (<ModernButton variant="success" size="xs" onClick={() => handleStatusChange(u.id, 'active')} disabled={u.id === user.id}>Activate</ModernButton>)}
                {u.status === 'suspended' && (<><ModernButton variant="success" size="xs" onClick={() => handleStatusChange(u.id, 'active')} disabled={u.id === user.id}>Unlock</ModernButton><ModernButton variant="danger" size="xs" onClick={() => handleStatusChange(u.id, 'inactive')} disabled={u.id === user.id}>Deactivate</ModernButton></>)}
                {u.id !== user.id && (<ModernButton variant="danger" size="xs" onClick={() => handleDeleteUser(u.id)}>Delete</ModernButton>)}
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (<div className="text-center text-gray-500 py-8">No users found</div>)}
        </div>
      </div>
    </div>
  );
};

export default Users;

