import React, { useState, useEffect } from 'react';
import api, { betLimitsAPI, drawsAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const BetLimits = () => {
  const [loading, setLoading] = useState(true);
  const [betLimits, setBetLimits] = useState([]);
  const [editingLimit, setEditingLimit] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [saving, setSaving] = useState(false);
  // Current numbers per draw (new)
  const [currentLoading, setCurrentLoading] = useState(false);
  const [currentRows, setCurrentRows] = useState([]);
  const [currentDrawId, setCurrentDrawId] = useState('');
  const [currentBetType, setCurrentBetType] = useState('');
  const [currentNumber, setCurrentNumber] = useState('');

  useEffect(() => {
    fetchBetLimits();
  }, []);

  // Auto-load current open draw numbers on mount
  useEffect(() => {
    const autoload = async () => {
      try {
        const res = await drawsAPI.getActiveDraws();
        const draws = res.data?.data || res.data; // handle either shape
        if (Array.isArray(draws) && draws.length > 0) {
          setCurrentDrawId(String(draws[0].id));
          // slight delay to ensure state set
          setTimeout(() => { fetchCurrentNumbers(); }, 300);
        }
      } catch (e) {
        // Silent: fallback to manual
      }
    };
    autoload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBetLimits = async () => {
    try {
      const response = await betLimitsAPI.getBetLimits();
      console.log('Bet limits API response:', response.data);
      setBetLimits(response.data.data);
    } catch (error) {
      console.error('Bet limits fetch error:', error);
      toast.error('Failed to fetch bet limits');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentNumbers = async () => {
    try {
      if (!currentDrawId) {
        // Silent no-op when no draw yet
        setCurrentRows([]);
        return;
      }
      setCurrentLoading(true);
      const params = new URLSearchParams();
      params.set('drawId', currentDrawId);
      if (currentBetType) params.set('betType', currentBetType);
      if (currentNumber) params.set('number', currentNumber);
      
      console.log('Fetching current numbers with params:', params.toString());
      const res = await api.get(`/bet-limits/current?${params.toString()}`);
      console.log('Current numbers API response:', res.data);
      
      if (res.data?.success) {
        const data = res.data.data || [];
        console.log('Current numbers data:', data);
        setCurrentRows(data);
        if (data.length === 0) {
          toast('No bets found for this draw. Try a different draw ID or check if there are any tickets created.', {
            icon: 'ℹ️',
            duration: 4000,
          });
        }
      } else {
        toast.error(res.data?.message || 'Failed to load current numbers');
      }
    } catch (e) {
      console.error('Current numbers load error:', e);
      toast.error(`Failed to load current numbers: ${e.response?.data?.message || e.message}`);
    } finally {
      setCurrentLoading(false);
    }
  };

  const handleEditLimit = (limit) => {
    if (!limit || !limit.id) {
      toast.error('Invalid limit data');
      return;
    }
    setEditingLimit(limit.id);
    setEditAmount(limit.maxAmount != null ? limit.maxAmount.toString() : '0');
  };

  const handleSaveLimit = async (limitId) => {
    if (!editAmount || parseFloat(editAmount) < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSaving(true);
    try {
      const limitToUpdate = betLimits.find(l => l.id === limitId);
      if (!limitToUpdate) {
        toast.error('Limit not found');
        return;
      }
      
      console.log('Sending bet limit update:', {
        betType: limitToUpdate.betType,
        maxAmount: parseFloat(editAmount)
      });
      
      await betLimitsAPI.setBetLimit({
        betType: limitToUpdate.betType,
        maxAmount: parseFloat(editAmount)
      });

      toast.success('Bet limit updated successfully');
      setEditingLimit(null);
      setEditAmount('');
      fetchBetLimits();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update bet limit');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingLimit(null);
    setEditAmount('');
  };

  const formatCurrency = (amount) => {
    // Handle null, undefined, or invalid numbers
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || amount == null) {
      return '₱0.00';
    }
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(numericAmount);
  };

  const getBetTypeLabel = (betType) => {
    const labels = {
      'straight': 'Straight',
      'rambol': 'Rambol',
      'three_digit': '3-Digit'
    };
    return labels[betType] || betType.toUpperCase();
  };

  const getUtilizationColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-orange-600 bg-orange-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusIcon = (percentage) => {
    if (percentage >= 100) return <XCircleIcon className="h-5 w-5 text-red-500" />;
    if (percentage >= 90) return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
    return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bet Limits Management</h1>
            <p className="text-gray-600">Configure maximum bet amounts per bet type</p>
          </div>
          <div className="text-sm text-gray-500">
            Total Bet Types: {betLimits.length}
          </div>
        </div>
      </div>

      {/* Bet Limits Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Current Bet Limits</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bet Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {betLimits.map((limit) => {
                const maxAmount = parseFloat(limit.maxAmount) || 0;
                const currentTotal = parseFloat(limit.currentTotal) || 0;
                const utilizationPercentage = maxAmount > 0 ? (currentTotal / maxAmount) * 100 : 0;
                const isEditing = editingLimit === limit.id;
                
                return (
                  <tr key={limit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {getBetTypeLabel(limit.betType)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-32 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter amount"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(maxAmount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(currentTotal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${
                              utilizationPercentage >= 100 ? 'bg-red-500' :
                              utilizationPercentage >= 90 ? 'bg-orange-500' :
                              utilizationPercentage >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getUtilizationColor(utilizationPercentage)}`}>
                          {utilizationPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(utilizationPercentage)}
                        <span className="ml-2 text-sm text-gray-600">
                          {utilizationPercentage >= 100 ? 'Sold Out' :
                           utilizationPercentage >= 90 ? 'Near Limit' : 'Available'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {isEditing ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveLimit(limit.id)}
                            disabled={saving}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditLimit(limit)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Current Numbers (Per Draw) */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-medium text-gray-900">Current Numbers (Per Draw)</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Monitor existing bets and sales for specific bet numbers in a draw</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Draw ID"
              value={currentDrawId}
              onChange={(e)=> setCurrentDrawId(e.target.value)}
              className="w-28 border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-primary-500 focus:border-primary-500"
            />
            <select
              value={currentBetType}
              onChange={(e)=> setCurrentBetType(e.target.value)}
              className="border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Types</option>
              <option value="standard">Standard</option>
              <option value="rambolito">Rambolito</option>
            </select>
            <input
              type="text"
              placeholder="Number (e.g. 123)"
              value={currentNumber}
              onChange={(e)=> setCurrentNumber(e.target.value)}
              className="w-32 border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-primary-500 focus:border-primary-500"
              maxLength={3}
            />
            <button
              onClick={fetchCurrentNumbers}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              {currentLoading ? 'Loading...' : 'Load'}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bet Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-center">
                      <CurrencyDollarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {currentLoading ? 'Loading current numbers...' : 'No Bet Data Found'}
                      </h3>
                      <p className="text-sm text-gray-500 mb-4">
                        {currentLoading 
                          ? 'Please wait while we fetch the bet data...'
                          : currentDrawId 
                            ? 'No bets found for this draw. Try a different draw ID or check if tickets have been created.'
                            : 'Enter a Draw ID and click Load to view existing bets and monitor bet number sales.'
                        }
                      </p>
                      {!currentLoading && !currentDrawId && (
                        <p className="text-xs text-blue-600">
                          💡 Tip: Use the active draw ID from the dashboard or draws page
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentRows.map((row, idx) => {
                  const pct = row.utilization || 0;
                  const status = row.isSoldOut ? 'Sold Out' : (pct >= 90 ? 'Near Limit' : 'Available');
                  return (
                    <tr key={`${row.betType}-${row.betCombination}-${idx}`} className="hover:bg-gray-50">
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{row.betCombination}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{row.betType}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.totalAmount)}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{row.ticketCount}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 90 ? 'bg-orange-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(pct,100).toFixed(0)}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getUtilizationColor(pct)}`}>{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{status}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Available Limits
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {betLimits.filter(limit => {
                      const maxAmount = parseFloat(limit.maxAmount) || 0;
                      const currentTotal = parseFloat(limit.currentTotal) || 0;
                      return maxAmount > 0 && (currentTotal / maxAmount) < 0.9;
                    }).length}
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
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Near Limits
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {betLimits.filter(limit => {
                      const maxAmount = parseFloat(limit.maxAmount) || 0;
                      const currentTotal = parseFloat(limit.currentTotal) || 0;
                      const percentage = maxAmount > 0 ? (currentTotal / maxAmount) * 100 : 0;
                      return percentage >= 90 && percentage < 100;
                    }).length}
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
                <XCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Sold Out
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {betLimits.filter(limit => {
                      const maxAmount = parseFloat(limit.maxAmount) || 0;
                      const currentTotal = parseFloat(limit.currentTotal) || 0;
                      return maxAmount > 0 && (currentTotal / maxAmount) >= 1;
                    }).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Bet Limits Information
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Bet limits control the maximum total amount that can be bet on each bet type</li>
                <li>When a limit reaches 100%, no more bets of that type can be placed</li>
                <li>Limits are reset after each draw settlement</li>
                <li>Only admins and superadmins can modify bet limits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetLimits;
