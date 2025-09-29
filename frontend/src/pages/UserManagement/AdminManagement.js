import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  XCircleIcon,
  CalendarDaysIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import ModernTable from '../../components/UI/ModernTable';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const AdminManagement = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'admin',
    isActive: true
  });

  const canViewSuperAdmins = user?.role === 'superadmin';

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userAPI.getUsers({});
      
      // The backend returns data in response.data.data format
      let adminData = response.data.data;
      
      // Ensure adminData is an array
      if (!Array.isArray(adminData)) {
        adminData = [];
      }
      
      // Filter for admin and superadmin roles only, then filter out SuperAdmins unless current user is SuperAdmin
      const adminRoleUsers = adminData.filter(user => 
        user && (user.role === 'admin' || user.role === 'superadmin')
      );
      
      const filteredAdmins = (canViewSuperAdmins 
        ? adminRoleUsers 
        : adminRoleUsers.filter(admin => admin && admin.role !== 'superadmin'))
        .filter(admin => admin != null); // Remove null/undefined entries
      
      setAdmins(filteredAdmins);
      setError(null);
    } catch (err) {
      const errorMessage = 'Failed to fetch administrators';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  }, [canViewSuperAdmins]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Username, email, and password are required');
      return;
    }
    
    try {
      // Convert isActive to status for backend compatibility
      const submitData = {
        ...formData,
        status: formData.isActive ? 'active' : 'inactive'
      };
      delete submitData.isActive; // Remove isActive field
      
      await userAPI.createUser(submitData);
      
      toast.success('Administrator created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchAdmins();
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create administrator';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error creating admin:', err);
      console.error('Error response:', err.response?.data);
    }
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Don't update password if empty
      }
      
      // Convert isActive to status for backend compatibility
      if (updateData.hasOwnProperty('isActive')) {
        updateData.status = updateData.isActive ? 'active' : 'inactive';
        delete updateData.isActive;
      }
      
      await userAPI.updateUser(selectedAdmin.id, updateData);
      toast.success('Administrator updated successfully');
      setShowEditModal(false);
      setSelectedAdmin(null);
      resetForm();
      fetchAdmins();
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update administrator';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error updating admin:', err);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (window.confirm('Are you sure you want to permanently delete this administrator? This action cannot be undone.')) {
      try {
        await userAPI.deleteUser(adminId, { force: true });
        toast.success('Administrator deleted successfully');
        setError(null); // Clear any previous errors
        fetchAdmins();
      } catch (err) {
        const errorMessage = err.response?.data?.message || 'Failed to delete administrator';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error deleting admin:', err);
      }
    }
  };

  const handleToggleStatus = async (adminId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await userAPI.updateUser(adminId, { status: newStatus });
      toast.success(`Administrator ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
      fetchAdmins();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update administrator status';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error updating admin status:', err);
    }
  };

  const openEditModal = (admin) => {
    if (!admin) {
      console.error('Admin data is undefined');
      return;
    }
    
    setSelectedAdmin(admin);
    setFormData({
      username: admin.username || '',
      email: admin.email || '',
      password: '', // Don't pre-fill password
      fullName: admin.fullName || '',
      role: admin.role || 'admin',
      isActive: admin.status === 'active'
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      role: 'admin',
      isActive: true
    });
  };

  const getRoleIcon = (role) => {
    if (role === 'superadmin') {
      return <ShieldCheckIcon className="h-4 w-4 text-red-600" />;
    } else if (role === 'operator') {
      return <ComputerDesktopIcon className="h-4 w-4 text-purple-600" />;
    } else {
      return <UserIcon className="h-4 w-4 text-blue-600" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    if (role === 'superadmin') {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (role === 'operator') {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading administrators..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="Administrator Management"
          subtitle="Manage system administrators, operators, and their permissions"
          icon={ShieldCheckIcon}
        >
          <ModernButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Create Admin/Operator</span>
            <span className="sm:hidden">Create</span>
          </ModernButton>
        </PageHeader>

        {error && (
          <ModernCard className="mb-8 border-l-4 border-red-500 bg-red-50">
            <div className="p-4">
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                <div className="text-red-700 font-medium">{error}</div>
              </div>
            </div>
          </ModernCard>
        )}

        <ModernCard>
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 mr-3 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Administrators & Operators</h2>
                <p className="text-sm text-gray-600 mt-1">Manage system access and permissions</p>
              </div>
            </div>
          </div>
          
          <ModernTable
            columns={[
              {
                key: 'user',
                label: 'Administrator',
                render: (value, admin) => (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        {admin && getRoleIcon(admin.role)}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {admin?.fullName || admin?.username}
                      </div>
                      <div className="text-sm text-gray-500">@{admin?.username}</div>
                      <div className="sm:hidden mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${admin && getRoleBadgeColor(admin.role)}`}>
                          {admin?.role}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: 'role',
                label: 'Role',
                className: 'hidden sm:table-cell',
                render: (value, admin) => (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${admin && getRoleBadgeColor(admin.role)}`}>
                    {admin?.role}
                  </span>
                )
              },
              {
                key: 'email',
                label: 'Email',
                className: 'hidden lg:table-cell',
                render: (value, admin) => (
                  <div className="flex items-center">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-900">{admin?.email}</span>
                  </div>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (value, admin) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    admin?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {admin?.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                )
              },
              {
                key: 'created',
                label: 'Created',
                className: 'hidden lg:table-cell',
                render: (value, admin) => (
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {admin?.createdAt ? new Date(admin.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                )
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (value, admin) => (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <ModernButton
                      onClick={() => handleToggleStatus(admin?.id, admin?.status)}
                      variant={admin?.status === 'active' ? "danger" : "success"}
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {admin?.status === 'active' ? (
                        <>
                          <EyeSlashIcon className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </ModernButton>
                    <ModernButton
                      onClick={() => openEditModal(admin)}
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </ModernButton>
                    {(admin?.role !== 'superadmin' || canViewSuperAdmins) && admin?.id !== user?.id && (
                      <ModernButton
                        onClick={() => handleDeleteAdmin(admin?.id)}
                        variant="danger"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Delete
                      </ModernButton>
                    )}
                  </div>
                )
              }
            ]}
            data={admins}
            emptyMessage={
              <div className="text-center py-12">
                <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No administrators found</h3>
                <p className="text-sm text-gray-500">Get started by creating your first administrator.</p>
              </div>
            }
          />
        </ModernCard>

        {/* Create Administrator Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-4">
            <div className="relative top-10 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
            <div className="mt-3">
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Create New Admin/Operator</h3>
              <form onSubmit={handleCreateAdmin}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Only SuperAdmin can create other SuperAdmins and Operators */}
                {canViewSuperAdmins && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="operator">Operator</option>
                      <option value="superadmin">SuperAdmin</option>
                    </select>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <ModernButton
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    variant="ghost"
                    size="md"
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </ModernButton>
                  <ModernButton
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Account
                  </ModernButton>
                </div>
              </form>
            </div>
            </div>
          </div>
        )}

        {/* Edit Administrator Modal */}
        {showEditModal && selectedAdmin && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-4">
            <div className="relative top-10 sm:top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-xl bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Account</h3>
              <form onSubmit={handleEditAdmin}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password (leave empty to keep current)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password or leave empty"
                  />
                </div>

                {/* Only SuperAdmin can change roles */}
                {canViewSuperAdmins && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="operator">Operator</option>
                      <option value="superadmin">SuperAdmin</option>
                    </select>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <ModernButton
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedAdmin(null);
                      resetForm();
                    }}
                    variant="ghost"
                    size="md"
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </ModernButton>
                  <ModernButton
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Update Account
                  </ModernButton>
                </div>
              </form>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminManagement;
