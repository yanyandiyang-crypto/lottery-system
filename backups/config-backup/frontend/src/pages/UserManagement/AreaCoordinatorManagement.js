import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { 
  UserIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const AreaCoordinatorManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [areaCoordinators, setAreaCoordinators] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAreaCoordinator, setEditingAreaCoordinator] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    regionName: '',
    assignedCoordinators: [],
    status: 'active'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAreaCoordinators();
    fetchCoordinators();
  }, []);

  const fetchAreaCoordinators = async () => {
    try {
      const response = await userAPI.getUsers({ role: 'area_coordinator' });
      setAreaCoordinators(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch area coordinators');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinators = async () => {
    try {
      const response = await userAPI.getUsers({ role: 'coordinator' });
      setCoordinators(response.data.data);
    } catch (error) {
      console.error('Failed to fetch coordinators:', error);
    }
  };

  const handleCreateAreaCoordinator = () => {
    setEditingAreaCoordinator(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      regionName: '',
      assignedCoordinators: [],
      status: 'active'
    });
    setShowCreateModal(true);
  };

  const handleEditAreaCoordinator = (areaCoordinator) => {
    setEditingAreaCoordinator(areaCoordinator);
    setFormData({
      username: areaCoordinator.username,
      password: '',
      fullName: areaCoordinator.fullName,
      email: areaCoordinator.email || '',
      phone: areaCoordinator.phone || '',
      regionName: areaCoordinator?.region?.name || '',
      // Derive assigned coordinators from the coordinators list by coordinatorId
      assignedCoordinators: coordinators.filter(c => c.coordinatorId === areaCoordinator.id).map(c => c.id),
      status: areaCoordinator.status
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.fullName) {
      toast.error('Username and full name are required');
      return;
    }

    if (!editingAreaCoordinator && !formData.password) {
      toast.error('Password is required for new area coordinators');
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        ...formData,
        role: 'area_coordinator'
      };

      if (editingAreaCoordinator) {
        if (!formData.password) {
          delete submitData.password;
        }
        await userAPI.updateUser(editingAreaCoordinator.id, submitData);
        toast.success('Area coordinator updated successfully');
      } else {
        await userAPI.createUser(submitData);
        toast.success('Area coordinator created successfully');
      }

      setShowCreateModal(false);
      // Refresh both lists so assignments and availability reflect correctly
      fetchAreaCoordinators();
      fetchCoordinators();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save area coordinator');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateAreaCoordinator = async (areaCoordinatorId) => {
    if (!window.confirm('Are you sure you want to deactivate this area coordinator?')) {
      return;
    }

    try {
      await userAPI.updateUser(areaCoordinatorId, { status: 'inactive' });
      toast.success('Area coordinator deactivated successfully');
      fetchAreaCoordinators();
    } catch (error) {
      toast.error('Failed to deactivate area coordinator');
    }
  };

  const handleActivateAreaCoordinator = async (areaCoordinatorId) => {
    try {
      await userAPI.updateUser(areaCoordinatorId, { status: 'active' });
      toast.success('Area coordinator activated successfully');
      fetchAreaCoordinators();
    } catch (error) {
      toast.error('Failed to activate area coordinator');
    }
  };

  const handleDeleteAreaCoordinator = async (areaCoordinatorId) => {
    if (!window.confirm('Are you sure you want to permanently delete this area coordinator? This action cannot be undone.')) {
      return;
    }

    try {
      await userAPI.deleteUser(areaCoordinatorId, { force: true });
      toast.success('Area coordinator deleted successfully');
      fetchAreaCoordinators();
    } catch (error) {
      toast.error('Failed to delete area coordinator');
    }
  };

  const getAssignedCoordinators = (areaCoordinator) => {
    // Coordinators store their Area Coordinator in coordinatorId
    const assigned = coordinators.filter(c => c.coordinatorId === areaCoordinator.id);
    return assigned.length > 0 ? assigned.map(c => c.fullName).join(', ') : 'No coordinators assigned';
  };

  const handleCoordinatorAssignment = (coordinatorId, isChecked) => {
    if (isChecked) {
      setFormData({
        ...formData,
        assignedCoordinators: [...formData.assignedCoordinators, parseInt(coordinatorId)]
      });
    } else {
      setFormData({
        ...formData,
        assignedCoordinators: formData.assignedCoordinators.filter(id => id !== parseInt(coordinatorId))
      });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Area Coordinator Management</h1>
            <p className="text-gray-600">Manage area coordinators and assign coordinators to them</p>
          </div>
          <button
            onClick={handleCreateAreaCoordinator}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Area Coordinator
          </button>
        </div>
      </div>

      {/* Area Coordinators Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">All Area Coordinators ({areaCoordinators.length})</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area Coordinator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Coordinators
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
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
              {areaCoordinators.map((areaCoordinator) => (
                <tr key={areaCoordinator.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{areaCoordinator.fullName}</div>
                        <div className="text-sm text-gray-500">@{areaCoordinator.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getAssignedCoordinators(areaCoordinator)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{areaCoordinator.email || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{areaCoordinator.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      areaCoordinator.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {areaCoordinator.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(areaCoordinator.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEditAreaCoordinator(areaCoordinator)}
                      className="text-primary-600 hover:text-primary-900"
                      title="Edit Area Coordinator"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    {areaCoordinator.status === 'active' ? (
                      <button
                        onClick={() => handleDeactivateAreaCoordinator(areaCoordinator.id)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Deactivate Area Coordinator"
                      >
                        <EyeSlashIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivateAreaCoordinator(areaCoordinator.id)}
                        className="text-green-600 hover:text-green-900"
                        title="Activate Area Coordinator"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAreaCoordinator(areaCoordinator.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Area Coordinator"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingAreaCoordinator ? 'Edit Area Coordinator' : 'Create New Area Coordinator'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password {editingAreaCoordinator && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required={!editingAreaCoordinator}
                />
              </div>

              <div>
              <label className="block text-sm font-medium text-gray-700">Region Name</label>
              <input
                type="text"
                value={formData.regionName}
                onChange={(e) => setFormData({ ...formData, regionName: e.target.value })}
                placeholder="e.g., Cebu City"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">If provided, a region will be created/linked and assigned to this Area Coordinator.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Coordinators</label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {coordinators
                    .filter((coordinator) => {
                      // Show unassigned coordinators or those already assigned to the area coordinator being edited
                      if (editingAreaCoordinator) {
                        return coordinator.coordinatorId == null || coordinator.coordinatorId === editingAreaCoordinator.id;
                      }
                      // For create, only show unassigned coordinators
                      return coordinator.coordinatorId == null;
                    })
                    .map((coordinator) => (
                    <div key={coordinator.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`coordinator-${coordinator.id}`}
                        checked={formData.assignedCoordinators.includes(coordinator.id)}
                        onChange={(e) => handleCoordinatorAssignment(coordinator.id, e.target.checked)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`coordinator-${coordinator.id}`} className="ml-2 text-sm text-gray-700">
                        {coordinator.fullName}
                      </label>
                    </div>
                  ))}
                  {coordinators.filter(c => c.coordinatorId == null).length === 0 && !editingAreaCoordinator && (
                    <p className="text-sm text-gray-500">No coordinators available</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingAreaCoordinator ? 'Update Area Coordinator' : 'Create Area Coordinator')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreaCoordinatorManagement;
