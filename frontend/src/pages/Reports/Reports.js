import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
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
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
                <h4 className="text-sm sm:text-base font-medium text-green-900">Total Gross</h4>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">
                  ₱{reports.totalGross?.toLocaleString() || reports.totalRevenue?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <h4 className="text-sm sm:text-base font-medium text-blue-900">Total Net</h4>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">
                  ₱{reports.totalNet?.toLocaleString() || ((reports.totalRevenue || 0) - (reports.totalPayouts || 0)).toLocaleString()}
                </p>
              </div>
              <div className="bg-purple-50 p-3 sm:p-4 rounded-lg">
                <h4 className="text-sm sm:text-base font-medium text-purple-900">Monthly Gross</h4>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">
                  ₱{reports.monthlyGross?.toLocaleString() || reports.totalRevenue?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
                <h4 className="text-sm sm:text-base font-medium text-yellow-900">Monthly Net</h4>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">
                  ₱{reports.monthlyNet?.toLocaleString() || ((reports.totalRevenue || 0) - (reports.totalPayouts || 0)).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'agents':
        return (
          <div className="space-y-3 sm:space-y-4">
            {reports.agentPerformance?.map((agent) => (
              <div key={agent.id} className="bg-white p-3 sm:p-4 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-gray-900">{agent.username}</h4>
                    <p className="text-xs sm:text-sm text-gray-500">{agent.role}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-base sm:text-lg font-bold text-gray-900">₱{agent.totalSales?.toLocaleString()}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{agent.ticketCount} tickets</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'tickets':
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Ticket Status Distribution</h4>
                {reports.ticketStatus?.map((status) => (
                  <div key={status.status} className="flex justify-between py-1">
                    <span className="text-xs sm:text-sm capitalize">{status.status}</span>
                    <span className="text-xs sm:text-sm font-medium">{status.count}</span>
                  </div>
                ))}
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
                <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Winning Analysis</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm">Total Winners</span>
                    <span className="text-xs sm:text-sm font-medium">{reports.winners?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm">Total Payouts</span>
                    <span className="text-xs sm:text-sm font-medium">₱{reports.winners?.totalPayout?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'financial':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900">Total Revenue</h4>
                <p className="text-2xl font-bold text-green-600">
                  ₱{reports.revenue?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900">Total Payouts</h4>
                <p className="text-2xl font-bold text-red-600">
                  ₱{reports.payouts?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Net Profit</h4>
                <p className="text-2xl font-bold text-blue-600">
                  ₱{reports.netProfit?.toLocaleString() || '0'}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900">Commission Paid</h4>
                <p className="text-2xl font-bold text-purple-600">
                  ₱{reports.commission?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>
        );
      
      case 'draws':
        return (
          <div className="space-y-4">
            {reports.drawResults?.map((draw) => (
              <div key={draw.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-gray-900">{draw.name}</h4>
                  <span className="text-sm text-gray-500">{new Date(draw.drawDate).toLocaleDateString()}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {draw.winningNumbers?.map((number, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                    >
                      {number}
                    </span>
                  ))}
                </div>
                <div className="text-sm text-gray-600">
                  Prize: ₱{draw.prizeAmount?.toLocaleString()} | 
                  Winners: {draw.winnerCount || 0} | 
                  Total Payout: ₱{draw.totalPayout?.toLocaleString() || '0'}
                </div>
              </div>
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
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1 sm:mt-2">Generate and view detailed reports</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Report Type Selection */}
      <div className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">Select Report Type</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report.id)}
              className={`p-3 sm:p-4 rounded-lg border-2 text-left transition-colors ${
                selectedReport === report.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="text-sm sm:text-base font-medium text-gray-900">{report.name}</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">{report.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-4 sm:mb-6 bg-white p-3 sm:p-4 rounded-lg shadow">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3">Date Range</h3>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 sm:items-end">
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleExportReport}
            className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 text-sm sm:text-base"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg font-medium text-gray-900">
            {reportTypes.find(r => r.id === selectedReport)?.name}
          </h2>
        </div>
        <div className="p-3 sm:p-4 lg:p-6">
          {renderReportContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;

