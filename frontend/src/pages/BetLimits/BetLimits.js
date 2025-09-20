import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { betLimitsAPI } from '../../utils/api';
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [betLimits, setBetLimits] = useState([]);
  const [editingLimit, setEditingLimit] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBetLimits();
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
