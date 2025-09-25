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
  XMarkIcon
} from '@heroicons/react/24/outline';

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
      const response = await api.get(`/balance-management/transactions/${targetUserId}?page=${currentPage}&limit=20`);
      if (response.data?.success) {
        setTransactions(response.data.data.transactions || []);
        setTotalPages(response.data.data.pagination?.pages || 1);
        setTotalCount(response.data.data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
          <p className="mt-2 text-gray-600">View your balance transactions and ticket purchases</p>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-3">
            {/* Date filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Filter by date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setCurrentPage(1);
                  setSelectedDate(e.target.value);
                }}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedDate && (
                <button
                  onClick={() => { setSelectedDate(''); setCurrentPage(1); }}
                  className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                  Clear
                </button>
              )}
            </div>

            {/* User selector for admins/area coordinators/coordinators */}
            {['superadmin', 'admin', 'area_coordinator', 'coordinator'].includes(user?.role) && (
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">User</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => { setSelectedUserId(e.target.value); setCurrentPage(1); }}
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[220px]"
                >
                  <option value="">All (self)</option>
                  {scopedUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.fullName || u.username} {u.role ? `- ${u.role}` : ''}</option>
                  ))}
                </select>
                {selectedUserId && (
                  <button
                    onClick={() => { setSelectedUserId(''); setCurrentPage(1); }}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <XMarkIcon className="h-3.5 w-3.5 mr-1" />
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <nav className="flex flex-wrap gap-2 sm:gap-4">
            {[
              { id: 'all', name: 'All Transactions', count: totalCount },
              { id: 'completed', name: 'Completed', count: transactions.filter(t => t.status === 'completed').length },
              { id: 'pending', name: 'Pending', count: transactions.filter(t => t.status === 'pending').length },
              { id: 'failed', name: 'Failed', count: transactions.filter(t => t.status === 'failed').length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium text-sm ${
                  filter === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.name}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  filter === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Transactions List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-500">
                  {filter === 'all' 
                    ? "You haven't made any transactions yet."
                    : `No ${filter} transactions found.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => {
                  const type = transaction.transactionType || transaction.transaction_type || 'transaction';
                  const status = transaction.status || 'completed';
                  return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {getTransactionIcon(type, status)}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getTransactionColor(type, status)}`}>
                            {status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-lg font-semibold ${
                        type === 'load' || type === 'refund'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {formatAmount(transaction.amount, type)}
                      </div>
                      <div className="flex items-center justify-end space-x-1 mt-1">
                        {getStatusIcon(status)}
                        <span className="text-xs text-gray-500 capitalize">
                          {status}
                        </span>
                      </div>
                    </div>
                  </div>
                );})}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages} ({totalCount} total transactions)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;
