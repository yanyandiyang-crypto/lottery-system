import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CogIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import ModernTable from '../../components/UI/ModernTable';

const FunctionManagement = () => {
  const { user } = useAuth();
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    category: '',
    isActive: true
  });
  const [permissions, setPermissions] = useState({
    admin: true,
    area_coordinator: true,
    coordinator: true
  });

  const categories = [
    'Management',
    'User Management', 
    'System Management',
    'Operations',
    'Reports',
    'General',
    'Ticket Management'
  ];

  const roles = [
    { key: 'admin', label: 'Admin' },
    { key: 'area_coordinator', label: 'Area Coordinator' },
    { key: 'coordinator', label: 'Coordinator' }
  ];

  useEffect(() => {
    fetchFunctions();
  }, []);

  const fetchFunctions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/function-management/functions');
      setFunctions(response.data.data);
    } catch (err) {
      setError('Failed to fetch functions');
      console.error('Error fetching functions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFunction = async (e) => {
    e.preventDefault();
    try {
      await api.post('/function-management/functions', formData);
      setShowCreateModal(false);
      resetForm();
      fetchFunctions();
    } catch (err) {
      setError('Failed to create function');
      console.error('Error creating function:', err);
    }
  };

  const handleEditFunction = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/function-management/functions/${selectedFunction.id}`, formData);
      setShowEditModal(false);
      setSelectedFunction(null);
      resetForm();
      fetchFunctions();
    } catch (err) {
      setError('Failed to update function');
      console.error('Error updating function:', err);
    }
  };

  const handleDeleteFunction = async (functionId) => {
    if (window.confirm('Are you sure you want to delete this function?')) {
      try {
        await api.delete(`/function-management/functions/${functionId}`);
        fetchFunctions();
      } catch (err) {
        setError('Failed to delete function');
        console.error('Error deleting function:', err);
      }
    }
  };

  const handleUpdatePermissions = async () => {
    try {
      await api.put('/function-management/permissions', {
        functionId: selectedFunction.id,
        rolePermissions: permissions
      });
      setShowPermissionsModal(false);
      setSelectedFunction(null);
      fetchFunctions();
    } catch (err) {
      setError('Failed to update permissions');
      console.error('Error updating permissions:', err);
    }
  };

  const openEditModal = (func) => {
    setSelectedFunction(func);
    setFormData({
      name: func.name,
      key: func.key,
      description: func.description || '',
      category: func.category || '',
      isActive: func.isActive
    });
    setShowEditModal(true);
  };

  const openPermissionsModal = (func) => {
    setSelectedFunction(func);
    const currentPermissions = {
      admin: true,
      area_coordinator: true,
      coordinator: true
    };
    
    // Set current permissions based on existing data
    func.rolePermissions.forEach(perm => {
      currentPermissions[perm.role] = perm.isEnabled;
    });
    
    setPermissions(currentPermissions);
    setShowPermissionsModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      key: '',
      description: '',
      category: '',
      isActive: true
    });
  };

  const initializeFunctions = async () => {
    try {
      await api.post('/function-management/initialize');
      
      // Add Agent Tickets function if it doesn't exist
      const agentTicketsFunction = {
        name: 'Agent Tickets',
        key: 'agent_tickets',
        description: 'View and manage agent lottery tickets with reprint functionality',
        category: 'Ticket Management',
        isActive: true
      };
      
      try {
        await api.post('/function-management/functions', agentTicketsFunction);
      } catch (err) {
        // Function might already exist, ignore error
        console.log('Agent Tickets function may already exist');
      }
      
      fetchFunctions();
    } catch (err) {
      setError('Failed to initialize functions');
      console.error('Error initializing functions:', err);
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="Function Management"
          subtitle="Control which features are visible to different user roles"
          icon={CogIcon}
        >
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {functions.length === 0 && (
              <ModernButton
                onClick={initializeFunctions}
                variant="success"
                size="md"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Initialize Functions
              </ModernButton>
            )}
            <ModernButton
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              size="md"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Function
            </ModernButton>
          </div>
        </PageHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <ModernCard className="overflow-hidden">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">System Functions</h2>
            <p className="text-sm text-gray-600 mt-1">Manage feature visibility and role permissions</p>
          </div>
          
          {functions.length === 0 ? (
            <div className="text-center py-12">
              <CogIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Functions Found</h3>
              <p className="text-gray-600 mb-4">Initialize the system functions to get started</p>
              <ModernButton
                onClick={initializeFunctions}
                variant="primary"
                size="md"
              >
                <CogIcon className="h-4 w-4 mr-2" />
                Initialize Functions
              </ModernButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <ModernTable
                headers={[
                  { key: 'function', label: 'Function' },
                  { key: 'category', label: 'Category' },
                  { key: 'key', label: 'Key' },
                  { key: 'status', label: 'Status' },
                  { key: 'permissions', label: 'Role Permissions' },
                  { key: 'actions', label: 'Actions' }
                ]}
                data={functions.map((func) => ({
                  function: (
                    <div>
                      <div className="text-sm font-medium text-gray-900">{func.name}</div>
                      <div className="text-sm text-gray-500">{func.description}</div>
                    </div>
                  ),
                  category: (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {func.category}
                    </span>
                  ),
                  key: (
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs">{func.key}</code>
                  ),
                  status: (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      func.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {func.isActive ? 'Active' : 'Inactive'}
                    </span>
                  ),
                  permissions: (
                    <div className="flex flex-wrap gap-1">
                      {roles.map(role => {
                        const permission = func.rolePermissions.find(p => p.role === role.key);
                        const isEnabled = permission?.isEnabled || false;
                        return (
                          <span
                            key={role.key}
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                              isEnabled 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {isEnabled ? <CheckIcon className="h-3 w-3 mr-1" /> : <XMarkIcon className="h-3 w-3 mr-1" />}
                            {role.label}
                          </span>
                        );
                      })}
                    </div>
                  ),
                  actions: (
                    <div className="flex space-x-1">
                      <ModernButton
                        onClick={() => openPermissionsModal(func)}
                        variant="secondary"
                        size="sm"
                        title="Manage Permissions"
                      >
                        <CogIcon className="h-3 w-3" />
                      </ModernButton>
                      <ModernButton
                        onClick={() => openEditModal(func)}
                        variant="primary"
                        size="sm"
                        title="Edit"
                      >
                        <PencilIcon className="h-3 w-3" />
                      </ModernButton>
                      <ModernButton
                        onClick={() => handleDeleteFunction(func.id)}
                        variant="danger"
                        size="sm"
                        title="Delete"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </ModernButton>
                    </div>
                  )
                }))}
                emptyMessage="No functions found"
              />
            </div>
          )}
        </ModernCard>

        {/* Modern Create Function Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <ModernCard className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Create New Function</h3>
                <p className="text-sm text-gray-600 mt-1">Add a new system function</p>
              </div>
              <div className="p-6">
                <form onSubmit={handleCreateFunction} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter function name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Key *</label>
                    <input
                      type="text"
                      value={formData.key}
                      onChange={(e) => setFormData({...formData, key: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., users, balance_management"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                      rows="3"
                      placeholder="Enter function description"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4">
                    <ModernButton
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
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
                      Create Function
                    </ModernButton>
                  </div>
                </form>
              </div>
            </ModernCard>
          </div>
        )}

      {/* Edit Function Modal */}
      {showEditModal && selectedFunction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Function</h3>
              <form onSubmit={handleEditFunction}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key *</label>
                  <input
                    type="text"
                    value={formData.key}
                    onChange={(e) => setFormData({...formData, key: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedFunction(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Update Function
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedFunction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Manage Permissions: {selectedFunction.name}
              </h3>
              <div className="space-y-4">
                {roles.map(role => (
                  <div key={role.key} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{role.label}</span>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={permissions[role.key]}
                        onChange={(e) => setPermissions({
                          ...permissions,
                          [role.key]: e.target.checked
                        })}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Enabled</span>
                    </label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPermissionsModal(false);
                    setSelectedFunction(null);
                  }}
                  className="px-4 py-2 text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePermissions}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default FunctionManagement;
