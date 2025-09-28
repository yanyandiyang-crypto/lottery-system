import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';

const TransactionHistory = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD
  const [scopedUsers, setScopedUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, filter, selectedDate, selectedUserId]);

  useEffect(() => {
    // Load users in scope for admin/area_coordinator/coordinator
    const canSelectUsers = ['superadmin', 'admin', 'area_coordinator', 'coordinator'].includes(user?.role);
    if (!canSelectUsers) return;

    const loadUsers = async () => {
      try {
        const res = await api.get('/balance-management/users');
        if (res.data?.success) {
          const list = res.data.data || [];
          // Include self at the top for quick access
          const selfOption = user ? [{ id: user.id, fullName: `${user.fullName} (You)`, role: user.role }] : [];
          setScopedUsers([...selfOption, ...list]);
        }
      } catch (e) {
        console.error('Failed to load scoped users', e);
      }
    };
    loadUsers();
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const targetUserId = selectedUserId || user?.id;
      if (!targetUserId) return;
      
      // Use different endpoints based on user role and target
      let endpoint;
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (selectedDate) {
        params.append('startDate', selectedDate);
        params.append('endDate', selectedDate);
      }
      
      if (filter && filter !== 'all') {
        params.append('status', filter);
      }
      
      // For admins/coordinators viewing other users, use balance-management endpoint
      if (['superadmin', 'admin', 'area_coordinator', 'coordinator'].includes(user?.role) && selectedUserId && selectedUserId !== user?.id) {
        endpoint = `/balance-management/transactions/${targetUserId}?${params.toString()}`;
      } else {
        // For regular users or viewing own transactions, use transactions/history endpoint
        if (selectedUserId && selectedUserId !== user?.id) {
          params.append('userId', selectedUserId);
        }
        endpoint = `/transactions/history?${params.toString()}`;
      }
      
      const response = await api.get(endpoint);
      if (response.data?.success) {
        const data = response.data.data;
        setTransactions(data.transactions || []);
        setTotalPages(data.pagination?.pages || data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || data.pagination?.totalCount || 0);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // If balance-management fails, try the regular endpoint as fallback
      if (error.response?.status === 403 && selectedUserId) {
        try {
          const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: '20'
          });
          
          if (selectedDate) {
            params.append('startDate', selectedDate);
            params.append('endDate', selectedDate);
          }
          
          const fallbackResponse = await api.get(`/transactions/history?${params.toString()}`);
          if (fallbackResponse.data?.success) {
            const data = fallbackResponse.data.data;
            setTransactions(data.transactions || []);
            setTotalPages(data.pagination?.pages || data.pagination?.totalPages || 1);
            setTotalCount(data.pagination?.total || data.pagination?.totalCount || 0);
          }
        } catch (fallbackError) {
          console.error('Fallback transaction fetch failed:', fallbackError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type, status) => {
    if (status === 'failed') {
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
    
    if (status === 'pending') {
      return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }

    switch (type) {
      case 'load':
        return <ArrowUpIcon className="h-5 w-5 text-green-500" />;
      case 'use':
        return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
      case 'refund':
        return <ArrowUpIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTransactionColor = (type, status) => {
    if (status === 'failed') return 'text-red-600 bg-red-100';
    if (status === 'pending') return 'text-yellow-600 bg-yellow-100';
    
    switch (type) {
      case 'load':
        return 'text-green-600 bg-green-100';
      case 'use':
        return 'text-red-600 bg-red-100';
      case 'refund':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatAmount = (amount, type) => {
    const formattedAmount = parseFloat(amount).toFixed(2);
    const prefix = type === 'load' || type === 'refund' ? '+' : '-';
    return `${prefix}₱${formattedAmount}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'completed') return transaction.status === 'completed';
    if (filter === 'pending') return transaction.status === 'pending';
    if (filter === 'failed') return transaction.status === 'failed';
    return true;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50 flex items-center justify-center relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-100/30 to-accent-100/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent-100/30 to-primary-100/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4 shadow-glow"></div>
          <p className="text-gray-700 font-semibold text-lg">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-100/30 to-accent-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent-100/30 to-primary-100/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Transaction History"
          subtitle="View your balance transactions, ticket purchases, and financial activity"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Account', href: '/account' },
            { label: 'Transaction History' }
          ]}
        />

        {/* Filters */}
        <ModernCard variant="glass" className="mb-6 animate-fade-in">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100">
                  <FunnelIcon className="h-6 w-6 text-primary-600 flex-shrink-0" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Filters</h3>
              </div>
              <div className="w-16 h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"></div>
            </div>
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-6">
              {/* Date filter */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Filter by date</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setCurrentPage(1);
                      setSelectedDate(e.target.value);
                    }}
                    className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:shadow-soft w-full sm:w-auto"
                  />
                  {selectedDate && (
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedDate(''); setCurrentPage(1); }}
                      icon={XMarkIcon}
                      className="flex-shrink-0"
                    >
                      <span className="hidden sm:inline">Clear</span>
                    </ModernButton>
                  )}
                </div>
              </div>

              {/* User selector for admins/area coordinators/coordinators */}
              {['superadmin', 'admin', 'area_coordinator', 'coordinator'].includes(user?.role) && (
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <label className="text-sm font-medium text-gray-700 whitespace-nowrap">User</label>
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedUserId}
                      onChange={(e) => { setSelectedUserId(e.target.value); setCurrentPage(1); }}
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:shadow-soft w-full sm:min-w-[220px]"
                    >
                      <option value="">All (self)</option>
                      {scopedUsers.map(u => (
                        <option key={u.id} value={u.id}>{u.fullName || u.username} {u.role ? `- ${u.role}` : ''}</option>
                      ))}
                    </select>
                    {selectedUserId && (
                      <ModernButton
                        variant="ghost"
                        size="sm"
                        onClick={() => { setSelectedUserId(''); setCurrentPage(1); }}
                        icon={XMarkIcon}
                        className="flex-shrink-0"
                      >
                        <span className="hidden sm:inline">Clear</span>
                      </ModernButton>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-2 mt-6 pt-6 border-t border-gray-200/50">
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100">
                <CurrencyDollarIcon className="h-5 w-5 text-primary-600" />
              </div>
              <span className="text-sm font-semibold bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent">Transaction Status:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', name: 'All', shortName: 'All', count: totalCount, icon: CurrencyDollarIcon },
                { id: 'completed', name: 'Completed', shortName: 'Done', count: transactions.filter(t => t.status === 'completed').length, icon: CheckCircleIcon },
                { id: 'pending', name: 'Pending', shortName: 'Pending', count: transactions.filter(t => t.status === 'pending').length, icon: ClockIcon },
                { id: 'failed', name: 'Failed', shortName: 'Failed', count: transactions.filter(t => t.status === 'failed').length, icon: XCircleIcon }
              ].map((tab) => (
                <ModernButton
                  key={tab.id}
                  variant={filter === tab.id ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setFilter(tab.id)}
                  className="relative flex-shrink-0 transform hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.shortName}</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      filter === tab.id 
                        ? 'bg-white/20 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </div>
                </ModernButton>
              ))}
            </div>
          </div>
        </ModernCard>

        {/* Transactions List */}
        <ModernCard variant="glass" className="animate-fade-in" style={{animationDelay: '200ms'}}>
          <div className="p-4 sm:p-6">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 shadow-soft">
                  <CurrencyDollarIcon className="h-7 w-7 text-primary-600 flex-shrink-0" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Transaction History
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                <span className="px-4 py-2 bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 text-sm font-semibold rounded-full shadow-soft animate-bounce-in">
                  {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
                </span>
                <div className="w-16 h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"></div>
              </div>
            </div>
            
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow animate-bounce-in">
                  <ClockIcon className="h-16 w-16 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">No transactions found</h3>
                <p className="text-gray-600 max-w-md mx-auto text-lg leading-relaxed">
                  {filter === 'all' 
                    ? "You haven't made any transactions yet. Start by loading your balance or purchasing tickets."
                    : `No ${filter} transactions found. Try adjusting your filters or check a different status.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction, index) => {
                  const type = transaction.transactionType || transaction.transaction_type || 'transaction';
                  const status = transaction.status || 'completed';
                  return (
                  <ModernCard
                    key={transaction.id}
                    variant="glass"
                    className="hover:shadow-glow transition-all duration-300 animate-slide-in transform hover:scale-[1.02] hover:-translate-y-1"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 shadow-soft">
                            {getTransactionIcon(type, status)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full shadow-soft ${getTransactionColor(type, status)}`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2 font-medium">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-2xl font-bold mb-2 ${
                            type === 'load' || type === 'refund'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {formatAmount(transaction.amount, type)}
                          </div>
                          <div className="flex items-center justify-end space-x-2">
                            <div className="p-1 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                              {getStatusIcon(status)}
                            </div>
                            <span className="text-xs text-gray-600 capitalize font-semibold">
                              {status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ModernCard>
                );})}
              </div>
            )}
          </div>
        </ModernCard>

        {/* Pagination */}
        {totalPages > 1 && (
          <ModernCard variant="glass" className="mt-6 animate-fade-in" style={{animationDelay: '400ms'}}>
            <div className="px-4 sm:px-6 py-4">
              <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-center sm:text-left">
                  <div className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-1">
                    Page <span className="text-primary-700">{currentPage}</span> of <span className="text-accent-600">{totalPages}</span>
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    ({totalCount} total transactions)
                  </div>
                </div>
                <div className="flex justify-center sm:justify-end space-x-3">
                  <ModernButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex-1 sm:flex-none transform hover:scale-105 transition-all duration-300"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </ModernButton>
                  <ModernButton
                    variant="primary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="flex-1 sm:flex-none transform hover:scale-105 transition-all duration-300"
                  >
                    Next
                  </ModernButton>
                </div>
              </div>
            </div>
          </ModernCard>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
