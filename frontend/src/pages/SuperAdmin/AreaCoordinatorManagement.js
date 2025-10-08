import React, { useState, useEffect } from 'react';
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
  XMarkIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import ModernTable from '../../components/UI/ModernTable';

const AreaCoordinatorManagement = () => {
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
    if (!areaCoordinator) {
      console.error('Area Coordinator data is undefined');
      return;
    }
    
    setEditingAreaCoordinator(areaCoordinator);
    setFormData({
      username: areaCoordinator.username || '',
      password: '',
      fullName: areaCoordinator.fullName || '',
      email: areaCoordinator.email || '',
      phone: areaCoordinator.phone || '',
      regionName: areaCoordinator?.region?.name || '',
      // Derive assigned coordinators from the coordinators list by coordinatorId
      assignedCoordinators: coordinators.filter(c => c.coordinatorId === areaCoordinator.id).map(c => c.id),
      status: areaCoordinator.status || 'active'
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

    if (!formData.regionName || formData.regionName.trim() === '') {
      toast.error('Region name is required for area coordinators');
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

  if (loading) {
    return <LoadingSpinner message="Loading area coordinators..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
        <PageHeader
          title="Area Coordinator Management"
          icon={MapPinIcon}
        >
          <ModernButton
            onClick={handleCreateAreaCoordinator}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Area Coordinator
          </ModernButton>
        </PageHeader>

        <ModernCard>
          <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <MapPinIcon className="h-6 w-6 mr-3 text-red-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Area Coordinators</h2>
                <p className="text-sm text-gray-600 mt-1">Manage area coordinators and their regional assignments</p>
              </div>
            </div>
          </div>

          <ModernTable
            columns={[
              {
                key: 'areaCoordinator',
                label: 'Area Coordinator',
                render: (value, areaCoordinator) => (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{areaCoordinator?.fullName}</div>
                      <div className="text-sm text-gray-500">@{areaCoordinator?.username}</div>
                    </div>
                  </div>
                )
              },
              {
                key: 'assignedCoordinators',
                label: 'Assigned Coordinators',
                render: (value, areaCoordinator) => (
                  <div className="text-sm text-gray-900">
                    {getAssignedCoordinators(areaCoordinator) === 'No coordinators assigned' ? (
                      <span className="text-gray-400 italic">No coordinators assigned</span>
                    ) : (
                      getAssignedCoordinators(areaCoordinator)
                    )}
                  </div>
                )
              },
              {
                key: 'contact',
                label: 'Contact',
                className: 'hidden lg:table-cell',
                render: (value, areaCoordinator) => (
                  <div>
                    {areaCoordinator?.email && (
                      <div className="flex items-center text-sm text-gray-900 mb-1">
                        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {areaCoordinator.email}
                      </div>
                    )}
                    {areaCoordinator?.phone && (
                      <div className="flex items-center text-sm text-gray-500">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {areaCoordinator.phone}
                      </div>
                    )}
                    {!areaCoordinator?.email && !areaCoordinator?.phone && (
                      <span className="text-gray-400 italic text-sm">No contact info</span>
                    )}
                  </div>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (value, areaCoordinator) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    areaCoordinator?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {areaCoordinator?.status}
                  </span>
                )
              },
              {
                key: 'created',
                label: 'Created',
                className: 'hidden lg:table-cell',
                render: (value, areaCoordinator) => (
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {areaCoordinator?.createdAt ? new Date(areaCoordinator.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                )
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (value, areaCoordinator) => (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <ModernButton
                      onClick={() => handleEditAreaCoordinator(areaCoordinator)}
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </ModernButton>
                    {areaCoordinator?.status === 'active' ? (
                      <ModernButton
                        onClick={() => handleDeactivateAreaCoordinator(areaCoordinator?.id)}
                        variant="warning"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <EyeSlashIcon className="h-4 w-4 mr-1" />
                        Deactivate
                      </ModernButton>
                    ) : (
                      <ModernButton
                        onClick={() => handleActivateAreaCoordinator(areaCoordinator?.id)}
                        variant="success"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Activate
                      </ModernButton>
                    )}
                    <ModernButton
                      onClick={() => handleDeleteAreaCoordinator(areaCoordinator?.id)}
                      variant="danger"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </ModernButton>
                  </div>
                )
              }
            ]}
            data={areaCoordinators}
            emptyMessage={
              <div className="text-center py-12">
                <MapPinIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No area coordinators found</h3>
                <p className="text-sm text-gray-500">Get started by creating your first area coordinator.</p>
              </div>
            }
          />
        </ModernCard>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <ModernCard className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPinIcon className="h-6 w-6 mr-3 text-red-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingAreaCoordinator ? 'Edit Area Coordinator' : 'Create New Area Coordinator'}
                  </h3>
                </div>
                <ModernButton
                  onClick={() => setShowCreateModal(false)}
                  variant="ghost"
                  size="sm"
                >
                  <XMarkIcon className="h-5 w-5" />
                </ModernButton>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              <label className="block text-sm font-medium text-gray-700">
                Region Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.regionName}
                onChange={(e) => setFormData({ ...formData, regionName: e.target.value })}
                placeholder="e.g., Cebu City, Mandaue, Lapu-Lapu"
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                ⚠️ Required! Each Area Coordinator must have a region for proper sales tracking
              </p>
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

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <ModernButton
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="secondary"
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  type="submit"
                  disabled={saving}
                  variant="primary"
                  loading={saving}
                >
                  {editingAreaCoordinator ? 'Update Area Coordinator' : 'Create Area Coordinator'}
                </ModernButton>
              </div>
            </form>
          </ModernCard>
        </div>
      )}
      </div>
    </div>
  );
};

export default AreaCoordinatorManagement;
