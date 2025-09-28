import React, { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';
import { getCurrentDatePH } from '../../utils/dateUtils';
import {
  ChartBarIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  TicketIcon,
  UserGroupIcon,
  TrophyIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';
import ModernTable from '../../components/UI/ModernTable';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: getCurrentDatePH(),
    endDate: getCurrentDatePH()
  });
  const [summary, setSummary] = useState({
    totalSales: 0,
    totalTickets: 0,
    totalCommission: 0,
    totalWinnings: 0,
    pendingWinnings: 0,
    approvedWinnings: 0
  });

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const response = await api.get(`/sales?${params}`);
      setSales(response.data.sales || []);
      setSummary(response.data.summary || {
        totalSales: 0,
        totalTickets: 0,
        totalCommission: 0,
        totalWinnings: 0,
        pendingWinnings: 0,
        approvedWinnings: 0
      });
    } catch (err) {
      setError('Failed to fetch sales data');
      console.error('Error fetching sales:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
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
          title="Sales Report"
          subtitle="View sales performance and analytics"
          icon={DocumentChartBarIcon}
        />

        {error && (
          <ModernCard className="mb-6 border-l-4 border-red-500 bg-red-50">
            <div className="p-4">
              <div className="text-red-700 font-medium">{error}</div>
            </div>
          </ModernCard>
        )}

        {/* Date Range Filter */}
        <ModernCard className="mb-8">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <CalendarDaysIcon className="h-6 w-6 mr-3 text-blue-600" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Date Range Filter</h3>
                <p className="text-sm text-gray-600 mt-1">Select date range for sales report</p>
              </div>
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
                  onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
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
                  onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Total Sales"
            value={`₱${summary.totalSales?.toLocaleString() || '0'}`}
            icon={CurrencyDollarIcon}
            color="success"
            trend="Gross Revenue"
          />

          <StatCard
            title="Total Tickets"
            value={summary.totalTickets?.toLocaleString() || '0'}
            icon={TicketIcon}
            color="primary"
            trend="Tickets Sold"
          />

          <StatCard
            title="Total Commission"
            value={`₱${summary.totalCommission?.toLocaleString() || '0'}`}
            icon={UserGroupIcon}
            color="secondary"
            trend="Agent Earnings"
          />

          <StatCard
            title="Total Winnings"
            value={`₱${summary.totalWinnings?.toLocaleString() || '0'}`}
            icon={TrophyIcon}
            color="danger"
            trend={
              (summary.pendingWinnings || summary.approvedWinnings) ? 
              `Pending: ₱${summary.pendingWinnings?.toLocaleString() || '0'} | Paid: ₱${summary.approvedWinnings?.toLocaleString() || '0'}` :
              "Prize Payouts"
            }
          />
        </div>

        {/* Sales Table */}
        <ModernCard>
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-3 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Sales Details</h2>
                <p className="text-sm text-gray-600 mt-1">Detailed sales transactions and performance</p>
              </div>
            </div>
          </div>
          
          {sales.length > 0 ? (
            <ModernTable
              columns={[
                {
                  key: 'agent',
                  label: 'Agent',
                  render: (sale) => (
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {sale.agent?.username || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {sale.agent?.role || 'N/A'}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'date',
                  label: 'Date',
                  render: (sale) => (
                    <span className="text-sm text-gray-500">
                      {new Date(sale.date).toLocaleDateString()}
                    </span>
                  )
                },
                {
                  key: 'ticketCount',
                  label: 'Tickets Sold',
                  render: (sale) => (
                    <span className="text-sm font-medium text-gray-900">
                      {sale.ticketCount}
                    </span>
                  )
                },
                {
                  key: 'totalAmount',
                  label: 'Total Amount',
                  render: (sale) => (
                    <span className="text-sm font-medium text-green-600">
                      ₱{sale.totalAmount?.toLocaleString()}
                    </span>
                  )
                },
                {
                  key: 'commission',
                  label: 'Commission',
                  render: (sale) => (
                    <span className="text-sm font-medium text-blue-600">
                      ₱{sale.commission?.toLocaleString()}
                    </span>
                  )
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (sale) => (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sale.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {sale.status}
                    </span>
                  )
                }
              ]}
              data={sales}
            />
          ) : (
            <div className="p-12 text-center">
              <ChartBarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Data</h3>
              <p className="text-gray-500">No sales data found for the selected date range.</p>
            </div>
          )}
        </ModernCard>
      </div>
    </div>
  );
};

export default Sales;

