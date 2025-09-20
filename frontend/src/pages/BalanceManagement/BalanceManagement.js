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
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

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
      setShowLoadModal(false);
      setLoadAmount('');
      setTransactionType('add');
      setSelectedUser(null);
      fetchUsers(); // Refresh the list
      
      // Trigger balance refresh in header
      window.dispatchEvent(new CustomEvent('balanceUpdated'));
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6 mx-2 sm:mx-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Balance Management</h1>
            <p className="text-sm sm:text-base text-gray-600">Load balance for Area Coordinators, Coordinators, and Agents</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="text-sm text-gray-500 text-center sm:text-left">
              Total Users: {users.length}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg mx-2 sm:mx-0">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap gap-2 sm:space-x-8 px-3 sm:px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UsersIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">All </span>({users.length})
            </button>
            <button
              onClick={() => setActiveTab('area_coordinator')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'area_coordinator'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Area Coordinator </span>({users.filter(u => u.role === 'area_coordinator').length})
            </button>
            <button
              onClick={() => setActiveTab('coordinator')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'coordinator'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Coordinator </span>({users.filter(u => u.role === 'coordinator').length})
            </button>
            <button
              onClick={() => setActiveTab('agent')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm ${
                activeTab === 'agent'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 inline mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Agent </span>({users.filter(u => u.role === 'agent').length})
            </button>
          </nav>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow rounded-lg overflow-hidden mx-2 sm:mx-0">
        <div className="px-3 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">
            {activeTab === 'all' ? 'All Users' : 
             activeTab === 'area_coordinator' ? 'Area Coordinators' :
             activeTab === 'coordinator' ? 'Coordinators' : 'Agents'} 
            ({filteredUsers.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance
                </th>
                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coordinator
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      <div className="ml-2 sm:ml-4">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                          {user.fullName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.username}
                        </div>
                        <div className="sm:hidden">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">
                      {formatCurrency(user.currentBalance)}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.coordinator?.fullName || 'N/A'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowLoadModal(true);
                        }}
                        className="inline-flex items-center justify-center px-2 sm:px-3 py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <PlusIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Load Balance</span>
                      </button>
                      <button
                        onClick={() => fetchTransactions(user.id)}
                        className="inline-flex items-center justify-center px-2 sm:px-3 py-1 border border-gray-300 text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                      >
                        <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                        <span className="hidden sm:inline">History</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load Balance Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 px-4">
          <div className="relative top-20 mx-auto p-4 sm:p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Load Balance</h3>
                <button
                  onClick={() => setShowLoadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleLoadBalance} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <div className="text-sm font-medium">{selectedUser?.fullName}</div>
                    <div className="text-xs text-gray-500">{selectedUser?.role}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Amount (₱) - {transactionType === 'deduct' ? 'Deduct' : 'Add'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={loadAmount}
                    onChange={(e) => setLoadAmount(e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-2 focus:ring-offset-2 ${
                      transactionType === 'deduct'
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                    }`}
                    placeholder={`Enter amount to ${transactionType}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
                  <div className="mt-1 flex space-x-4">
                    <button
                      type="button"
                      onClick={() => setTransactionType('add')}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium border ${
                        transactionType === 'add'
                          ? 'bg-green-100 border-green-300 text-green-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <PlusIcon className="h-4 w-4 inline mr-2" />
                      Add Balance
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionType('deduct')}
                      className={`flex-1 px-4 py-2 rounded-md text-sm font-medium border ${
                        transactionType === 'deduct'
                          ? 'bg-red-100 border-red-300 text-red-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <CurrencyDollarIcon className="h-4 w-4 inline mr-2" />
                      Deduct Balance
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowLoadModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingBalance}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                      transactionType === 'deduct'
                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                        : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500'
                    }`}
                  >
                    {loadingBalance ? 'Processing...' : (transactionType === 'deduct' ? 'Deduct Balance' : 'Add Balance')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      {showTransactions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-4/5 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
              <button
                onClick={() => setShowTransactions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processed By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          transaction.transactionType === 'load' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.transactionType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(Math.abs(transaction.amount))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {transaction.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.processedBy?.fullName || 'System'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceManagement;
