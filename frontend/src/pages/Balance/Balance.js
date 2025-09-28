import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../utils/api';
import {
  CurrencyDollarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  PencilSquareIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';
import ModernTable from '../../components/UI/ModernTable';

const Balance = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adjustment, setAdjustment] = useState({
    amount: '',
    type: 'credit',
    reason: ''
  });

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await api.get('/balance');
      setBalances(response.data);
    } catch (err) {
      setError('Failed to fetch balance data');
      console.error('Error fetching balances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    try {
      await api.post('/balance/adjust', {
        userId: selectedUser.id,
        amount: parseFloat(adjustment.amount),
        type: adjustment.type,
        reason: adjustment.reason
      });
      setShowAdjustModal(false);
      setSelectedUser(null);
      setAdjustment({ amount: '', type: 'credit', reason: '' });
      fetchBalances(); // Refresh the list
    } catch (err) {
      setError('Failed to adjust balance');
      console.error('Error adjusting balance:', err);
    }
  };

  const openAdjustModal = (user) => {
    setSelectedUser(user);
    setShowAdjustModal(true);
  };

  const canManageBalance = ['superadmin', 'admin', 'area_coordinator'].includes(user.role);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading balance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Balance Management"
          subtitle="Manage user balances, view statistics, and process adjustments"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Admin', href: '/admin' },
            { label: 'Balance Management' }
          ]}
        />

        {error && (
          <ModernCard variant="glass" className="mb-6 border-danger-200 bg-danger-50">
            <div className="p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-danger-500 mr-3 flex-shrink-0" />
                <p className="text-danger-700 font-medium">{error}</p>
              </div>
            </div>
          </ModernCard>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Total Balances"
            value={`₱${balances.reduce((sum, balance) => sum + balance.currentBalance, 0).toLocaleString()}`}
            icon={CurrencyDollarIcon}
            color="success"
            className="animate-bounce-in"
            style={{ animationDelay: '0ms' }}
          />
          <StatCard
            title="Active Users"
            value={balances.filter(b => b.currentBalance > 0).length}
            subtitle="with balance > ₱0"
            icon={UserIcon}
            color="primary"
            className="animate-bounce-in"
            style={{ animationDelay: '100ms' }}
          />
          <StatCard
            title="Low Balance"
            value={balances.filter(b => b.currentBalance < 1000).length}
            subtitle="below ₱1,000"
            icon={ExclamationTriangleIcon}
            color="warning"
            className="animate-bounce-in"
            style={{ animationDelay: '200ms' }}
          />
          <StatCard
            title="Average Balance"
            value={`₱${balances.length > 0 ? Math.round(balances.reduce((sum, balance) => sum + balance.currentBalance, 0) / balances.length).toLocaleString() : '0'}`}
            icon={ChartBarIcon}
            color="accent"
            className="animate-bounce-in"
            style={{ animationDelay: '300ms' }}
          />
        </div>

        {/* Balance Table */}
        <ModernCard variant="elevated" className="animate-fade-in">
          <div className="p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-6">
              <UserIcon className="h-6 w-6 text-primary-600" />
              <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                User Balances
              </h2>
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                {balances.length} users
              </span>
            </div>
            
            <ModernTable
              columns={[
                { 
                  key: 'user', 
                  label: 'User', 
                  sortable: true,
                  render: (value) => (
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary-600">
                          {value?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{value?.username}</div>
                        <div className="text-sm text-gray-500">{value?.email}</div>
                      </div>
                    </div>
                  )
                },
                { 
                  key: 'user.role', 
                  label: 'Role',
                  hideOnMobile: true,
                  render: (value, row) => (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                      {row.user?.role?.replace('_', ' ').toUpperCase()}
                    </span>
                  )
                },
                { 
                  key: 'currentBalance', 
                  label: 'Current Balance', 
                  sortable: true,
                  render: (value) => (
                    <span className={`font-semibold ${
                      value < 1000 ? 'text-danger-600' : 'text-success-600'
                    }`}>
                      ₱{value?.toLocaleString()}
                    </span>
                  )
                },
                { 
                  key: 'creditLimit', 
                  label: 'Credit Limit',
                  hideOnMobile: true,
                  render: (value) => `₱${value?.toLocaleString()}`
                },
                { 
                  key: 'status', 
                  label: 'Status', 
                  render: (value) => (
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                      value === 'active' 
                        ? 'bg-success-100 text-success-700' 
                        : 'bg-danger-100 text-danger-700'
                    }`}>
                      {value}
                    </span>
                  )
                },
                { 
                  key: 'updatedAt', 
                  label: 'Last Updated', 
                  sortable: true,
                  hideOnMobile: true,
                  render: (value) => new Date(value).toLocaleDateString()
                },
                ...(canManageBalance ? [{ 
                  key: 'actions', 
                  label: 'Actions',
                  render: (value, row) => (
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      onClick={() => openAdjustModal(row.user)}
                      icon={PencilSquareIcon}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      Adjust
                    </ModernButton>
                  )
                }] : [])
              ]}
              data={balances}
              emptyMessage="No user balances found"
            />
          </div>
        </ModernCard>

        {/* Adjust Balance Modal */}
        {showAdjustModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
            <ModernCard variant="elevated" className="w-full max-w-md animate-bounce-in">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Adjust Balance
                  </h3>
                  <ModernButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdjustModal(false)}
                    icon={XMarkIcon}
                    className="text-gray-400 hover:text-gray-600"
                  />
                </div>
                
                <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-600">
                        {selectedUser.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{selectedUser.username}</div>
                      <div className="text-sm text-gray-600">Current: ₱{balances.find(b => b.user.id === selectedUser.id)?.currentBalance?.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
                
                <form onSubmit={handleAdjustBalance} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Adjustment Type
                    </label>
                    <select
                      value={adjustment.type}
                      onChange={(e) => setAdjustment({ ...adjustment, type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="credit">Credit (Add)</option>
                      <option value="debit">Debit (Subtract)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount (₱)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={adjustment.amount}
                      onChange={(e) => setAdjustment({ ...adjustment, amount: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Reason
                    </label>
                    <textarea
                      value={adjustment.reason}
                      onChange={(e) => setAdjustment({ ...adjustment, reason: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200 resize-none"
                      rows="3"
                      placeholder="Enter reason for adjustment"
                      required
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <ModernButton
                      type="button"
                      variant="ghost"
                      onClick={() => setShowAdjustModal(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </ModernButton>
                    <ModernButton
                      type="submit"
                      variant="primary"
                      className="w-full sm:w-auto"
                    >
                      Adjust Balance
                    </ModernButton>
                  </div>
                </form>
              </div>
            </ModernCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default Balance;




