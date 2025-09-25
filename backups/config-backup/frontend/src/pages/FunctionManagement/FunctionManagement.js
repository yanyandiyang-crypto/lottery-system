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
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Function Management</h1>
          <p className="text-gray-600 mt-2">Control which features are visible to different user roles</p>
        </div>
        <div className="flex space-x-3">
          {functions.length === 0 && (
            <button
              onClick={initializeFunctions}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <CogIcon className="h-5 w-5 mr-2" />
              Initialize Functions
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Function
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">System Functions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Function
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {functions.map((func) => (
                <tr key={func.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{func.name}</div>
                      <div className="text-sm text-gray-500">{func.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {func.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <code className="bg-gray-100 px-2 py-1 rounded">{func.key}</code>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      func.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {func.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-1">
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openPermissionsModal(func)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Manage Permissions"
                      >
                        <CogIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(func)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFunction(func.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Function Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Function</h3>
              <form onSubmit={handleCreateFunction}>
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
                    placeholder="e.g., users, balance_management"
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

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
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
                    Create Function
                  </button>
                </div>
              </form>
            </div>
          </div>
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
  );
};

export default FunctionManagement;
