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
  ExclamationTriangleIcon,
  CalculatorIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';

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
      // Validate input data
      if (!calculatorData.betType) {
        toast.error('Please select a bet type');
        return;
      }
      if (!calculatorData.betAmount || calculatorData.betAmount <= 0) {
        toast.error('Please enter a valid bet amount');
        return;
      }
      if (calculatorData.betType === 'rambolito' && (!calculatorData.betDigits || calculatorData.betDigits.length !== 3)) {
        toast.error('Please enter 3 digits for rambolito bet');
        return;
      }

      const response = await api.post('/prize-configuration/calculate', calculatorData);
      setCalculationResult(response.data.data);
    } catch (error) {
      console.error('Error calculating prize:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to calculate prize');
      }
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="Prize Configuration"
          subtitle="Configure winning prize multipliers for different bet types"
          icon={CogIcon}
        />

        {/* Prize Calculator */}
        <ModernCard className="mb-8">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CalculatorIcon className="h-6 w-6 mr-3 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Prize Calculator</h2>
                  <p className="text-sm text-gray-600 mt-1">Calculate potential winnings for different bet types</p>
                </div>
              </div>
              <ModernButton
                onClick={() => setShowCalculator(!showCalculator)}
                variant="secondary"
                size="sm"
              >
                {showCalculator ? 'Hide' : 'Show'} Calculator
              </ModernButton>
            </div>
          </div>

          {showCalculator && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bet Type
                  </label>
                  <select
                    value={calculatorData.betType}
                    onChange={(e) => setCalculatorData({ ...calculatorData, betType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                    placeholder="Enter bet amount"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      maxLength="3"
                      placeholder="e.g., 123, 556"
                    />
                  </div>
                )}

                <div className="flex items-end">
                  <ModernButton
                    onClick={calculatePrize}
                    variant="primary"
                    size="md"
                    className="w-full"
                  >
                    <CalculatorIcon className="h-4 w-4 mr-2" />
                    Calculate Prize
                  </ModernButton>
                </div>
              </div>
            </div>
          )}

          {calculationResult && (
            <div className="mx-6 mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-4">
                <TrophyIcon className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-xl font-semibold text-green-800">Calculation Result</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Bet Type</span>
                  <div className="text-lg font-semibold text-gray-900 capitalize">
                    {calculationResult.betType}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Bet Amount</span>
                  <div className="text-lg font-semibold text-blue-600">
                    {formatCurrency(calculationResult.betAmount)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <span className="text-sm font-medium text-gray-600">Multiplier</span>
                  <div className="text-lg font-semibold text-orange-600">
                    {calculationResult.multiplier}x
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border-2 border-green-200">
                  <span className="text-sm font-medium text-gray-600">Prize Amount</span>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(calculationResult.prizeAmount)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </ModernCard>

        {/* Configuration List */}
        <ModernCard>
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <CogIcon className="h-6 w-6 mr-3 text-blue-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Current Configurations</h2>
                <p className="text-sm text-gray-600 mt-1">Manage prize multipliers and settings</p>
              </div>
            </div>
          </div>

        <div className="divide-y divide-gray-200">
          {configurations.map((config) => (
            <div key={config.id} className="p-6">
              <div key={`${config.id}-flex-container`} className="flex items-center justify-between">
                <div key={`${config.id}-flex-content`} className="flex-1">
                  <div key={`${config.id}-header`} className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">
                      {config.betType} Betting
                    </h3>
                    <span key={`${config.id}-status`} className={`ml-3 px-2 py-1 text-xs rounded-full ${
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
                    <div key={`${config.id}-multiplier`}>
                      <span className="font-medium text-gray-700">Multiplier:</span>
                      <div className="text-lg font-semibold text-blue-600">
                        {config.multiplier}x
                      </div>
                    </div>
                    <div key={`${config.id}-base-amount`}>
                      <span className="font-medium text-gray-700">Base Amount:</span>
                      <div className="text-lg font-semibold">
                        {formatCurrency(config.baseAmount)}
                      </div>
                    </div>
                    <div key={`${config.id}-base-prize`}>
                      <span className="font-medium text-gray-700">Base Prize:</span>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(config.basePrize)}
                      </div>
                    </div>
                    <div key={`${config.id}-created`}>
                      <span className="font-medium text-gray-700">Created:</span>
                      <div className="text-sm text-gray-600">
                        {new Date(config.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-6 flex space-x-3">
                  <ModernButton
                    onClick={() => handleEdit(config)}
                    variant="secondary"
                    size="sm"
                    title="Edit Configuration"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </ModernButton>
                  
                  <ModernButton
                    onClick={() => handleToggleActive(config.betType)}
                    variant={config.isActive ? "danger" : "success"}
                    size="sm"
                    title={config.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {config.isActive ? (
                      <>
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Activate
                      </>
                    )}
                  </ModernButton>
                </div>
              </div>

              {/* Edit Form */}
              {editingConfig && editingConfig.id === config.id && (
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Edit Configuration</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div key="edit-multiplier">
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

                    <div key="edit-base-amount">
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

                    <div key="edit-base-prize">
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

                    <div key="edit-description">
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

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <ModernButton
                      onClick={handleSave}
                      variant="primary"
                      size="md"
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Save Changes
                    </ModernButton>
                    <ModernButton
                      onClick={handleCancel}
                      variant="secondary"
                      size="md"
                    >
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Cancel
                    </ModernButton>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

          {configurations.length === 0 && (
            <div className="p-12 text-center">
              <ExclamationTriangleIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Configurations Found</h3>
              <p className="text-gray-500 mb-4">No prize configurations are currently available.</p>
              <p className="text-sm text-gray-400">Run the initialization script to create default configurations.</p>
            </div>
          )}
        </ModernCard>
      </div>
    </div>
  );
};

export default PrizeConfiguration;
