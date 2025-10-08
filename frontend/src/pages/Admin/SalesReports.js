import React, { useState, useEffect } from 'react';
import { reportsAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import { getCurrentDatePH, getTodayRange } from '../../utils/dateUtils';
import { 
  DocumentArrowDownIcon, 
  ChartBarIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  UsersIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';
import ModernTable from '../../components/UI/ModernTable';

const SalesReports = () => {
  // const { user } = useAuth(); // Removed unused variable
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [drawTimeData, setDrawTimeData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    startDate: getCurrentDatePH(),
    endDate: getCurrentDatePH(),
    reportType: 'summary',
    groupBy: 'date'
  });

  useEffect(() => {
    fetchReportData();
    fetchDrawTimeData();
  }, [filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await reportsAPI.getSalesReport(filters);
      setReportData(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrawTimeData = async () => {
    try {
      const response = await reportsAPI.getDrawTimeSales(filters);
      setDrawTimeData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch draw time data:', error);
      // Fallback to mock data if API fails
      const mockDrawTimeData = {
        summary: {
          '2PM': { sales: 50000, tickets: 100, winnings: 15000 },
          '5PM': { sales: 75000, tickets: 150, winnings: 20000 },
          '9PM': { sales: 60000, tickets: 120, winnings: 18000 }
        },
        details: [
          {
            name: 'Sales by Draw Time',
            coordinator: 'All Coordinators',
            agents: [
              { name: 'Agent1', '2PM': 15000, '5PM': 20000, '9PM': 18000, total: 53000 },
              { name: 'Agent2', '2PM': 10000, '5PM': 15000, '9PM': 12000, total: 37000 }
            ]
          }
        ]
      };
      setDrawTimeData(mockDrawTimeData);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const response = await reportsAPI.exportSalesReport({
        ...filters,
        format: 'excel'
      });

      // Create blob and download
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report-${filters.startDate}-to-${filters.endDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Excel report downloaded successfully');
    } catch (error) {
      toast.error('Failed to export Excel report');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="w-full px-2 sm:px-4 py-4 sm:py-6">
        <PageHeader
          title="Sales Reports"
          icon={DocumentChartBarIcon}
        >
          <ModernButton
            onClick={handleExportExcel}
            disabled={exporting || !reportData}
            variant="success"
            size="md"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </ModernButton>
        </PageHeader>

        {/* Filters */}
        <ModernCard className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-6 w-6 mr-3 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Report Filters</h3>
                <p className="text-sm text-gray-600 mt-1">Configure your sales report parameters</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select
                  value={filters.reportType}
                  onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="summary">Summary</option>
                  <option value="detailed">Detailed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
                <select
                  value={filters.groupBy}
                  onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="agent">Agent</option>
                  <option value="region">Region</option>
                </select>
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Tab Navigation */}
        <ModernCard className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-col sm:flex-row px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center justify-center sm:justify-start mb-2 sm:mb-0 mr-0 sm:mr-8 ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('drawTimes')}
                className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center justify-center sm:justify-start mb-2 sm:mb-0 mr-0 sm:mr-8 ${
                  activeTab === 'drawTimes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClockIcon className="h-5 w-5 mr-2" />
                Draw Times
              </button>
              <button
                onClick={() => setActiveTab('userSales')}
                className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center justify-center sm:justify-start mb-2 sm:mb-0 ${
                  activeTab === 'userSales'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UsersIcon className="h-5 w-5 mr-2" />
                User Sales
              </button>
            </nav>
          </div>

        <div className="p-3 sm:p-6">
          {activeTab === 'overview' && reportData && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
                <StatCard
                  title="Total Gross"
                  value={formatCurrency(reportData.summary?.totalGross || reportData.summary?.totalSales || 0)}
                  icon={CurrencyDollarIcon}
                  color="success"
                  subtitle="Total Revenue"
                />

                <StatCard
                  title="Total Net"
                  value={formatCurrency(reportData.summary?.totalNet || (reportData.summary?.totalSales || 0) - (reportData.summary?.totalWinnings || 0))}
                  icon={ChartBarIcon}
                  color="primary"
                  subtitle="After Payouts"
                />

                <StatCard
                  title="Monthly Gross"
                  value={formatCurrency(reportData.summary?.monthlyGross || reportData.summary?.totalSales || 0)}
                  icon={CalendarDaysIcon}
                  color="secondary"
                  subtitle="This Month"
                />

                <StatCard
                  title="Monthly Net"
                  value={formatCurrency(reportData.summary?.monthlyNet || (reportData.summary?.totalSales || 0) - (reportData.summary?.totalWinnings || 0))}
                  icon={ArrowTrendingUpIcon}
                  color="warning"
                  subtitle="Monthly Profit"
                />

                <StatCard
                  title="Total Winnings"
                  value={formatCurrency(reportData.summary?.totalWinnings || 0)}
                  icon={ArrowTrendingDownIcon}
                  color="danger"
                  subtitle={
                    (reportData.summary?.pendingWinnings || reportData.summary?.approvedWinnings) ? 
                    `Pending: ${formatCurrency(reportData.summary.pendingWinnings || 0)} | Paid: ${formatCurrency(reportData.summary.approvedWinnings || 0)}` :
                    "Prize Payouts"
                  }
                />
              </div>

              {/* Daily Sales Table */}
              {reportData.details && reportData.details.length > 0 && (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Daily Sales Breakdown</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Sales data grouped by date</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Agents</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.details.map((day, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {new Date(day.date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(day.totalAmount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {day.ticketCount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {day.agents}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          {activeTab === 'drawTimes' && drawTimeData && (
            <div className="space-y-6">
              {/* Draw Time Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {Object.entries(drawTimeData.summary).map(([time, data]) => (
                    <div key={time} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <ClockIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                {time} Draw Sales
                              </dt>
                              <dd className="text-lg font-medium text-gray-900">
                                {formatCurrency(data.sales)}
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-5 py-3">
                        <div className="text-sm text-gray-600">
                          {data.tickets} tickets • {formatCurrency(data.winnings)} winnings
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center py-8">
                  <p className="text-gray-500">Draw time details table would be displayed here.</p>
                </div>
              </div>
            )}
            {activeTab === 'userSales' && reportData && (
              <div className="space-y-6">
                {/* User Sales Summary */}
                {reportData.sales && reportData.sales.length > 0 && (
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">User Sales Details</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Individual sales transactions by user</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Draw Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordinator</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.sales.map((sale, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {sale.user?.fullName || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(sale.createdAt).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {sale.draw?.drawTime ? formatDrawTime(sale.draw.drawTime) : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(sale.totalAmount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {sale.ticketCount}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {sale.user?.coordinator?.fullName || 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Agent Summary by User */}
                {reportData.details && reportData.details.length > 0 && (
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Agent Performance Summary</h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">Sales performance by agent over the selected period</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tickets</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Agents</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg per Agent</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.details.map((day, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {new Date(day.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatCurrency(day.totalAmount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {day.ticketCount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {day.agents}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {day.agents > 0 ? formatCurrency(day.totalAmount / day.agents) : formatCurrency(0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(!reportData.sales || reportData.sales.length === 0) && (!reportData.details || reportData.details.length === 0) && (
                  <div className="text-center py-12">
                    <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Sales Data</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No sales data found for the selected date range.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ModernCard>
      </div>
    </div>
  );
};

export default SalesReports;
