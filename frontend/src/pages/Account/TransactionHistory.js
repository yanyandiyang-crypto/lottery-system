import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { getRoleBadgeColor } from '../../utils/roleColors';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';

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
  const [filtersExpanded, setFiltersExpanded] = useState(false);

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
      return <XCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />;
    }
    
    if (status === 'pending') {
      return <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />;
    }

    switch (type) {
      case 'load':
        return <ArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />;
      case 'use':
        return <ArrowDownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />;
      case 'refund':
        return <ArrowUpIcon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />;
      default:
        return <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />;
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
      
      <div className="relative w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Compact Header for Mobile */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
            Transaction History
          </h1>
        </div>

        {/* Filters */}
        <ModernCard variant="glass" className="mb-4 sm:mb-6 animate-fade-in">
          <div className="p-3 sm:p-6">
            <div 
              className="flex items-center justify-between cursor-pointer" 
              onClick={() => setFiltersExpanded(!filtersExpanded)}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-100 to-accent-100">
                  <FunnelIcon className="h-4 w-4 sm:h-6 sm:w-6 text-primary-600 flex-shrink-0" />
                </div>
                <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Filters</h3>
              </div>
              <button 
                className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label={filtersExpanded ? "Collapse filters" : "Expand filters"}
              >
                {filtersExpanded ? (
                  <ChevronUpIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                )}
              </button>
            </div>
            
            {filtersExpanded && (
              <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4 mt-4 sm:mt-6 animate-fade-in">
              {/* Date filter */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1.5 sm:space-y-0 sm:space-x-3">
                <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Date</label>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setCurrentPage(1);
                      setSelectedDate(e.target.value);
                    }}
                    className="border border-gray-200 rounded-lg sm:rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:shadow-soft w-full sm:w-auto"
                  />
                  {selectedDate && (
                    <ModernButton
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedDate(''); setCurrentPage(1); }}
                      icon={XMarkIcon}
                      className="flex-shrink-0 !p-1.5 sm:!p-2"
                    >
                      <span className="hidden sm:inline text-xs">Clear</span>
                    </ModernButton>
                  )}
                </div>
              </div>

              {/* User selector for admins/area coordinators/coordinators */}
              {['superadmin', 'admin', 'area_coordinator', 'coordinator'].includes(user?.role) && (
                <div className="flex flex-col sm:flex-row sm:items-center space-y-1.5 sm:space-y-0 sm:space-x-3">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">User</label>
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    <select
                      value={selectedUserId}
                      onChange={(e) => { setSelectedUserId(e.target.value); setCurrentPage(1); }}
                      className="border border-gray-200 rounded-lg sm:rounded-xl px-2.5 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:shadow-soft w-full sm:min-w-[220px]"
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
                        className="flex-shrink-0 !p-1.5 sm:!p-2"
                      >
                        <span className="hidden sm:inline text-xs">Clear</span>
                      </ModernButton>
                    )}
                  </div>
                </div>
              )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-2 mt-3 sm:mt-6 pt-3 sm:pt-6 border-t border-gray-200/50">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100">
                <CurrencyDollarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
              </div>
              <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-gray-700 to-gray-600 bg-clip-text text-transparent">Status:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
                  className="relative flex-shrink-0 transform hover:scale-105 transition-all duration-300 !px-2 sm:!px-3 !py-1.5 sm:!py-2 !text-xs sm:!text-sm"
                >
                  <div className="flex items-center space-x-1">
                    <span className="hidden sm:inline">{tab.name}</span>
                    <span className="sm:hidden">{tab.shortName}</span>
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs rounded-full font-medium ${
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
          <div className="p-3 sm:p-6">
            <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 shadow-soft">
                    <CurrencyDollarIcon className="h-5 w-5 sm:h-7 sm:w-7 text-primary-600 flex-shrink-0" />
                  </div>
                  <h3 className="text-base sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Transactions
                  </h3>
                </div>
                {selectedUserId && scopedUsers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Viewing:</span>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(scopedUsers.find(u => u.id.toString() === selectedUserId)?.role)}`}>
                      {scopedUsers.find(u => u.id.toString() === selectedUserId)?.fullName || scopedUsers.find(u => u.id.toString() === selectedUserId)?.username}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center">
                <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 text-xs sm:text-sm font-semibold rounded-full shadow-soft animate-bounce-in">
                  {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transaction' : 'transactions'}
                </span>
              </div>
            </div>
            
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8 sm:py-16 animate-fade-in">
                <div className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-8 shadow-glow animate-bounce-in">
                  <ClockIcon className="h-10 w-10 sm:h-16 sm:w-16 text-primary-600" />
                </div>
                <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2 sm:mb-4">No transactions found</h3>
                <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-lg leading-relaxed px-4">
                  {filter === 'all' 
                    ? "You haven't made any transactions yet. Start by loading your balance or purchasing tickets."
                    : `No ${filter} transactions found. Try adjusting your filters or check a different status.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2.5">
                {filteredTransactions.map((transaction, index) => {
                  const type = transaction.transactionType || transaction.transaction_type || 'transaction';
                  const status = transaction.status || 'completed';
                  return (
                  <ModernCard
                    key={transaction.id}
                    variant="glass"
                    className="hover:shadow-glow transition-all duration-300 animate-slide-in transform hover:scale-[1.01] hover:-translate-y-0.5"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="p-2 sm:p-3">
                      <div className="flex items-start sm:items-center justify-between gap-1.5 sm:gap-3">
                        <div className="flex items-start sm:items-center space-x-1.5 sm:space-x-3 flex-1 min-w-0">
                          <div className="p-1.5 sm:p-2.5 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 flex-shrink-0">
                            {getTransactionIcon(type, status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 mb-0.5 sm:mb-1.5">
                              <span className="text-xs sm:text-base font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent truncate">
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </span>
                              <span className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full ${getTransactionColor(type, status)} w-fit`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-sm text-gray-700 mb-0.5 sm:mb-1 font-medium line-clamp-1 sm:line-clamp-2">
                              {transaction.description}
                            </p>
                            <p className="text-[9px] sm:text-xs text-gray-500 font-medium">
                              {formatDate(transaction.createdAt)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <div className={`text-base sm:text-xl font-bold mb-0.5 sm:mb-1.5 whitespace-nowrap ${
                            type === 'load' || type === 'refund'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {formatAmount(transaction.amount, type)}
                          </div>
                          <div className="hidden sm:flex items-center justify-end space-x-1.5">
                            <div className="p-0.5 rounded bg-gradient-to-br from-gray-50 to-gray-100">
                              {getStatusIcon(status)}
                            </div>
                            <span className="text-[10px] text-gray-600 capitalize font-semibold">
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
          <ModernCard variant="glass" className="mt-4 sm:mt-6 animate-fade-in" style={{animationDelay: '400ms'}}>
            <div className="px-3 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-center sm:text-left">
                  <div className="text-sm sm:text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent mb-0.5 sm:mb-1">
                    Page <span className="text-primary-700">{currentPage}</span> of <span className="text-accent-600">{totalPages}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 font-medium">
                    ({totalCount} total)
                  </div>
                </div>
                <div className="flex justify-center sm:justify-end space-x-2 sm:space-x-3">
                  <ModernButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex-1 sm:flex-none transform hover:scale-105 transition-all duration-300 !px-3 sm:!px-4 !py-1.5 sm:!py-2 !text-xs sm:!text-sm"
                  >
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </ModernButton>
                  <ModernButton
                    variant="primary"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="flex-1 sm:flex-none transform hover:scale-105 transition-all duration-300 !px-3 sm:!px-4 !py-1.5 sm:!py-2 !text-xs sm:!text-sm"
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
