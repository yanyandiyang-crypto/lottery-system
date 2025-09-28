import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { getCurrentDatePH } from '../../utils/dateUtils';
import {
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  TicketIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';

const Reports = () => {
  // const { user } = useAuth(); // Removed unused variable
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: getCurrentDatePH(),
    endDate: getCurrentDatePH()
  });

  const reportTypes = [
    { id: 'sales', name: 'Sales Report', description: 'Daily, weekly, and monthly sales performance' },
    { id: 'agents', name: 'Agent Performance', description: 'Individual agent sales and commission reports' },
    { id: 'tickets', name: 'Ticket Analysis', description: 'Ticket sales patterns and winning analysis' },
    { id: 'financial', name: 'Financial Summary', description: 'Revenue, expenses, and profit analysis' },
    { id: 'draws', name: 'Draw Reports', description: 'Draw results and payout analysis' }
  ];

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        reportType: selectedReport,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const response = await api.get(`/reports?${params}`);
      setReports(response.data);
    } catch (err) {
      setError('Failed to fetch report data');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedReport, dateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const handleExportReport = async () => {
    try {
      const params = new URLSearchParams({
        reportType: selectedReport,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: 'csv'
      });
      
      const response = await api.get(`/reports/export?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedReport}_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export report');
      console.error('Error exporting report:', err);
    }
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'sales':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Total Gross"
              value={`₱${reports.totalGross?.toLocaleString() || reports.totalRevenue?.toLocaleString() || '0'}`}
              icon={CurrencyDollarIcon}
              color="success"
              trend="Total Revenue"
            />
            <StatCard
              title="Total Net"
              value={`₱${reports.totalNet?.toLocaleString() || ((reports.totalRevenue || 0) - (reports.totalPayouts || 0)).toLocaleString()}`}
              icon={ChartBarIcon}
              color="primary"
              trend="After Payouts"
            />
            <StatCard
              title="Monthly Gross"
              value={`₱${reports.monthlyGross?.toLocaleString() || reports.totalRevenue?.toLocaleString() || '0'}`}
              icon={CurrencyDollarIcon}
              color="secondary"
              trend="This Month"
            />
            <StatCard
              title="Monthly Net"
              value={`₱${reports.monthlyNet?.toLocaleString() || ((reports.totalRevenue || 0) - (reports.totalPayouts || 0)).toLocaleString()}`}
              icon={ChartBarIcon}
              color="warning"
              trend="Monthly Profit"
            />
          </div>
        );
      
      case 'agents':
        return (
          <div className="space-y-4">
            {reports.agentPerformance?.map((agent) => (
              <ModernCard key={agent.id} className="hover:shadow-lg transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <UserGroupIcon className="h-10 w-10 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{agent.username}</h4>
                        <p className="text-sm text-gray-500 capitalize">{agent.role}</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-bold text-green-600">₱{agent.totalSales?.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{agent.ticketCount} tickets sold</p>
                    </div>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        );
      
      case 'tickets':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ModernCard>
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <TicketIcon className="h-6 w-6 mr-3 text-blue-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Ticket Status Distribution</h4>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {reports.ticketStatus?.map((status) => (
                    <div key={status.status} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium capitalize text-gray-700">{status.status}</span>
                      <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-full">{status.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ModernCard>
            
            <ModernCard>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <TrophyIcon className="h-6 w-6 mr-3 text-green-600" />
                  <h4 className="text-lg font-semibold text-gray-900">Winning Analysis</h4>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Winners</span>
                    <span className="text-lg font-bold text-green-600">{reports.winners?.total || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">Total Payouts</span>
                    <span className="text-lg font-bold text-green-600">₱{reports.winners?.totalPayout?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
            </ModernCard>
          </div>
        );
      
      case 'financial':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
              title="Total Revenue"
              value={`₱${reports.revenue?.toLocaleString() || '0'}`}
              icon={CurrencyDollarIcon}
              color="success"
              trend="Gross Income"
            />
            <StatCard
              title="Total Payouts"
              value={`₱${reports.payouts?.toLocaleString() || '0'}`}
              icon={TrophyIcon}
              color="danger"
              trend="Prize Payments"
            />
            <StatCard
              title="Net Profit"
              value={`₱${reports.netProfit?.toLocaleString() || '0'}`}
              icon={ChartBarIcon}
              color="primary"
              trend="After Expenses"
            />
            <StatCard
              title="Commission Paid"
              value={`₱${reports.commission?.toLocaleString() || '0'}`}
              icon={UserGroupIcon}
              color="secondary"
              trend="Agent Earnings"
            />
          </div>
        );
      
      case 'draws':
        return (
          <div className="space-y-6">
            {reports.drawResults?.map((draw) => (
              <ModernCard key={draw.id} className="hover:shadow-lg transition-shadow duration-200">
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                    <div className="flex items-center">
                      <TrophyIcon className="h-6 w-6 mr-3 text-yellow-600" />
                      <h4 className="text-lg font-semibold text-gray-900">{draw.name}</h4>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <CalendarDaysIcon className="h-4 w-4 mr-1" />
                      {new Date(draw.drawDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Winning Numbers</h5>
                    <div className="flex flex-wrap gap-2">
                      {draw.winningNumbers?.map((number, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-sm"
                        >
                          {number}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-gray-600">Prize Amount</div>
                      <div className="text-lg font-bold text-green-600">₱{draw.prizeAmount?.toLocaleString()}</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-gray-600">Winners</div>
                      <div className="text-lg font-bold text-blue-600">{draw.winnerCount || 0}</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-sm text-gray-600">Total Payout</div>
                      <div className="text-lg font-bold text-purple-600">₱{draw.totalPayout?.toLocaleString() || '0'}</div>
                    </div>
                  </div>
                </div>
              </ModernCard>
            ))}
          </div>
        );
      
      default:
        return <div>Select a report type to view data</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="Reports"
          subtitle="Generate and view detailed business reports"
          icon={DocumentChartBarIcon}
        />

        {error && (
          <ModernCard className="mb-6 border-l-4 border-red-500 bg-red-50">
            <div className="p-4">
              <div className="text-red-700 font-medium">{error}</div>
            </div>
          </ModernCard>
        )}

        {/* Report Type Selection */}
        <ModernCard className="mb-8">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900">Select Report Type</h3>
            <p className="text-sm text-gray-600 mt-1">Choose the type of report you want to generate</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTypes.map((report) => (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-md ${
                    selectedReport === report.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <h4 className="text-base font-semibold text-gray-900">{report.name}</h4>
                  <p className="text-sm text-gray-600 mt-2">{report.description}</p>
                </button>
              ))}
            </div>
          </div>
        </ModernCard>

        {/* Date Range Filter */}
        <ModernCard className="mb-8">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-6 w-6 mr-3 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Date Range</h3>
                  <p className="text-sm text-gray-600 mt-1">Select the date range for your report</p>
                </div>
              </div>
              <ModernButton
                onClick={handleExportReport}
                variant="success"
                size="md"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export CSV
              </ModernButton>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Report Content */}
        <ModernCard>
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {reportTypes.find(r => r.id === selectedReport)?.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {reportTypes.find(r => r.id === selectedReport)?.description}
            </p>
          </div>
          <div className="p-6">
            {renderReportContent()}
          </div>
        </ModernCard>
      </div>
    </div>
  );
};

export default Reports;

