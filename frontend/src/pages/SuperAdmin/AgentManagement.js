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
  PhoneIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import ModernTable from '../../components/UI/ModernTable';

const AgentManagement = () => {
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState([]);
  const [coordinators, setCoordinators] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    coordinatorId: '',
    status: 'active'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAgents();
    fetchCoordinators();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await userAPI.getUsers({ role: 'agent' });
      // Filter out null/undefined entries
      const filteredAgents = response.data.data.filter(agent => agent != null);
      setAgents(filteredAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to fetch agents');
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

  const handleCreateAgent = () => {
    setEditingAgent(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      coordinatorId: '',
      status: 'active'
    });
    setShowCreateModal(true);
  };

  const handleEditAgent = (agent) => {
    if (!agent) {
      console.error('Agent data is undefined');
      toast.error('Unable to edit agent: Agent data is missing');
      return;
    }
    
    setEditingAgent(agent);
    setFormData({
      username: agent.username || '',
      password: '',
      fullName: agent.fullName || '',
      email: agent.email || '',
      phone: agent.phone || '',
      coordinatorId: agent.coordinatorId || '',
      status: agent.status || 'active'
    });
    setShowCreateModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.fullName) {
      toast.error('Username and full name are required');
      return;
    }

    if (!editingAgent && !formData.password) {
      toast.error('Password is required for new agents');
      return;
    }

    if (!formData.coordinatorId || formData.coordinatorId === '') {
      toast.error('Please select a Coordinator for proper region assignment');
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        ...formData,
        role: 'agent'
      };

      if (editingAgent) {
        if (!formData.password) {
          delete submitData.password;
        }
        await userAPI.updateUser(editingAgent.id, submitData);
        toast.success('Agent updated successfully');
      } else {
        await userAPI.createUser(submitData);
        toast.success('Agent created successfully');
      }

      setShowCreateModal(false);
      // Refresh both lists so the assigned coordinator name shows
      fetchAgents();
      fetchCoordinators();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivateAgent = async (agentId) => {
    if (!window.confirm('Are you sure you want to deactivate this agent?')) {
      return;
    }

    try {
      await userAPI.updateUser(agentId, { status: 'inactive' });
      toast.success('Agent deactivated successfully');
      fetchAgents();
    } catch (error) {
      toast.error('Failed to deactivate agent');
    }
  };

  const handleActivateAgent = async (agentId) => {
    try {
      await userAPI.updateUser(agentId, { status: 'active' });
      toast.success('Agent activated successfully');
      fetchAgents();
    } catch (error) {
      toast.error('Failed to activate agent');
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('Are you sure you want to permanently delete this agent? This action cannot be undone.')) {
      return;
    }

    try {
      await userAPI.deleteUser(agentId, { force: true });
      toast.success('Agent deleted successfully');
      fetchAgents();
    } catch (error) {
      toast.error('Failed to delete agent');
    }
  };

  const getCoordinatorName = (coordinatorId) => {
    const coordinator = coordinators.find(c => c.id === coordinatorId);
    return coordinator ? coordinator.fullName : 'No Coordinator';
  };

  if (loading) {
    return <LoadingSpinner message="Loading agents..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white">
      <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
        <PageHeader
          title="Agent Management"
          icon={UserIcon}
        >
          <ModernButton
            onClick={handleCreateAgent}
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Agent
          </ModernButton>
        </PageHeader>

        <ModernCard>
          <div className="bg-gradient-to-r from-red-50 to-red-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <UserIcon className="h-6 w-6 mr-3 text-red-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">All Agents ({agents.length})</h2>
                <p className="text-sm text-gray-600 mt-1">Manage agent accounts and coordinator assignments</p>
              </div>
            </div>
          </div>
          
          <ModernTable
            columns={[
              {
                key: 'agent',
                label: 'Agent',
                render: (value, agent) => (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{agent?.fullName}</div>
                      <div className="text-sm text-gray-500">@{agent?.username}</div>
                    </div>
                  </div>
                )
              },
              {
                key: 'coordinator',
                label: 'Coordinator',
                render: (value, agent) => (
                  <div className="text-sm text-gray-900">
                    {getCoordinatorName(agent?.coordinatorId) === 'No Coordinator' ? (
                      <span className="text-gray-400 italic">Unassigned</span>
                    ) : (
                      getCoordinatorName(agent?.coordinatorId)
                    )}
                  </div>
                )
              },
              {
                key: 'contact',
                label: 'Contact',
                className: 'hidden lg:table-cell',
                render: (value, agent) => (
                  <div>
                    {agent?.email && (
                      <div className="flex items-center text-sm text-gray-900 mb-1">
                        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {agent.email}
                      </div>
                    )}
                    {agent?.phone && (
                      <div className="flex items-center text-sm text-gray-500">
                        <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {agent.phone}
                      </div>
                    )}
                    {!agent?.email && !agent?.phone && (
                      <span className="text-gray-400 italic text-sm">No contact info</span>
                    )}
                  </div>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (value, agent) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    agent?.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {agent?.status}
                  </span>
                )
              },
              {
                key: 'created',
                label: 'Created',
                className: 'hidden lg:table-cell',
                render: (value, agent) => (
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {agent?.createdAt ? new Date(agent.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                )
              },
              {
                key: 'actions',
                label: 'Actions',
                render: (value, agent) => (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <ModernButton
                      onClick={() => handleEditAgent(agent)}
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Edit
                    </ModernButton>
                    {agent?.status === 'active' ? (
                      <ModernButton
                        onClick={() => handleDeactivateAgent(agent?.id)}
                        variant="warning"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <EyeSlashIcon className="h-4 w-4 mr-1" />
                        Deactivate
                      </ModernButton>
                    ) : (
                      <ModernButton
                        onClick={() => handleActivateAgent(agent?.id)}
                        variant="success"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Activate
                      </ModernButton>
                    )}
                    <ModernButton
                      onClick={() => handleDeleteAgent(agent?.id)}
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
            data={agents}
            emptyMessage={
              <div className="text-center py-12">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
                <p className="text-sm text-gray-500 mb-6">Get started by creating your first agent.</p>
                <ModernButton
                  onClick={handleCreateAgent}
                  variant="primary"
                  size="md"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Agent
                </ModernButton>
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
                {editingAgent ? 'Edit Agent' : 'Create New Agent'}
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
                  Password {editingAgent && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required={!editingAgent}
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

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assign to Coordinator <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.coordinatorId}
                  onChange={(e) => setFormData({ ...formData, coordinatorId: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Select Coordinator</option>
                  {coordinators.map((coordinator) => (
                    <option key={coordinator.id} value={coordinator.id}>
                      {coordinator.fullName} (@{coordinator.username})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  ⚠️ Required for proper region assignment and sales tracking
                </p>
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
                  {saving ? 'Saving...' : (editingAgent ? 'Update Agent' : 'Create Agent')}
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

export default AgentManagement;
