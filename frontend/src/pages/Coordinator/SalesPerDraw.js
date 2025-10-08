import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { getCurrentDatePH } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDrawTime, getDrawTimeLabel } from '../../utils/drawTimeFormatter';
import { 
  ClockIcon, 
  CalendarDaysIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentChartBarIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';
import ModernTable from '../../components/UI/ModernTable';

const SalesPerDraw = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getCurrentDatePH());
  const [dailyStats, setDailyStats] = useState({
    today: { sales: 0, tickets: 0 },
    thisWeek: { sales: 0, tickets: 0 },
    thisMonth: { sales: 0, tickets: 0 }
  });

  useEffect(() => {
    fetchSalesData();
    fetchDailyStats();
  }, [selectedDate]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      // If user is an agent, include agentId in the request
      const params = { date: selectedDate };
      if (user?.role === 'agent') {
        params.agentId = user.id;
      }
      const response = await api.get('/sales/per-draw', { params });
      setSalesData(response.data?.data?.draws || []);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast.error('Failed to fetch sales data');
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStats = async () => {
    try {
      // Anchor ranges to the selectedDate instead of the current date
      const base = new Date(selectedDate);
      const selectedISO = base.toISOString().split('T')[0];

      // Week range (Mon-Sun) anchored to selectedDate
      const weekStart = new Date(base);
      const day = weekStart.getDay();
      const diffToMonday = (day + 6) % 7;
      weekStart.setDate(weekStart.getDate() - diffToMonday);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Month range anchored to selectedDate
      const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
      const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0);

      // Helper to sum a draw-time sales summary (2PM/5PM/9PM)
      const sumSummary = (summary) => {
        if (!summary) return { sales: 0, tickets: 0 };
        const times = ['2PM', '5PM', '9PM'];
        const sales = times.reduce((s, t) => s + (summary[t]?.sales || 0), 0);
        const tickets = times.reduce((s, t) => s + (summary[t]?.tickets || 0), 0);
        return { sales, tickets };
      };

      // Selected day via per-draw tickets (keeps in sync with page cards)
      const todayResp = await api.get('/sales/per-draw', { params: { date: selectedISO } });
      const todayDraws = todayResp.data?.data?.draws || [];
      const todaySales = todayDraws.reduce((sum, d) => sum + (d.grossSales || 0), 0);
      const todayTickets = todayDraws.reduce((sum, d) => sum + (d.ticketCount || 0), 0);

      // Week via reports draw-time-sales (range) then sum
      const weekResp = await api.get('/reports/draw-time-sales', {
        params: {
          startDate: weekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0]
        }
      });
      const weekSummary = weekResp.data?.data?.summary;
      const { sales: weekSales, tickets: weekTickets } = sumSummary(weekSummary);

      // Month via reports draw-time-sales (range) then sum
      const monthResp = await api.get('/reports/draw-time-sales', {
        params: {
          startDate: monthStart.toISOString().split('T')[0],
          endDate: monthEnd.toISOString().split('T')[0]
        }
      });
      const monthSummary = monthResp.data?.data?.summary;
      const { sales: monthSales, tickets: monthTickets } = sumSummary(monthSummary);

      setDailyStats({
        today: { sales: todaySales, tickets: todayTickets },
        thisWeek: { sales: weekSales, tickets: weekTickets },
        thisMonth: { sales: monthSales, tickets: monthTickets }
      });
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      // Don't show error toast for stats as it's not critical
    }
  };

  const drawTimes = [
    { time: 'twoPM', label: `${formatDrawTime('twoPM')} Draw Sales` },
    { time: 'fivePM', label: `${formatDrawTime('fivePM')} Draw Sales` },
    { time: 'ninePM', label: `${formatDrawTime('ninePM')} Draw Sales` }
  ];

  const getDrawData = (drawTime) => {
    const data = salesData.find(draw => draw.drawTime === drawTime) || {
      grossSales: 0,
      ticketCount: 0,
      totalWinnings: 0
    };
    
    // Ensure all values are numbers to prevent NaN
    return {
      grossSales: Number(data.grossSales) || 0,
      ticketCount: Number(data.ticketCount) || 0,
      totalWinnings: Number(data.totalWinnings) || 0
    };
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <PageHeader
          title={user?.role === 'agent' ? 'My Sales Dashboard' : 'Sales Dashboard'}
          subtitle={user?.role === 'agent' 
          }
          icon={DocumentChartBarIcon}
        />

        {/* Compact Daily Sales Summary Cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-4">
          <div className="rounded-2xl border bg-white border-gray-100 shadow-medium p-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-100 to-green-200">
                <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-right flex-1 ml-3 min-w-0">
                <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Today's Sales</div>
                <div className="text-base sm:text-lg font-bold text-green-600 whitespace-nowrap">₱{dailyStats.today.sales.toLocaleString()}</div>
                <div className="text-[11px] text-gray-500">{dailyStats.today.tickets} tickets</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white border-gray-100 shadow-medium p-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-right flex-1 ml-3 min-w-0">
                <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">This Week</div>
                <div className="text-base sm:text-lg font-bold text-blue-600 whitespace-nowrap">₱{dailyStats.thisWeek.sales.toLocaleString()}</div>
                <div className="text-[11px] text-gray-500">{dailyStats.thisWeek.tickets} tickets</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white border-gray-100 shadow-medium p-3">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-right flex-1 ml-3 min-w-0">
                <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">This Month</div>
                <div className="text-base sm:text-lg font-bold text-purple-600 whitespace-nowrap">₱{dailyStats.thisMonth.sales.toLocaleString()}</div>
                <div className="text-[11px] text-gray-500">{dailyStats.thisMonth.tickets} tickets</div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <ModernCard className="mb-6">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center">
                <CalendarDaysIcon className="h-6 w-6 mr-3 text-green-600" />
                <div>
                  <h2 className="font-semibold text-gray-900 text-[clamp(16px,3.2vw,20px)]">Sales by Draw</h2>
                  <p className="text-[clamp(12px,2.8vw,14px)] text-gray-600 mt-0.5">Select date to view draw-specific sales</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-2.5 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
        </ModernCard>

        {/* Sales Cards */}
        {salesData.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-4">
            {drawTimes.map((draw) => {
              const drawData = getDrawData(draw.time);
              return (
                <ModernCard key={draw.time} className="hover:shadow-lg transition-shadow duration-200">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center">
                      <ClockIcon className="h-6 w-6 mr-3 text-green-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getDrawTimeLabel(draw.time)} Draw
                        </h3>
                        <p className="text-sm text-gray-600">Sales Performance</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="text-center mb-3 sm:mb-4">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600 overflow-hidden text-ellipsis whitespace-nowrap">
                        ₱{drawData.grossSales.toLocaleString()}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Total Sales</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
                      <div className="bg-blue-50 p-2.5 sm:p-3 rounded-lg min-w-0">
                        <div className="text-base sm:text-lg font-semibold text-blue-600 overflow-hidden text-ellipsis whitespace-nowrap">
                          {drawData.ticketCount}
                        </div>
                        <div className="text-[11px] sm:text-xs text-gray-600">Tickets</div>
                      </div>
                      <div className="bg-red-50 p-2.5 sm:p-3 rounded-lg min-w-0">
                        <div className="text-base sm:text-lg font-semibold text-red-600 overflow-hidden text-ellipsis whitespace-nowrap">
                          ₱{(drawData.totalWinnings || 0).toLocaleString()}
                        </div>
                        <div className="text-[11px] sm:text-xs text-gray-600">Winnings</div>
                      </div>
                    </div>
                  </div>
                </ModernCard>
              );
            })}
          </div>
        ) : (
          <ModernCard className="mb-8">
            <div className="p-12 text-center">
              <TicketIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Data</h3>
              <p className="text-gray-500">No sales found for the selected date.</p>
            </div>
          </ModernCard>
        )}

        {/* Summary Table */}
        {salesData.length > 0 && (
          <ModernCard>
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 mr-3 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Draw Details Summary</h3>
                  <p className="text-sm text-gray-600 mt-1">Comprehensive breakdown by draw time</p>
                </div>
              </div>
            </div>
          
          {/* Mobile Card Layout */}
          <div className="block sm:hidden">
            <div className="divide-y divide-gray-200">
              {drawTimes.map((draw) => {
                const drawData = getDrawData(draw.time);
                const netRevenue = drawData.grossSales - drawData.totalWinnings;
                return (
                  <div key={draw.time} className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">{getDrawTimeLabel(draw.time)} Draw Sales</h4>
                      <span className={`text-sm font-medium ${netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₱{netRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-gray-500">Sales</div>
                        <div className="font-medium">₱{drawData.grossSales.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Tickets</div>
                        <div className="font-medium">{drawData.ticketCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Winnings</div>
                        <div className="font-medium">₱{(drawData.totalWinnings || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Net Revenue</div>
                        <div className={`font-medium ${netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₱{netRevenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Draw Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Winnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drawTimes.map((draw) => {
                  const drawData = getDrawData(draw.time);
                  const netRevenue = drawData.grossSales - drawData.totalWinnings;
                  return (
                    <tr key={draw.time}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getDrawTimeLabel(draw.time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₱{drawData.grossSales.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {drawData.ticketCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₱{(drawData.totalWinnings || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₱{netRevenue.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₱{salesData.reduce((sum, draw) => sum + draw.grossSales, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {salesData.reduce((sum, draw) => sum + draw.ticketCount, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₱{salesData.reduce((sum, draw) => sum + (draw.totalWinnings || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className="text-green-600">
                      ₱{salesData.reduce((sum, draw) => sum + (draw.grossSales - (draw.totalWinnings || 0)), 0).toLocaleString()}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </ModernCard>
        )}
      </div>
    </div>
  );
};

export default SalesPerDraw;
