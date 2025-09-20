import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { drawResultsAPI, drawsAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDrawTime, getDrawTimeLabel } from '../../utils/drawTimeFormatter';
import { 
  TrophyIcon, 
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BellIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const DrawResults = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [draws, setDraws] = useState([]);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [resultInput, setResultInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [winnerNotifications, setWinnerNotifications] = useState([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const fetchDraws = async (date = null) => {
    try {
      const response = await drawsAPI.getDraws({
        status: 'all',
        limit: 20,
        date: date || selectedDate
      });
      setDraws(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch draws');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDraws();
    if (user.role === 'admin' || user.role === 'superadmin') {
      fetchDashboardData();
    }
  }, [user.role]);

  const fetchWinnerNotifications = async (drawId) => {
    try {
      const response = await drawResultsAPI.getWinnerNotifications(drawId);
      setWinnerNotifications(response.data.data);
    } catch (error) {
      console.error('Failed to fetch winner notifications:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await drawResultsAPI.getAdminDashboard({
        days: 7
      });
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const handleInputResult = async (e) => {
    e.preventDefault();
    
    if (!selectedDraw || !resultInput || resultInput.length !== 3) {
      toast.error('Please enter a valid 3-digit result');
      return;
    }

    setSubmitting(true);
    try {
      await drawResultsAPI.inputResult({
        drawId: selectedDraw.id,
        result: resultInput
      });

      toast.success(`Result ${resultInput} submitted successfully for ${selectedDraw.drawTime} draw`);
      
      // Fetch winner notifications for this draw
      await fetchWinnerNotifications(selectedDraw.id);
      
      setShowInputModal(false);
      setResultInput('');
      setSelectedDraw(null);
      fetchDraws();
      if (user.role === 'admin' || user.role === 'superadmin') {
        fetchDashboardData();
      }
      
      // Show winner notifications if any
      if (winnerNotifications.length > 0) {
        setShowWinnerModal(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit result');
    } finally {
      setSubmitting(false);
    }
  };

  // Using utility function for draw time formatting

  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-green-100 text-green-800',
      'closed': 'bg-yellow-100 text-yellow-800',
      'settled': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <ClockIcon className="h-5 w-5 text-green-500" />;
      case 'closed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'settled':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const canInputResult = (draw) => {
    return draw && 
           (user.role === 'admin' || user.role === 'superadmin') && 
           draw.status === 'closed' && 
           !draw.result;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Draw Results Dashboard</h1>
            <p className="text-gray-600">
              {user.role === 'admin' || user.role === 'superadmin' 
                ? 'Input and manage draw results for 2PM, 5PM, 9PM draws' 
                : 'View draw results and winners'
              }
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  fetchDraws(e.target.value);
                }}
                className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <div className="text-sm text-gray-500">
              Total Draws: {draws.length}
            </div>
          </div>
        </div>
      </div>

      {/* Per-Draw Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['twoPM', 'fivePM', 'ninePM'].map((drawTime) => {
          const todayDraw = draws.find(draw => 
            draw.drawTime === drawTime && 
            new Date(draw.drawDate).toDateString() === new Date(selectedDate).toDateString()
          );
          
          const drawTimeLabels = {
            'twoPM': '2PM Draw',
            'fivePM': '5PM Draw', 
            'ninePM': '9PM Draw'
          };

          const getStatusColor = (status) => {
            switch (status) {
              case 'open': return 'bg-green-500';
              case 'closed': return 'bg-yellow-500';
              case 'settled': return 'bg-blue-500';
              default: return 'bg-gray-500';
            }
          };

          const getStatusText = (status) => {
            switch (status) {
              case 'open': return 'Open for Betting';
              case 'closed': return 'Closed - Awaiting Result';
              case 'settled': return 'Completed';
              default: return 'Not Started';
            }
          };

          const getDrawRemarks = (draw) => {
            if (!draw) return 'Draw not yet created';
            
            const now = new Date();
            const drawDate = new Date(draw.drawDate);
            const isToday = drawDate.toDateString() === now.toDateString();
            
            switch (draw.status) {
              case 'open':
                if (isToday) {
                  return 'Betting is currently active';
                } else {
                  return 'Betting window open';
                }
              case 'closed':
                return 'Betting closed - Awaiting official result';
              case 'settled':
                return `Result: ${draw.winningNumber || draw.result} - Winners notified`;
              default:
                return 'Waiting for betting window to open';
            }
          };

          return (
            <div key={drawTime} className="bg-white shadow rounded-lg overflow-hidden">
              {/* Header */}
              <div className={`px-6 py-4 ${getStatusColor(todayDraw?.status)} text-white`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{drawTimeLabels[drawTime]}</h3>
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                    {getStatusText(todayDraw?.status)}
                  </span>
                </div>
                <div className="mt-1 text-sm opacity-90">
                  Draw Time: {getDrawTimeLabel(drawTime)}
                </div>
                <div className="text-sm opacity-90">
                  {getDrawRemarks(todayDraw)}
                </div>
              </div>

              {/* Winning Number */}
              <div className="px-6 py-6 text-center">
                <div className="text-sm text-gray-600 mb-2">Winning Number</div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {todayDraw?.result || todayDraw?.winningNumber || '???'}
                </div>
                <div className="text-sm text-gray-500">
                  {todayDraw?.result || todayDraw?.winningNumber ? 'Result Set' : 'Awaiting Result'}
                </div>
              </div>

              {/* Stats - Only show for admin/superadmin */}
              {(user.role === 'admin' || user.role === 'superadmin') && (
                <div className="px-6 py-4 bg-gray-50 grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {todayDraw?._count?.tickets || 0}
                    </div>
                    <div className="text-sm text-gray-600">Tickets</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ₱{((todayDraw?.totalSales || 0)).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Sales</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {todayDraw?._count?.winningTickets || 0}
                    </div>
                    <div className="text-sm text-gray-600">Winners</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ₱{((todayDraw?.totalPayouts || 0)).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">Payouts</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-6 py-4 space-y-2">
                {(user.role === 'admin' || user.role === 'superadmin') && (
                  <>
                    {todayDraw?.status === 'closed' && !todayDraw?.result && !todayDraw?.winningNumber ? (
                      <button
                        onClick={() => {
                          setSelectedDraw(todayDraw);
                          setShowInputModal(true);
                        }}
                        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center"
                      >
                        <TrophyIcon className="h-4 w-4 mr-2" />
                        Input Result
                      </button>
                    ) : todayDraw?.status === 'settled' && (todayDraw?.result || todayDraw?.winningNumber) ? (
                      <button
                        onClick={() => {
                          setSelectedDraw(todayDraw);
                          fetchWinnerNotifications(todayDraw.id);
                          setShowWinnerModal(true);
                        }}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center justify-center"
                      >
                        <BellIcon className="h-4 w-4 mr-2" />
                        View Winners
                      </button>
                    ) : todayDraw?.status === 'open' ? (
                      <button
                        disabled
                        className="w-full bg-orange-300 text-orange-700 px-4 py-2 rounded-md cursor-not-allowed"
                      >
                        <ClockIcon className="h-4 w-4 mr-2" />
                        Betting Active
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-gray-300 text-gray-500 px-4 py-2 rounded-md cursor-not-allowed"
                      >
                        Not Available
                      </button>
                    )}
                  </>
                )}
                
                <button
                  onClick={() => {
                    setSelectedDraw(todayDraw);
                    // Add view details functionality
                  }}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 flex items-center justify-center"
                >
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  View Details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Draws Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Draws</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Draw
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Winners
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Payout
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(() => {
                // Deduplicate draws by drawDate (day) + drawTime to avoid doubled rows
                const seen = new Set();
                const unique = [];
                for (const d of draws) {
                  const key = `${new Date(d.drawDate).toDateString()}-${d.drawTime}`;
                  if (!seen.has(key)) {
                    seen.add(key);
                    unique.push(d);
                  }
                }
                return unique;
              })().map((draw) => (
                <tr key={draw.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getDrawTimeLabel(draw.drawTime)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(draw.drawDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(draw.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(draw.status)}`}>
                        {draw.status.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(draw.result || draw.winningNumber) ? (
                      <div className="text-lg font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-md inline-block">
                        {draw.result || draw.winningNumber}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Pending</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {draw._count?.winningTickets || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₱{(draw.totalPayout || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {(draw.result || draw.winningNumber) ? (
                        <>
                          <span className="text-green-600 font-medium">Completed</span>
                          {(draw._count?.winningTickets || 0) > 0 && (
                            <button
                              onClick={() => {
                                setSelectedDraw(draw);
                                fetchWinnerNotifications(draw.id);
                                setShowWinnerModal(true);
                              }}
                              className="inline-flex items-center px-2 py-1 border border-blue-300 text-xs leading-4 font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"
                            >
                              <BellIcon className="h-3 w-3 mr-1" />
                              View Winners
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Input Result Modal */}
      {showInputModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Input Draw Result</h3>
                <button
                  onClick={() => setShowInputModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleInputResult} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Draw Information</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <div className="text-sm font-medium">
                      {getDrawTimeLabel(selectedDraw?.drawTime)} - {new Date(selectedDraw?.drawDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: {selectedDraw?.status?.toUpperCase()}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Winning Number (3 digits)
                  </label>
                  <input
                    type="text"
                    maxLength="3"
                    pattern="[0-9]{3}"
                    value={resultInput}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setResultInput(value);
                    }}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 text-center text-2xl font-bold"
                    placeholder="000"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the 3-digit winning number (000-999)
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Important Notice
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Once submitted, this result cannot be changed. Please verify the winning number carefully before submitting.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowInputModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || resultInput.length !== 3}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Result'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Winner Notifications Modal */}
      {showWinnerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Winner Notifications - {getDrawTimeLabel(selectedDraw?.drawTime)} 
                  ({new Date(selectedDraw?.drawDate).toLocaleDateString()})
                </h3>
                <button
                  onClick={() => setShowWinnerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              {winnerNotifications.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <div className="flex">
                      <BellIcon className="h-5 w-5 text-green-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">
                          Winners Found!
                        </h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>{winnerNotifications.length} winning tickets found. Notifications sent to agents and coordinators.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Agent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ticket Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bet Combination
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bet Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Winning Prize
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {winnerNotifications.map((notification, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {notification.agentName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {notification.agentCode}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {notification.ticketNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-lg font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-md">
                                {notification.betCombination}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {notification.betType}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                              ₱{notification.winningPrize.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Notified
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex">
                      <ChartBarIcon className="h-5 w-5 text-blue-400" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          Notification Summary
                        </h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <ul className="list-disc list-inside space-y-1">
                            <li>Agents have been notified about their winning customers</li>
                            <li>Coordinators have been notified about agent wins in their area</li>
                            <li>Winning tickets appear in agent dashboards under "Winning Numbers" tab</li>
                            <li>Payouts will be processed automatically</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Winners</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No winning tickets found for this draw.
                  </p>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowWinnerModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Information Panel */}
      {user.role === 'admin' || user.role === 'superadmin' ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <TrophyIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Result Input Guidelines
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Results can only be input for closed draws</li>
                  <li>Once a result is submitted, it cannot be modified</li>
                  <li>Winners are automatically calculated and notified</li>
                  <li>Payouts are processed immediately after result input</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <TrophyIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-800">
                Draw Results Information
              </h3>
              <div className="mt-2 text-sm text-gray-700">
                <p>
                  Results are published here immediately after each draw. Winners are automatically notified and payouts are processed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawResults;
