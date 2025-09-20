import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import {
  CurrencyDollarIcon,
  CogIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const PrizeConfiguration = () => {
  const [loading, setLoading] = useState(true);
  const [configurations, setConfigurations] = useState([]);
  const [editingConfig, setEditingConfig] = useState(null);
  const [formData, setFormData] = useState({
    betType: '',
    multiplier: 450,
    baseAmount: 10,
    basePrize: 4500,
    description: ''
  });
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorData, setCalculatorData] = useState({
    betType: 'standard',
    betAmount: 10,
    betDigits: '123'
  });
  const [calculationResult, setCalculationResult] = useState(null);

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/prize-configuration');
      setConfigurations(response.data.data);
    } catch (error) {
      console.error('Error fetching configurations:', error);
      toast.error('Failed to fetch prize configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      betType: config.betType,
      multiplier: config.multiplier,
      baseAmount: config.baseAmount,
      basePrize: config.basePrize,
      description: config.description || ''
    });
  };

  const handleSave = async () => {
    try {
      const response = await api.post('/prize-configuration', formData);
      toast.success(response.data.message);
      setEditingConfig(null);
      fetchConfigurations();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save prize configuration');
    }
  };

  const handleCancel = () => {
    setEditingConfig(null);
    setFormData({
      betType: '',
      multiplier: 450,
      baseAmount: 10,
      basePrize: 4500,
      description: ''
    });
  };

  const handleToggleActive = async (betType) => {
    try {
      const response = await api.put(`/prize-configuration/${betType}/toggle`);
      toast.success(response.data.message);
      fetchConfigurations();
    } catch (error) {
      console.error('Error toggling configuration:', error);
      toast.error('Failed to toggle configuration');
    }
  };

  const calculatePrize = async () => {
    try {
      const response = await api.post('/prize-configuration/calculate', calculatorData);
      setCalculationResult(response.data.data);
    } catch (error) {
      console.error('Error calculating prize:', error);
      toast.error('Failed to calculate prize');
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
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <CogIcon className="h-8 w-8 mr-3 text-blue-600" />
          Prize Configuration
        </h1>
        <p className="mt-2 text-gray-600">
          Configure winning prize multipliers for different bet types
        </p>
      </div>

      {/* Prize Calculator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
            Prize Calculator
          </h2>
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showCalculator ? 'Hide' : 'Show'} Calculator
          </button>
        </div>

        {showCalculator && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bet Type
              </label>
              <select
                value={calculatorData.betType}
                onChange={(e) => setCalculatorData({ ...calculatorData, betType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="standard">Standard</option>
                <option value="rambolito">Rambolito</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bet Amount (₱)
              </label>
              <input
                type="number"
                value={calculatorData.betAmount}
                onChange={(e) => setCalculatorData({ ...calculatorData, betAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="0.01"
              />
            </div>

            {calculatorData.betType === 'rambolito' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bet Digits (3 digits)
                </label>
                <input
                  type="text"
                  value={calculatorData.betDigits}
                  onChange={(e) => setCalculatorData({ ...calculatorData, betDigits: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength="3"
                  placeholder="e.g., 123, 556"
                />
              </div>
            )}

            <div className="flex items-end">
              <button
                onClick={calculatePrize}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Calculate Prize
              </button>
            </div>
          </div>
        )}

        {calculationResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Calculation Result</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Bet Type:</span> {calculationResult.betType}
              </div>
              <div>
                <span className="font-medium">Bet Amount:</span> {formatCurrency(calculationResult.betAmount)}
              </div>
              <div>
                <span className="font-medium">Bet Digits:</span> {calculationResult.betDigits}
              </div>
              <div>
                <span className="font-medium">Multiplier:</span> {calculationResult.multiplier}x
              </div>
              <div className="col-span-2">
                <span className="font-medium text-lg text-green-600">
                  Prize Amount: {formatCurrency(calculationResult.prizeAmount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Current Configurations</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {configurations.map((config) => (
            <div key={config.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {config.betType} Betting
                    </h3>
                    <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                      config.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {config.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-600">
                    {config.description}
                  </p>
                  
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Multiplier:</span>
                      <div className="text-lg font-semibold text-blue-600">
                        {config.multiplier}x
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Base Amount:</span>
                      <div className="text-lg font-semibold">
                        {formatCurrency(config.baseAmount)}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Base Prize:</span>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(config.basePrize)}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Created:</span>
                      <div className="text-sm text-gray-600">
                        {new Date(config.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex space-x-2">
                  <button
                    onClick={() => handleEdit(config)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md"
                    title="Edit Configuration"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  
                  <button
                    onClick={() => handleToggleActive(config.betType)}
                    className={`p-2 rounded-md ${
                      config.isActive
                        ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                        : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                    }`}
                    title={config.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {config.isActive ? (
                      <XMarkIcon className="h-5 w-5" />
                    ) : (
                      <CheckIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Edit Form */}
              {editingConfig && editingConfig.id === config.id && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Edit Configuration</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Multiplier
                      </label>
                      <input
                        type="number"
                        value={formData.multiplier}
                        onChange={(e) => setFormData({ ...formData, multiplier: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Amount (₱)
                      </label>
                      <input
                        type="number"
                        value={formData.baseAmount}
                        onChange={(e) => setFormData({ ...formData, baseAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Prize (₱)
                      </label>
                      <input
                        type="number"
                        value={formData.basePrize}
                        onChange={(e) => setFormData({ ...formData, basePrize: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Description of this configuration"
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {configurations.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No prize configurations found.</p>
            <p className="text-sm">Run the initialization script to create default configurations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrizeConfiguration;
