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
      agent: 'bg-purple-100 text-purple-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <h1 className="font-bold text-gray-900 text-[clamp(18px,3.5vw,24px)]">Balance Management</h1>
            </div>
          </div>
        </div>
        
        {/* Search and Stats */}
        <ModernCard variant="glass" className="mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative flex-1 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-purple-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search users by name or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 text-xs sm:text-sm"
                />
              </div>
              {/* Removed total users counter for a cleaner header */}
            </div>
          </div>
        </ModernCard>

        {/* Compact Tab Navigation */}
        <ModernCard variant="elevated" className="mb-4">
          <div className="px-3 py-2">
            <nav className="flex flex-wrap gap-2" aria-label="User Role Tabs">
              {[
                { id: 'all', name: 'All Users', shortName: 'All', icon: UsersIcon, count: users.length },
                { id: 'area_coordinator', name: 'Area Coordinators', shortName: 'Area Coord', icon: UserGroupIcon, count: users.filter(u => u.role === 'area_coordinator').length },
                { id: 'coordinator', name: 'Coordinators', shortName: 'Coord', icon: UserIcon, count: users.filter(u => u.role === 'coordinator').length },
                { id: 'agent', name: 'Agents', shortName: 'Agents', icon: UserIcon, count: users.filter(u => u.role === 'agent').length }
              ].filter(tab => {
                // For area coordinators, hide Area Coordinators tab
                if (user.role === 'area_coordinator') {
                  return tab.id === 'all' || tab.id === 'coordinator' || tab.id === 'agent';
                }
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
                    size="sm"
                    className="px-3 py-1.5"
                  >
                    <div className="flex items-center space-x-1.5">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="hidden sm:inline text-xs sm:text-sm">{tab.name}</span>
                      <span className="sm:hidden text-xs">{tab.shortName}</span>
                      <span className="px-1.5 py-0.5 bg-white/20 text-[10px] rounded-full">({tab.count})</span>
                    </div>
                  </ModernButton>
                );
              })}
            </nav>
          </div>
        </ModernCard>

        {/* Users List */}
        <ModernCard variant="elevated" className="animate-fade-in">
          <div className="p-4 sm:p-5">
            <div className="flex items-center space-x-2 mb-6">
              <UserIcon className="h-6 w-6 text-purple-600" />
              <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                {activeTab === 'all' ? 'All Users' : 
                 activeTab === 'area_coordinator' ? 'Area Coordinators' :
                 activeTab === 'coordinator' ? 'Coordinators' : 'Agents'}
              </h2>
              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                {filteredUsers.length} users
              </span>
            </div>
            
            {/* Desktop table */}
            <div className="hidden md:block">
            <ModernTable
              columns={[
                { 
                  key: 'user', 
                  label: 'User', 
                  sortable: true,
                  render: (value, row) => (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-purple-600" />
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
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
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

            {/* Mobile card list */}
            <div className="grid grid-cols-1 gap-2 md:hidden">
              {filteredUsers.map((row) => (
                <div key={row.id} className="p-2 rounded-xl border border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{row.fullName}</div>
                        <div className="text-[11px] text-gray-500">{row.username}</div>
                      </div>
                    </div>
                    <span className={`ml-2 inline-flex px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${getRoleBadgeColor(row.role)}`}>
                      {row.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-[11px]">
                      <div className="text-gray-500">Balance</div>
                      <div className="text-sm font-semibold text-purple-700">{formatCurrency(row.currentBalance)}</div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap w-full sm:w-auto">
                      <ModernButton
                        variant="success"
                        size="xs"
                        onClick={() => { setSelectedUser(row); setShowLoadModal(true); }}
                        icon={PlusIcon}
                        className="w-full sm:w-auto px-3 py-1.5 text-[11px]"
                      >
                        Load
                      </ModernButton>
                      <ModernButton
                        variant="secondary"
                        size="xs"
                        onClick={() => fetchTransactions(row.id)}
                        icon={ClockIcon}
                        className="w-full sm:w-auto px-3 py-1.5 text-[11px]"
                      >
                        History
                      </ModernButton>
                    </div>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center text-gray-500 py-8">No users found</div>
              )}
            </div>
          </div>
        </ModernCard>

        {/* Load Balance Modal */}
        {showLoadModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <ModernCard variant="elevated" className="w-full max-w-md animate-bounce-in">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Load Balance
                  </h3>
                  <ModernButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLoadModal(false)}
                    icon={XMarkIcon}
                    className="text-gray-400 hover:text-gray-600"
                  />
                </div>
                
                <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-primary-600" />
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-3">
            <ModernCard variant="elevated" className="w-full max-w-2xl animate-fade-in">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <ClockIcon className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Transactions
                    </h3>
                  </div>
                  <ModernButton
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowTransactions(false)}
                    icon={XMarkIcon}
                    className="text-gray-500 hover:text-gray-700"
                    title="Close"
                  />
                </div>
                
                {/* Date and Type Filters */}
                <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={transactionFilters.startDate}
                        onChange={(e) => setTransactionFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={transactionFilters.endDate}
                        onChange={(e) => setTransactionFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Transaction Type</label>
                      <select
                        value={transactionFilters.type}
                        onChange={(e) => setTransactionFilters(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
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

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto max-h-[70vh]">
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
                        <div className="max-w-xs truncate break-words" title={value}>
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

                {/* Mobile list */}
                <div className="md:hidden divide-y divide-gray-200 max-h-[70vh] overflow-y-auto">
                  {transactions.filter(tx => {
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
                  }).map((tx, idx) => (
                    <div key={idx} className="p-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="text-xs font-medium text-gray-600 flex-shrink-0 w-24">Date:</div>
                          <div className="text-sm text-gray-900 flex-1 text-right">{new Date(tx.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div className="flex justify-between items-start">
                          <div className="text-xs font-medium text-gray-600 flex-shrink-0 w-24">Type:</div>
                          <div className="text-sm text-gray-900 flex-1 text-right">
                            <span className={`inline-flex px-2.5 py-0.5 text-[11px] font-semibold rounded-full ${tx.transactionType === 'load' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'}`}>
                              {tx.transactionType?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between items-start">
                          <div className="text-xs font-medium text-gray-600 flex-shrink-0 w-24">Amount:</div>
                          <div className="text-sm text-gray-900 flex-1 text-right"><span className="font-semibold">{formatCurrency(Math.abs(tx.amount))}</span></div>
                        </div>
                        <div className="flex justify-between items-start">
                          <div className="text-xs font-medium text-gray-600 flex-shrink-0 w-24">Description:</div>
                          <div className="text-sm text-gray-900 flex-1 text-right break-words">{tx.description}</div>
                        </div>
                        <div className="flex justify-between items-start">
                          <div className="text-xs font-medium text-gray-600 flex-shrink-0 w-24">Processed By:</div>
                          <div className="text-sm text-gray-900 flex-1 text-right">{tx.processedBy?.fullName || 'System'}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.filter(tx => {
                    if (transactionFilters.startDate) {
                      const txDate = new Date(tx.createdAt).toISOString().split('T')[0];
                      if (txDate < transactionFilters.startDate) return false;
                    }
                    if (transactionFilters.endDate) {
                      const txDate = new Date(tx.createdAt).toISOString().split('T')[0];
                      if (txDate > transactionFilters.endDate) return false;
                    }
                    if (transactionFilters.type !== 'all') {
                      if (transactionFilters.type === 'use' && tx.transactionType !== 'use') return false;
                      if (transactionFilters.type === 'load' && tx.transactionType !== 'load') return false;
                    }
                    return true;
                  }).length === 0 && (
                    <div className="p-6 text-center text-gray-500">No transactions found matching your filters</div>
                  )}
                </div>
              </div>
            </ModernCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceManagement;
