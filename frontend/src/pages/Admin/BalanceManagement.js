import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { balanceManagementAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { 
  CurrencyDollarIcon, 
  PlusIcon, 
  ClockIcon,
  UserIcon,
  UsersIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import ModernTable from '../../components/UI/ModernTable';

const BalanceManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadAmount, setLoadAmount] = useState('');
  const [transactionType, setTransactionType] = useState('add'); // 'add' or 'deduct'
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactionFilters, setTransactionFilters] = useState({
    startDate: '',
    endDate: '',
    type: 'all' // 'all', 'load', 'use'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, activeTab, searchTerm]);

  const filterUsers = () => {
    let filtered = users;
    
    // Filter by role
    if (activeTab !== 'all') {
      filtered = filtered.filter(user => user.role === activeTab);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredUsers(filtered);
  };

  const fetchUsers = async () => {
    try {
      const response = await balanceManagementAPI.getUsers();
      setUsers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadBalance = async (e) => {
    e.preventDefault();
    
    if (!selectedUser || !loadAmount || parseFloat(loadAmount) < 1) {
      toast.error('Please fill all fields with valid amounts');
      return;
    }

    setLoadingBalance(true);
    try {
      const amount = parseFloat(loadAmount);
      const finalAmount = transactionType === 'deduct' ? -amount : amount;
      
      await balanceManagementAPI.loadBalance({
        userId: selectedUser.id,
        amount: finalAmount,
        description: `Balance ${transactionType === 'deduct' ? 'deducted' : 'loaded'} by ${user.fullName}`
      });

      toast.success(`₱${loadAmount} ${transactionType === 'deduct' ? 'deducted from' : 'loaded to'} ${selectedUser.fullName}`);
      
      // Trigger balance refresh in header with updated balance for the affected user
      window.dispatchEvent(new CustomEvent('balanceUpdated', {
        detail: {
          userId: selectedUser.id
        }
      }));
      
      setShowLoadModal(false);
      setLoadAmount('');
      setTransactionType('add');
      setSelectedUser(null);
      fetchUsers(); // Refresh the list
      // Refresh transactions modal if open and for that user
      if (showTransactions && selectedUser?.id) {
        fetchTransactions(selectedUser.id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  const fetchTransactions = async (userId) => {
    try {
      const response = await balanceManagementAPI.getTransactions(userId);
      setTransactions(response.data.data.transactions);
      setShowTransactions(true);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      area_coordinator: 'bg-purple-100 text-purple-800',
      coordinator: 'bg-blue-100 text-blue-800',
      agent: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
        <PageHeader
          title="Balance Management"
        />
        
        {/* Search and Stats */}
        <ModernCard variant="glass" className="mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search users by name or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                />
              </div>
              <div className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                <UsersIcon className="h-5 w-5 text-primary-600" />
                <span>Total Users: <span className="text-primary-600 font-semibold">{users.length}</span></span>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Tab Navigation */}
        <ModernCard variant="elevated" className="mb-6">
          <div className="px-4 sm:px-6 py-4">
            <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4" aria-label="User Role Tabs">
              {[
                { id: 'all', name: 'All Users', shortName: 'All', icon: UsersIcon, count: users.length },
                { id: 'area_coordinator', name: 'Area Coordinators', shortName: 'Area Coord', icon: UserGroupIcon, count: users.filter(u => u.role === 'area_coordinator').length },
                { id: 'coordinator', name: 'Coordinators', shortName: 'Coordinators', icon: UserIcon, count: users.filter(u => u.role === 'coordinator').length },
                { id: 'agent', name: 'Agents', shortName: 'Agents', icon: UserIcon, count: users.filter(u => u.role === 'agent').length }
              ].filter(tab => {
                // For coordinators, hide Area Coordinators and Coordinators tabs
                if (user.role === 'coordinator') {
                  return tab.id === 'all' || tab.id === 'agent';
                }
                // For other roles, show all tabs
                return true;
              }).map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <ModernButton
                    key={tab.id}
                    variant={isActive ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="hidden sm:inline">{tab.name}</span>
                      <span className="sm:hidden">{tab.shortName}</span>
                      <span className="px-2 py-1 bg-white/20 text-xs rounded-full">({tab.count})</span>
                    </div>
                  </ModernButton>
                );
              })}
            </nav>
          </div>
        </ModernCard>

        {/* Users List */}
        <ModernCard variant="elevated" className="animate-fade-in">
          <div className="p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-6">
              <UserIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                {activeTab === 'all' ? 'All Users' : 
                 activeTab === 'area_coordinator' ? 'Area Coordinators' :
                 activeTab === 'coordinator' ? 'Coordinators' : 'Agents'}
              </h2>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                {filteredUsers.length} users
              </span>
            </div>
            
            <ModernTable
              columns={[
                { 
                  key: 'user', 
                  label: 'User', 
                  sortable: true,
                  render: (value, row) => (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{row.fullName}</div>
                        <div className="text-sm text-gray-500">{row.username}</div>
                        <div className="sm:hidden mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(row.role)}`}>
                            {row.role.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                },
                { 
                  key: 'role', 
                  label: 'Role',
                  hideOnMobile: true,
                  render: (value) => (
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(value)}`}>
                      {value.replace('_', ' ').toUpperCase()}
                    </span>
                  )
                },
                { 
                  key: 'currentBalance', 
                  label: 'Balance', 
                  sortable: true,
                  render: (value) => (
                    <span className="font-semibold text-success-600">
                      {formatCurrency(value)}
                    </span>
                  )
                },
                { 
                  key: 'coordinator', 
                  label: 'Coordinator',
                  hideOnMobile: true,
                  render: (value) => value?.fullName || 'N/A'
                },
                { 
                  key: 'actions', 
                  label: 'Actions',
                  render: (value, row) => (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <ModernButton
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(row);
                          setShowLoadModal(true);
                        }}
                        icon={PlusIcon}
                        className="w-full sm:w-auto"
                      >
                        <span className="hidden sm:inline">Load Balance</span>
                        <span className="sm:hidden">Load</span>
                      </ModernButton>
                      <ModernButton
                        variant="secondary"
                        size="sm"
                        onClick={() => fetchTransactions(row.id)}
                        icon={ClockIcon}
                        className="w-full sm:w-auto"
                      >
                        <span className="hidden sm:inline">History</span>
                        <span className="sm:hidden">History</span>
                      </ModernButton>
                    </div>
                  )
                }
              ]}
              data={filteredUsers}
              emptyMessage="No users found matching your search criteria"
            />
          </div>
        </ModernCard>

        {/* Load Balance Modal */}
        {showLoadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <ModernCard variant="elevated" className="w-full max-w-md animate-bounce-in">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Load Balance
                  </h3>
                  <button
                    onClick={() => setShowLoadModal(false)}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                    aria-label="Close"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-600 hover:text-gray-900" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{selectedUser?.fullName}</div>
                      <div className="text-sm text-gray-600">Role: {selectedUser?.role?.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-sm text-gray-600">Current: {formatCurrency(selectedUser?.currentBalance)}</div>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleLoadBalance} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Transaction Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <ModernButton
                        type="button"
                        variant={transactionType === 'add' ? 'success' : 'ghost'}
                        onClick={() => setTransactionType('add')}
                        icon={PlusIcon}
                        className="w-full"
                      >
                        Add Balance
                      </ModernButton>
                      <ModernButton
                        type="button"
                        variant={transactionType === 'deduct' ? 'danger' : 'ghost'}
                        onClick={() => setTransactionType('deduct')}
                        icon={CurrencyDollarIcon}
                        className="w-full"
                      >
                        Deduct Balance
                      </ModernButton>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount (₱) - {transactionType === 'deduct' ? 'Deduct' : 'Add'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={loadAmount}
                      onChange={(e) => setLoadAmount(e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                        transactionType === 'deduct'
                          ? 'border-danger-300 focus:ring-danger-200 focus:border-danger-500'
                          : 'border-success-300 focus:ring-success-200 focus:border-success-500'
                      } bg-white/50 backdrop-blur-sm`}
                      placeholder={`Enter amount to ${transactionType}`}
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <ModernButton
                      type="button"
                      variant="ghost"
                      onClick={() => setShowLoadModal(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </ModernButton>
                    <ModernButton
                      type="submit"
                      variant={transactionType === 'deduct' ? 'danger' : 'success'}
                      loading={loadingBalance}
                      disabled={loadingBalance}
                      className="w-full sm:w-auto"
                    >
                      {loadingBalance ? 'Processing...' : (transactionType === 'deduct' ? 'Deduct Balance' : 'Add Balance')}
                    </ModernButton>
                  </div>
                </form>
              </div>
            </ModernCard>
          </div>
        )}

        {/* Transactions Modal */}
        {showTransactions && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <ModernCard variant="elevated" className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-bounce-in my-8">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Transaction History
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowTransactions(false)}
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors duration-200"
                    aria-label="Close"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-600 hover:text-gray-900" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {/* Date and Type Filters */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={transactionFilters.startDate}
                        onChange={(e) => setTransactionFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={transactionFilters.endDate}
                        onChange={(e) => setTransactionFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Type</label>
                      <select
                        value={transactionFilters.type}
                        onChange={(e) => setTransactionFilters(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Types</option>
                        <option value="load">Load</option>
                        <option value="use">Use/Deduct</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <ModernButton
                      variant="secondary"
                      size="xs"
                      onClick={() => setTransactionFilters({ startDate: '', endDate: '', type: 'all' })}
                    >
                      Clear Filters
                    </ModernButton>
                  </div>
                </div>

                <ModernTable
                  columns={[
                    { 
                      key: 'createdAt', 
                      label: 'Date', 
                      sortable: true,
                      render: (value) => new Date(value).toLocaleDateString()
                    },
                    { 
                      key: 'transactionType', 
                      label: 'Type',
                      render: (value) => (
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                          value === 'load' 
                            ? 'bg-success-100 text-success-700' 
                            : 'bg-danger-100 text-danger-700'
                        }`}>
                          {value.toUpperCase()}
                        </span>
                      )
                    },
                    { 
                      key: 'amount', 
                      label: 'Amount', 
                      sortable: true,
                      render: (value) => (
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(Math.abs(value))}
                        </span>
                      )
                    },
                    { 
                      key: 'description', 
                      label: 'Description',
                      render: (value) => (
                        <div className="max-w-xs truncate" title={value}>
                          {value}
                        </div>
                      )
                    },
                    { 
                      key: 'processedBy', 
                      label: 'Processed By',
                      render: (value) => value?.fullName || 'System'
                    }
                  ]}
                  data={transactions.filter(tx => {
                    // Date filters
                    if (transactionFilters.startDate) {
                      const txDate = new Date(tx.createdAt).toISOString().split('T')[0];
                      if (txDate < transactionFilters.startDate) return false;
                    }
                    if (transactionFilters.endDate) {
                      const txDate = new Date(tx.createdAt).toISOString().split('T')[0];
                      if (txDate > transactionFilters.endDate) return false;
                    }
                    // Type filter
                    if (transactionFilters.type !== 'all') {
                      if (transactionFilters.type === 'use' && tx.transactionType !== 'use') return false;
                      if (transactionFilters.type === 'load' && tx.transactionType !== 'load') return false;
                    }
                    return true;
                  })}
                  emptyMessage="No transactions found matching your filters"
                />
              </div>
              
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <ModernButton
                  onClick={() => setShowTransactions(false)}
                  variant="secondary"
                  size="md"
                  className="w-full sm:w-auto"
                >
                  Close
                </ModernButton>
              </div>
            </ModernCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceManagement;
