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
  UserGroupIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import ModernTable from '../../components/UI/ModernTable';

const CoordinatorManagement = () => {
  const [loading, setLoading] = useState(true);
  const [coordinators, setCoordinators] = useState([]);
  const [areaCoordinators, setAreaCoordinators] = useState([]);
  const [agents, setAgents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCoordinator, setEditingCoordinator] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    areaCoordinatorId: '',
    assignedAgents: [],
    status: 'active'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCoordinators();
    fetchAreaCoordinators();
    fetchAgents();
  }, []);

  const fetchCoordinators = async () => {
    try {
      const response = await userAPI.getUsers({ role: 'coordinator' });
      // Filter out null/undefined entries
      const filteredCoordinators = response.data.data.filter(coordinator => coordinator != null);
      setCoordinators(filteredCoordinators);
    } catch (error) {
      console.error('Failed to fetch coordinators:', error);
      toast.error('Failed to fetch coordinators');
    } finally {
      setLoading(false);
    }
  };

  const fetchAreaCoordinators = async () => {
    try {
      const response = await userAPI.getUsers({ role: 'area_coordinator' });
      setAreaCoordinators(response.data.data);
    } catch (error) {
      console.error('Failed to fetch area coordinators:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await userAPI.getUsers({ role: 'agent' });
      setAgents(response.data.data);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const handleCreateCoordinator = () => {
    setEditingCoordinator(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      areaCoordinatorId: '',
      assignedAgents: [],
      status: 'active'
    });
    setShowCreateModal(true);
  };

  const handleEditCoordinator = (coordinator) => {
    if (!coordinator) {
      console.error('Coordinator data is undefined');
      return;
    }
    
    setEditingCoordinator(coordinator);
    setFormData({
      username: coordinator.username || '',
      password: '',
      fullName: coordinator.fullName || '',
      email: coordinator.email || '',
      phone: coordinator.phone || '',
      // Coordinators store their area coordinator in coordinatorId
      areaCoordinatorId: coordinator.coordinatorId || '',
      assignedAgents: coordinator.assignedAgents || [],
      status: coordinator.status || 'active'
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.fullName) {
      toast.error('Username and full name are required');
      return;
    }

    if (!editingCoordinator && !formData.password) {
      toast.error('Password is required for new coordinators');
      return;
    }

    if (!formData.areaCoordinatorId || formData.areaCoordinatorId === '') {
      toast.error('Please select an Area Coordinator for proper region assignment');
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        username: formData.username,
        fullName: formData.fullName,
        status: formData.status,
        // Use areaCoordinatorId field name for backend (coordinators assign to area coordinators)
        areaCoordinatorId: formData.areaCoordinatorId && formData.areaCoordinatorId !== '' ? parseInt(formData.areaCoordinatorId) : null,
        // Include assignedAgents if it exists and is an array
        assignedAgents: Array.isArray(formData.assignedAgents) ? formData.assignedAgents : []
      };

      // Only include email and phone if they have values
      if (formData.email && formData.email.trim() !== '') {
        submitData.email = formData.email;
      }
      if (formData.phone && formData.phone.trim() !== '') {
        submitData.phone = formData.phone;
      }

      // Only add password and role for new users
      if (!editingCoordinator) {
        submitData.password = formData.password;
        submitData.role = 'coordinator';
      } else if (formData.password) {
        // Only include password in updates if it's provided
        submitData.password = formData.password;
      }

      if (editingCoordinator) {
        await userAPI.updateUser(editingCoordinator.id, submitData);
        toast.success('Coordinator updated successfully');
      } else {
        await userAPI.createUser(submitData);
        toast.success('Coordinator created successfully');
      }

      setShowCreateModal(false);
      // Refresh lists so assignment names and availability display correctly
      fetchCoordinators();
      fetchAreaCoordinators();
      fetchAgents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save coordinator');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateCoordinator = async (coordinatorId) => {
    if (!window.confirm('Are you sure you want to deactivate this coordinator?')) {
      return;
    }

    try {
      await userAPI.updateUser(coordinatorId, { status: 'inactive' });
      toast.success('Coordinator deactivated successfully');
      fetchCoordinators();
    } catch (error) {
      toast.error('Failed to deactivate coordinator');
    }
  };

  const handleActivateCoordinator = async (coordinatorId) => {
    try {
      await userAPI.updateUser(coordinatorId, { status: 'active' });
      toast.success('Coordinator activated successfully');
      fetchCoordinators();
    } catch (error) {
      toast.error('Failed to activate coordinator');
    }
  };

  const handleDeleteCoordinator = async (coordinatorId) => {
    if (!window.confirm('Are you sure you want to permanently delete this coordinator? This action cannot be undone.')) {
      return;
    }

    try {
      await userAPI.deleteUser(coordinatorId, { force: true });
      toast.success('Coordinator deleted successfully');
      
      // Small delay to ensure database update is complete
      setTimeout(async () => {
        // Refresh all data to show updated status
        await fetchCoordinators();
        await fetchAreaCoordinators();
        await fetchAgents();
      }, 100);
    } catch (error) {
      console.error('Delete coordinator error:', error);
      toast.error(error.response?.data?.message || 'Failed to delete coordinator');
    }
  };

  const getAreaCoordinatorName = (areaCoordinatorId) => {
    const areaCoordinator = areaCoordinators.find(ac => ac.id === areaCoordinatorId);
    return areaCoordinator ? areaCoordinator.fullName : 'No Area Coordinator';
  };

  if (loading) {
    return <LoadingSpinner message="Loading coordinators..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
        <PageHeader
          title="Coordinator Management"
          icon={UserGroupIcon}
        >
          <ModernButton
            onClick={handleCreateCoordinator}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Coordinator
          </ModernButton>
        </PageHeader>

        <ModernCard>
          <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <UserGroupIcon className="h-6 w-6 mr-3 text-red-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Coordinators</h2>
                <p className="text-sm text-gray-600 mt-1">Manage coordinator assignments and permissions</p>
              </div>
            </div>
          </div>

          <ModernTable
            columns={[
              {
                key: 'coordinator',
                label: 'Coordinator',
                render: (value, coordinator) => (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{coordinator?.fullName}</div>
                      <div className="text-sm text-gray-500">@{coordinator?.username}</div>
                    </div>
                  </div>
                )
              },
              {
                key: 'areaCoordinator',
                label: 'Area Coordinator',
                render: (value, coordinator) => (
                  <div className="text-sm text-gray-900">
                    {getAreaCoordinatorName(coordinator?.coordinatorId) === 'No Area Coordinator' ? (
                      <span className="text-gray-400 italic">Unassigned</span>
                    ) : (
                      getAreaCoordinatorName(coordinator?.coordinatorId)
                    )}
                  </div>
                )
              },
              {
                key: 'contact',
                label: 'Contact',
                className: 'hidden lg:table-cell',
                render: (value, coordinator) => (
                  <div>
                    {coordinator?.email && (
                      <div className="flex items-center text-sm text-gray-900 mb-1">
                        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {coordinator.email}
                      </div>
                    )}
                    {coordinator?.phone && (
                      <div className="flex items-center text-sm text-gray-500">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {coordinator.phone}
                      </div>
                    )}
                    {!coordinator?.email && !coordinator?.phone && (
                      <span className="text-gray-400 italic text-sm">No contact info</span>
                    )}
                  </div>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (value, coordinator) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    coordinator?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {coordinator?.status}
                  </span>
                )
              },
              {
                key: 'created',
                label: 'Created',
                className: 'hidden lg:table-cell',
                render: (value, coordinator) => (
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {coordinator?.createdAt ? new Date(coordinator.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                )
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (value, coordinator) => (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <ModernButton
                      onClick={() => handleEditCoordinator(coordinator)}
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </ModernButton>
                    {coordinator?.status === 'active' ? (
                      <ModernButton
                        onClick={() => handleDeactivateCoordinator(coordinator?.id)}
                        variant="warning"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <EyeSlashIcon className="h-4 w-4 mr-1" />
                        Deactivate
                      </ModernButton>
                    ) : (
                      <ModernButton
                        onClick={() => handleActivateCoordinator(coordinator?.id)}
                        variant="success"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Activate
                      </ModernButton>
                    )}
                    <ModernButton
                      onClick={() => handleDeleteCoordinator(coordinator?.id)}
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
            data={coordinators.filter(coordinator => coordinator != null)}
            emptyMessage={
              <div className="text-center py-12">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No coordinators found</h3>
                <p className="text-sm text-gray-500">Get started by creating your first coordinator.</p>
              </div>
            }
          />
        </ModernCard>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingCoordinator ? 'Edit Coordinator' : 'Create New Coordinator'}
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
                  Password {editingCoordinator && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required={!editingCoordinator}
                />
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

              {/* Area Coordinator Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Area Coordinator <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.areaCoordinatorId}
                  onChange={(e) => setFormData({ ...formData, areaCoordinatorId: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select Area Coordinator</option>
                  {areaCoordinators.map((areaCoord) => (
                    <option key={areaCoord.id} value={areaCoord.id}>
                      {areaCoord.fullName} (@{areaCoord.username}) - {areaCoord.region?.name || 'No Region'}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  ⚠️ Required for proper region assignment and sales tracking
                </p>
              </div>

              {/* Assign Agents to this Coordinator */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign Agents</label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {agents
                    .filter((agent) => {
                      // Show unassigned agents or those already assigned to the coordinator being edited
                      if (editingCoordinator) {
                        return agent.coordinatorId == null || agent.coordinatorId === editingCoordinator.id;
                      }
                      // For create, only show unassigned agents
                      return agent.coordinatorId == null;
                    })
                    .map((agent) => (
                    <div key={agent.id} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        id={`agent-${agent.id}`}
                        checked={(formData.assignedAgents || []).includes(agent.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => ({
                            ...prev,
                            assignedAgents: checked
                              ? ([...(prev.assignedAgents || []), agent.id])
                              : ((prev.assignedAgents || []).filter(id => id !== agent.id))
                          }));
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`agent-${agent.id}`} className="ml-2 text-sm text-gray-700">
                        {agent.fullName} (@{agent.username})
                      </label>
                    </div>
                  ))}
                  {agents.filter(a => a.coordinatorId == null).length === 0 && !editingCoordinator && (
                    <p className="text-sm text-gray-500">No agents available</p>
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
                  {saving ? 'Saving...' : (editingCoordinator ? 'Update Coordinator' : 'Create Coordinator')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CoordinatorManagement;
