import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportsAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { 
  DocumentArrowDownIcon, 
  ChartBarIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

const SalesReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [drawTimeData, setDrawTimeData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
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
      // Mock data for draw times - replace with actual API call later
      const mockDrawTimeData = {
        summary: {
          '2PM': { sales: 50000, tickets: 100, winnings: 15000 },
          '5PM': { sales: 75000, tickets: 150, winnings: 20000 },
          '9PM': { sales: 60000, tickets: 120, winnings: 18000 }
        },
        details: [
          {
            name: 'Basak (Area Coordinator)',
            coordinator: 'Areal (Coordinator)',
            agents: [
              { name: 'Agent1', '2PM': 15000, '5PM': 20000, '9PM': 18000, total: 53000 },
              { name: 'Agent2', '2PM': 10000, '5PM': 15000, '9PM': 12000, total: 37000 }
            ]
          },
          {
            name: 'Mactan (Area Coordinator)',
            coordinator: 'Adrianne (Coordinator)',
            agents: [
              { name: 'agent1', '2PM': 12000, '5PM': 18000, '9PM': 15000, total: 45000 },
              { name: 'agent2', '2PM': 8000, '5PM': 12000, '9PM': 10000, total: 30000 },
              { name: 'agent3', '2PM': 5000, '5PM': 10000, '9PM': 5000, total: 20000 }
            ]
          }
        ]
      };
      setDrawTimeData(mockDrawTimeData);
    } catch (error) {
      console.error('Failed to fetch draw time data');
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

  const getChangeIcon = (change) => {
    if (change > 0) return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
    if (change < 0) return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const renderDrawTimesTab = () => (
    <div className="space-y-6">
      {/* Draw Time Summary Cards */}
      {drawTimeData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      )}

      {/* Draw Time Details Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Sales by Draw Time</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  2PM Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  5PM Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  9PM Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sales
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drawTimeData?.details?.map((region, regionIndex) => (
                <React.Fragment key={regionIndex}>
                  <tr className="bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {region.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(region.agents.reduce((sum, agent) => sum + agent['2PM'], 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(region.agents.reduce((sum, agent) => sum + agent['5PM'], 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(region.agents.reduce((sum, agent) => sum + agent['9PM'], 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                      {formatCurrency(region.agents.reduce((sum, agent) => sum + agent.total, 0))}
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 pl-8">
                      {region.coordinator}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(region.agents.reduce((sum, agent) => sum + agent['2PM'], 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(region.agents.reduce((sum, agent) => sum + agent['5PM'], 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(region.agents.reduce((sum, agent) => sum + agent['9PM'], 0))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(region.agents.reduce((sum, agent) => sum + agent.total, 0))}
                    </td>
                  </tr>
                  {region.agents.map((agent, agentIndex) => (
                    <tr key={agentIndex} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 pl-12">
                        {agent.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(agent['2PM'])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(agent['5PM'])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(agent['9PM'])}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(agent.total)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
            <p className="text-gray-600">Hierarchical sales reporting and analytics</p>
          </div>
          <button
            onClick={handleExportExcel}
            disabled={exporting || !reportData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
          >
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChartBarIcon className="h-5 w-5 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('user-sales')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'user-sales'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UsersIcon className="h-5 w-5 inline mr-2" />
              User Sales
            </button>
          </nav>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Report Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Report Type</label>
            <select
              value={filters.reportType}
              onChange={(e) => setFilters(prev => ({ ...prev, reportType: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
              <option value="hierarchy">By Hierarchy</option>
              <option value="agent">By Agent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Group By</label>
            <select
              value={filters.groupBy}
              onChange={(e) => setFilters(prev => ({ ...prev, groupBy: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="date">Date</option>
              <option value="draw">Draw</option>
              <option value="agent">Agent</option>
              <option value="coordinator">Coordinator</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'draw-times' && renderDrawTimesTab()}
      
      {activeTab === 'user-sales' && renderDrawTimesTab()}

      {activeTab === 'overview' && reportData?.summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Gross
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(reportData.summary.totalGross || reportData.summary.totalSales)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm flex items-center">
                {getChangeIcon(reportData.summary.salesChange)}
                <span className={`ml-1 ${getChangeColor(reportData.summary.salesChange)}`}>
                  {Math.abs(reportData.summary.salesChange || 0).toFixed(1)}% vs previous period
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Net
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(reportData.summary.totalNet || (reportData.summary.totalSales || 0) - (reportData.summary.totalWinnings || 0))}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm flex items-center">
                {getChangeIcon(reportData.summary.netChange)}
                <span className={`ml-1 ${getChangeColor(reportData.summary.netChange)}`}>
                  {Math.abs(reportData.summary.netChange || 0).toFixed(1)}% vs previous period
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarDaysIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Monthly Gross
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(reportData.summary.monthlyGross || reportData.summary.totalSales)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm text-gray-600">
                Current month performance
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Monthly Net
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(reportData.summary.monthlyNet || (reportData.summary.totalSales || 0) - (reportData.summary.totalWinnings || 0))}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm text-gray-600">
                Net profit this month
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesReports;
