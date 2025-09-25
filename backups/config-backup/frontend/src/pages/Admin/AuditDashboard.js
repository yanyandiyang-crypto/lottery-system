import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const AuditDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [securitySummary, setSecuritySummary] = useState(null);
  const [failedLogins, setFailedLogins] = useState([]);
  const [recentAudit, setRecentAudit] = useState([]);
  const [selectedTab, setSelectedTab] = useState('summary');
  const [startDate, setStartDate] = useState(''); // YYYY-MM-DD
  const [endDate, setEndDate] = useState('');   // YYYY-MM-DD
  const [filterUserId, setFilterUserId] = useState('');
  const [filterOperation, setFilterOperation] = useState('');
  const [filterTable, setFilterTable] = useState('');

  useEffect(() => {
    if (user?.role === 'superadmin' || user?.role === 'admin') {
      fetchSecurityData();
    }
  }, [user]);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // Build query params for system log
      const params = new URLSearchParams();
      params.set('limit', '50');
      if (startDate) {
        const s = new Date(startDate); s.setHours(0,0,0,0);
        params.set('startDate', s.toISOString());
      }
      if (endDate) {
        const e = new Date(endDate); e.setHours(23,59,59,999);
        params.set('endDate', e.toISOString());
      }
      if (filterUserId) params.set('userId', filterUserId);
      if (filterOperation) params.set('operation', filterOperation);
      if (filterTable) params.set('tableName', filterTable);

      const [summaryRes, failedLoginsRes, auditRes] = await Promise.all([
        api.get('/audit/security-summary'),
        api.get('/audit/failed-logins'),
        api.get(`/audit/system-log?${params.toString()}`)
      ]);

      setSecuritySummary(summaryRes.data.data);
      setFailedLogins(failedLoginsRes.data.data.failedLogins);
      setRecentAudit(auditRes.data.data.auditLogs);
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (startDate) {
      const s = new Date(startDate); s.setHours(0,0,0,0);
      params.set('startDate', s.toISOString());
    }
    if (endDate) {
      const e = new Date(endDate); e.setHours(23,59,59,999);
      params.set('endDate', e.toISOString());
    }
    if (filterUserId) params.set('userId', filterUserId);
    if (filterOperation) params.set('operation', filterOperation);
    if (filterTable) params.set('tableName', filterTable);
    // Open in new tab; backend sets CSV headers
    const url = `/api/v1/audit/system-log/export?${params.toString()}`;
    window.open(url, '_blank');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (success) => {
    return success ? (
      <CheckCircleIcon className="h-5 w-5 text-green-500" />
    ) : (
      <XCircleIcon className="h-5 w-5 text-red-500" />
    );
  };

  const getOperationColor = (operation) => {
    switch (operation) {
      case 'INSERT': return 'text-green-600 bg-green-100';
      case 'UPDATE': return 'text-blue-600 bg-blue-100';
      case 'DELETE': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security Audit Dashboard</h1>
          <p className="mt-2 text-gray-600">Monitor system security and user activities</p>
        </div>

        {/* Filters + Actions */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-4 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Table</label>
              <input
                type="text"
                placeholder="e.g. tickets"
                value={filterTable}
                onChange={(e)=> setFilterTable(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Operation</label>
              <select
                value={filterOperation}
                onChange={(e)=> setFilterOperation(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Any</option>
                <option value="INSERT">INSERT</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">User ID</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 9"
                value={filterUserId}
                onChange={(e)=> setFilterUserId(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchSecurityData}
                className="inline-flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm"
              >
                Apply
              </button>
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-sm"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'summary', name: 'Security Summary', icon: ShieldCheckIcon },
              { id: 'logins', name: 'Failed Logins', icon: ExclamationTriangleIcon },
              { id: 'audit', name: 'Audit Log', icon: EyeIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Security Summary Tab */}
        {selectedTab === 'summary' && securitySummary && (
          <div className="space-y-6">
            {/* Security Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <XCircleIcon className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Failed Logins (24h)
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {securitySummary.failedLogins24h}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-8 w-8 text-green-500" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Successful Logins (24h)
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {securitySummary.successfulLogins24h}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Failed Transactions (24h)
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {securitySummary.failedTransactions24h}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserIcon className="h-8 w-8 text-purple-500" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Suspicious IPs
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {securitySummary.suspiciousIPs.length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Suspicious IPs */}
            {securitySummary.suspiciousIPs.length > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Suspicious IP Addresses
                  </h3>
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            IP Address
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Failed Attempts
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {securitySummary.suspiciousIPs.map((ip, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {ip.ip_address}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {ip.attempts}
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
        )}

        {/* Failed Logins Tab */}
        {selectedTab === 'logins' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Failed Login Attempts (Last 24 Hours)
              </h3>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {failedLogins.map((login, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {login.username || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {login.ip_address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {login.failure_reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(login.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Audit Log Tab */}
        {selectedTab === 'audit' && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Audit Activities
              </h3>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Operation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentAudit.map((activity, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOperationColor(activity.operation)}`}>
                            {activity.operation}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activity.table_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {activity.username || 'System'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(activity.created_at)}
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
    </div>
  );
};

export default AuditDashboard;
