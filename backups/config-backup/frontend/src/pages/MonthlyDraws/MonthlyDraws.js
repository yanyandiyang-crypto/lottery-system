import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import './MonthlyDraws.css';

const MonthlyDraws = () => {
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyStatus, setMonthlyStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  const years = [];
  for (let year = 2024; year <= 2030; year++) {
    years.push(year);
  }

  useEffect(() => {
    checkMonthlyStatus();
  }, [selectedYear, selectedMonth]);

  const checkMonthlyStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await api.get(`/draws/monthly-status/${selectedYear}/${selectedMonth}`);
      if (response.data.success) {
        setMonthlyStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error checking monthly status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const createMonthlyDraws = async () => {
    try {
      setLoading(true);
      const response = await api.post('/draws/create-monthly', {
        year: selectedYear,
        month: selectedMonth
      });

      if (response.data.success) {
        toast.success(response.data.message);
        checkMonthlyStatus(); // Refresh status
      }
    } catch (error) {
      console.error('Error creating monthly draws:', error);
      toast.error(error.response?.data?.message || 'Failed to create monthly draws');
    } finally {
      setLoading(false);
    }
  };

  const createCurrentAndNextMonth = async () => {
    try {
      setLoading(true);
      const response = await api.post('/draws/create-current-and-next-month');

      if (response.data.success) {
        toast.success('Successfully created draws for current and next month');
        checkMonthlyStatus(); // Refresh status
      }
    } catch (error) {
      console.error('Error creating current and next month draws:', error);
      toast.error(error.response?.data?.message || 'Failed to create draws');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (percentage) => {
    if (percentage === 100) return '#10b981'; // green
    if (percentage >= 50) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  return (
    <div className="monthly-draws">
      <div className="page-header">
        <h1>Monthly Draw Management</h1>
        <p>Create and manage lottery draws for entire months</p>
      </div>

      <div className="monthly-draws-container">
        {/* Quick Actions */}
        <div className="quick-actions-card">
          <h2>Quick Actions</h2>
          <div className="quick-actions">
            <button
              onClick={createCurrentAndNextMonth}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Creating...' : 'Create Current & Next Month'}
            </button>
            <p className="help-text">
              Automatically creates draws for the current month and next month
            </p>
          </div>
        </div>

        {/* Manual Month Selection */}
        <div className="manual-creation-card">
          <h2>Create Draws for Specific Month</h2>
          
          <div className="month-selector">
            <div className="form-group">
              <label htmlFor="year">Year:</label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="form-control"
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="month">Month:</label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="form-control"
              >
                {months.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={createMonthlyDraws}
              disabled={loading || statusLoading}
              className="btn btn-secondary"
            >
              {loading ? 'Creating...' : 'Create Monthly Draws'}
            </button>
          </div>

          {/* Monthly Status */}
          {monthlyStatus && (
            <div className="monthly-status">
              <h3>Status for {monthlyStatus.monthName}</h3>
              
              <div className="status-grid">
                <div className="status-item">
                  <span className="label">Days in Month:</span>
                  <span className="value">{monthlyStatus.daysInMonth}</span>
                </div>
                
                <div className="status-item">
                  <span className="label">Expected Draws:</span>
                  <span className="value">{monthlyStatus.expectedDraws}</span>
                </div>
                
                <div className="status-item">
                  <span className="label">Existing Draws:</span>
                  <span className="value">{monthlyStatus.existingDraws}</span>
                </div>
                
                <div className="status-item">
                  <span className="label">Completion:</span>
                  <span 
                    className="value completion"
                    style={{ color: getStatusColor(monthlyStatus.completionPercentage) }}
                  >
                    {monthlyStatus.completionPercentage}%
                  </span>
                </div>
              </div>

              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${monthlyStatus.completionPercentage}%`,
                    backgroundColor: getStatusColor(monthlyStatus.completionPercentage)
                  }}
                ></div>
              </div>

              {monthlyStatus.isComplete && (
                <div className="completion-badge">
                  ✅ All draws created for this month
                </div>
              )}
            </div>
          )}
        </div>

        {/* Information Card */}
        <div className="info-card">
          <h2>How Monthly Draw Creation Works</h2>
          <ul>
            <li>Creates 3 draws per day (2PM, 5PM, 9PM) for the entire month</li>
            <li>Automatically skips days that already have draws</li>
            <li>Sets proper cutoff times (5 minutes before each draw)</li>
            <li>System automatically creates draws for current and next month on the 1st of each month</li>
            <li>Use "Quick Actions" for automatic setup or manual selection for specific months</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MonthlyDraws;
