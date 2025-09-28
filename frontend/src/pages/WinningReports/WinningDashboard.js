import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  TrophyIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import StatCard from '../../components/UI/StatCard';

const WinningDashboard = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [agentSummary, setAgentSummary] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadWinningReports();
  }, []);

  const loadWinningReports = async () => {
    setLoading(true);
    try {
      // Load main summary
      const summaryResponse = await api.get('/winning-reports/summary?' + new URLSearchParams(dateRange));
      if (summaryResponse.data.success) {
        setReportData(summaryResponse.data.report);
      }

      // Load agent summary
      const agentResponse = await api.get('/winning-reports/agent-summary?' + new URLSearchParams(dateRange));
      if (agentResponse.data.success) {
        setAgentSummary(agentResponse.data);
      }

      // Load daily data
      const dailyResponse = await api.get('/winning-reports/daily-summary?days=7');
      if (dailyResponse.data.success) {
        setDailyData(dailyResponse.data);
      }

    } catch (err) {
      setError('Error loading winning reports');
      console.error('Winning reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyDateFilter = () => {
    loadWinningReports();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading winning reports..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white flex items-center justify-center">
        <ModernCard className="max-w-md mx-auto">
          <div className="text-center p-6">
            <div className="text-red-600 text-lg font-medium">{error}</div>
            <ModernButton 
              onClick={loadWinningReports}
              variant="primary"
              className="mt-4"
            >
              Try Again
            </ModernButton>
          </div>
        </ModernCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="Winning Reports & Claims Dashboard"
          subtitle="Track expected winnings, claimed prizes, and net sales for management oversight"
          icon={TrophyIcon}
        />

        {/* Date Range Filter */}
        <ModernCard className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-sky-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-6 w-6 mr-3 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filter by Date Range</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <ModernButton
                  onClick={applyDateFilter}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Apply Filter
                </ModernButton>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Main Summary Cards */}
        {reportData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <StatCard
              title="Gross Sales"
              value={formatCurrency(reportData.summary.grossSales)}
              subtitle={`Total tickets: ${reportData.summary.totalTickets}`}
              icon={CurrencyDollarIcon}
              trend="up"
              color="blue"
            />
            <StatCard
              title="Expected Winnings"
              value={formatCurrency(reportData.summary.expectedWinnings)}
              subtitle={`Pending: ${formatCurrency(reportData.summary.pendingClaims)}`}
              icon={TrophyIcon}
              trend="neutral"
              color="amber"
            />
            <StatCard
              title="Claimed Winnings"
              value={formatCurrency(reportData.summary.claimedWinnings)}
              subtitle={`Claimed tickets: ${reportData.summary.claimedTickets}`}
              icon={ChartBarIcon}
              trend="up"
              color="red"
            />
            <StatCard
              title="Net Sales"
              value={formatCurrency(reportData.summary.netSales)}
              subtitle={`Profit margin: ${formatPercentage(reportData.metrics.profitMargin)}`}
              icon={ArrowTrendingUpIcon}
              trend="up"
              color="green"
            />
          </div>
        )}

      {/* Metrics Row */}
      {reportData && (
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#374151' }}>📊 Key Metrics</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                {formatPercentage(reportData.metrics.claimRate)}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Claim Rate</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                {formatPercentage(reportData.metrics.profitMargin)}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Profit Margin</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
                {formatPercentage(reportData.metrics.winRate)}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Win Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Summary Table */}
      {agentSummary && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          marginBottom: '30px',
          overflow: 'hidden'
        }}>
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '20px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ color: '#374151', margin: 0 }}>👥 Agent Performance Summary</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Agent</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Gross Sales</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Claimed Winnings</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Net Sales</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Tickets</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Profit %</th>
                </tr>
              </thead>
              <tbody>
                {agentSummary.agentSummaries.map((agent, index) => (
                  <tr key={agent.agentId} style={{
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                  }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: '600' }}>{agent.agentName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {agent.agentId}</div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                      {formatCurrency(agent.grossSales)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', color: '#dc2626' }}>
                      {formatCurrency(agent.claimedWinnings)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                      {formatCurrency(agent.netSales)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                      {agent.totalTickets} / {agent.claimedTickets}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center', 
                      borderBottom: '1px solid #e5e7eb',
                      color: agent.profitMargin >= 0 ? '#10b981' : '#dc2626',
                      fontWeight: '600'
                    }}>
                      {formatPercentage(agent.profitMargin)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f3f4f6', fontWeight: '700' }}>
                  <td style={{ padding: '12px', borderTop: '2px solid #d1d5db' }}>TOTALS</td>
                  <td style={{ padding: '12px', textAlign: 'right', borderTop: '2px solid #d1d5db' }}>
                    {formatCurrency(agentSummary.totals.grossSales)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', borderTop: '2px solid #d1d5db', color: '#dc2626' }}>
                    {formatCurrency(agentSummary.totals.claimedWinnings)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', borderTop: '2px solid #d1d5db' }}>
                    {formatCurrency(agentSummary.totals.netSales)}
                  </td>
                  <td colSpan="2" style={{ padding: '12px', borderTop: '2px solid #d1d5db' }}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Daily Summary */}
      {dailyData && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '20px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ color: '#374151', margin: 0 }}>📅 Last 7 Days Summary</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Tickets</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Gross Sales</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Claims</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Est. Winnings</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Net Sales</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.dailyData.map((day, index) => (
                  <tr key={day.date} style={{
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                  }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      {new Date(day.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                      {day.ticketCount}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                      {formatCurrency(day.grossSales)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                      {day.claimedCount}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', color: '#dc2626' }}>
                      {formatCurrency(day.estimatedClaimedWinnings)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                      {formatCurrency(day.netSales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f0f9ff',
        borderRadius: '10px',
        border: '1px solid #0ea5e9'
      }}>
        <h4 style={{ color: '#0c4a6e', marginBottom: '15px' }}>📋 Understanding the Reports:</h4>
        <ul style={{ color: '#075985', lineHeight: '1.6', paddingLeft: '20px' }}>
          <li><strong>Gross Sales:</strong> Total amount collected from ticket sales</li>
          <li><strong>Expected Winnings:</strong> Calculated winnings based on draw results</li>
          <li><strong>Claimed Winnings:</strong> Actual amount paid out to winners</li>
          <li><strong>Net Sales:</strong> Gross Sales minus Claimed Winnings (your profit)</li>
          <li><strong>Claim Rate:</strong> Percentage of expected winnings that have been claimed</li>
          <li><strong>Profit Margin:</strong> Net Sales as percentage of Gross Sales</li>
        </ul>
      </div>
      </div>
    </div>
  );
};

export default WinningDashboard;
