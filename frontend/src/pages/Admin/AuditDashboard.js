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
  ShieldCheckIcon,
  FunnelIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';
import ModernTable from '../../components/UI/ModernTable';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <ModernCard variant="elevated" className="p-8 text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheckIcon className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent mb-3">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this page.</p>
        </ModernCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Security Audit Dashboard"
          subtitle="Monitor system security, user activities, and audit trails"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Admin', href: '/admin' },
            { label: 'Security Audit' }
          ]}
        />

        {/* Filters + Actions */}
        <ModernCard variant="glass" className="mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-4">
              <FunnelIcon className="h-5 w-5 text-primary-600 flex-shrink-0" />
              <h3 className="text-lg font-semibold text-gray-900">Audit Filters</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Table</label>
                <input
                  type="text"
                  placeholder="e.g. tickets"
                  value={filterTable}
                  onChange={(e)=> setFilterTable(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
                <select
                  value={filterOperation}
                  onChange={(e)=> setFilterOperation(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                >
                  <option value="">Any</option>
                  <option value="INSERT">INSERT</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 9"
                  value={filterUserId}
                  onChange={(e)=> setFilterUserId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <ModernButton
                variant="primary"
                onClick={fetchSecurityData}
                className="w-full sm:w-auto"
              >
                Apply Filters
              </ModernButton>
              <ModernButton
                variant="secondary"
                onClick={handleExportCSV}
                icon={DocumentArrowDownIcon}
                className="w-full sm:w-auto"
              >
                Export CSV
              </ModernButton>
            </div>
          </div>
        </ModernCard>

        {/* Tab Navigation */}
        <ModernCard variant="elevated" className="mb-8">
          <div className="px-4 sm:px-6 py-4">
            <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-8" aria-label="Audit Tabs">
              {[
                { id: 'summary', name: 'Security Summary', shortName: 'Summary', icon: ShieldCheckIcon },
                { id: 'logins', name: 'Failed Logins', shortName: 'Logins', icon: ExclamationTriangleIcon },
                { id: 'audit', name: 'Audit Log', shortName: 'Audit', icon: EyeIcon }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedTab === tab.id;
                
                return (
                  <ModernButton
                    key={tab.id}
                    variant={isActive ? 'primary' : 'ghost'}
                    onClick={() => setSelectedTab(tab.id)}
                    className="w-full sm:w-auto justify-center sm:justify-start"
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="hidden sm:inline">{tab.name}</span>
                      <span className="sm:hidden">{tab.shortName}</span>
                    </div>
                  </ModernButton>
                );
              })}
            </nav>
          </div>
        </ModernCard>

        {/* Security Summary Tab */}
        {selectedTab === 'summary' && securitySummary && (
          <div className="space-y-6 animate-fade-in">
            {/* Security Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                title="Failed Logins (24h)"
                value={securitySummary.failedLogins24h}
                icon={XCircleIcon}
                color="danger"
                className="animate-bounce-in"
                style={{ animationDelay: '0ms' }}
              />
              <StatCard
                title="Successful Logins (24h)"
                value={securitySummary.successfulLogins24h}
                icon={CheckCircleIcon}
                color="success"
                className="animate-bounce-in"
                style={{ animationDelay: '100ms' }}
              />
              <StatCard
                title="Failed Transactions (24h)"
                value={securitySummary.failedTransactions24h}
                icon={ExclamationTriangleIcon}
                color="warning"
                className="animate-bounce-in"
                style={{ animationDelay: '200ms' }}
              />
              <StatCard
                title="Suspicious IPs"
                value={securitySummary.suspiciousIPs.length}
                icon={UserIcon}
                color="accent"
                className="animate-bounce-in"
                style={{ animationDelay: '300ms' }}
              />
            </div>

            {/* Suspicious IPs */}
            {securitySummary.suspiciousIPs.length > 0 && (
              <ModernCard variant="elevated" className="animate-slide-in">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center space-x-2 mb-6">
                    <ExclamationTriangleIcon className="h-6 w-6 text-warning-600" />
                    <h3 className="text-xl font-semibold bg-gradient-to-r from-warning-600 to-danger-600 bg-clip-text text-transparent">
                      Suspicious IP Addresses
                    </h3>
                  </div>
                  <ModernTable
                    columns={[
                      { key: 'ip_address', label: 'IP Address', sortable: true },
                      { key: 'attempts', label: 'Failed Attempts', sortable: true }
                    ]}
                    data={securitySummary.suspiciousIPs}
                    emptyMessage="No suspicious IP addresses detected"
                  />
                </div>
              </ModernCard>
            )}
          </div>
        )}

        {/* Failed Logins Tab */}
        {selectedTab === 'logins' && (
          <ModernCard variant="elevated" className="animate-fade-in">
            <div className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-6">
                <ExclamationTriangleIcon className="h-6 w-6 text-danger-600" />
                <h3 className="text-xl font-semibold bg-gradient-to-r from-danger-600 to-warning-600 bg-clip-text text-transparent">
                  Failed Login Attempts (Last 24 Hours)
                </h3>
                <span className="px-3 py-1 bg-danger-100 text-danger-700 text-sm font-medium rounded-full">
                  {failedLogins.length} attempts
                </span>
              </div>
              <ModernTable
                columns={[
                  { key: 'username', label: 'User', sortable: true, render: (value) => value || 'Unknown' },
                  { key: 'ip_address', label: 'IP Address', sortable: true },
                  { key: 'failure_reason', label: 'Reason', sortable: true },
                  { key: 'created_at', label: 'Time', sortable: true, render: (value) => formatDate(value) }
                ]}
                data={failedLogins}
                emptyMessage="No failed login attempts in the last 24 hours"
              />
            </div>
          </ModernCard>
        )}

        {/* Audit Log Tab */}
        {selectedTab === 'audit' && (
          <ModernCard variant="elevated" className="animate-fade-in">
            <div className="p-4 sm:p-6">
              <div className="flex items-center space-x-2 mb-6">
                <EyeIcon className="h-6 w-6 text-primary-600" />
                <h3 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Recent Audit Activities
                </h3>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
                  {recentAudit.length} activities
                </span>
              </div>
              <ModernTable
                columns={[
                  { 
                    key: 'operation', 
                    label: 'Operation', 
                    sortable: true, 
                    render: (value) => (
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getOperationColor(value)}`}>
                        {value}
                      </span>
                    )
                  },
                  { key: 'table_name', label: 'Table', sortable: true },
                  { key: 'username', label: 'User', sortable: true, render: (value) => value || 'System' },
                  { key: 'created_at', label: 'Time', sortable: true, render: (value) => formatDate(value) }
                ]}
                data={recentAudit}
                emptyMessage="No audit activities found"
              />
            </div>
          </ModernCard>
        )}
      </div>
    </div>
  );
};

export default AuditDashboard;
