import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

const WinningDashboard = () => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState(null);
  const [agentSummary, setAgentSummary] = useState(null);
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadWinningReports();
  }, []);

  const loadWinningReports = async () => {
    setLoading(true);
    try {
      // Load main summary
      const summaryResponse = await api.get('/winning-reports/summary?' + new URLSearchParams(dateRange));
      if (summaryResponse.data.success) {
        setReportData(summaryResponse.data.report);
      }

      // Load agent summary
      const agentResponse = await api.get('/winning-reports/agent-summary?' + new URLSearchParams(dateRange));
      if (agentResponse.data.success) {
        setAgentSummary(agentResponse.data);
      }

      // Load daily data
      const dailyResponse = await api.get('/winning-reports/daily-summary?days=7');
      if (dailyResponse.data.success) {
        setDailyData(dailyResponse.data);
      }

    } catch (err) {
      setError('Error loading winning reports');
      console.error('Winning reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyDateFilter = () => {
    loadWinningReports();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '18px', color: '#6b7280' }}>Loading winning reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div style={{ fontSize: '18px', color: '#dc2626' }}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1f2937', marginBottom: '10px' }}>
          💰 Winning Reports & Claims Dashboard
        </h1>
        <p style={{ color: '#6b7280' }}>
          Track expected winnings, claimed prizes, and net sales for management oversight
        </p>
      </div>

      {/* Date Range Filter */}
      <div style={{
        backgroundColor: '#f9fafb',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '30px',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ marginBottom: '15px', color: '#374151' }}>📅 Filter by Date Range</h3>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151' }}>
              Start Date:
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#374151' }}>
              End Date:
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <button
            onClick={applyDateFilter}
            style={{
              padding: '8px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Apply Filter
          </button>
        </div>
      </div>

      {/* Main Summary Cards */}
      {reportData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#f0f9ff',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #0ea5e9'
          }}>
            <h3 style={{ color: '#0c4a6e', marginBottom: '10px' }}>💰 Gross Sales</h3>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#0c4a6e' }}>
              {formatCurrency(reportData.summary.grossSales)}
            </div>
            <div style={{ fontSize: '14px', color: '#075985', marginTop: '5px' }}>
              Total tickets: {reportData.summary.totalTickets}
            </div>
          </div>

          <div style={{
            backgroundColor: '#fef3c7',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #f59e0b'
          }}>
            <h3 style={{ color: '#92400e', marginBottom: '10px' }}>🎯 Expected Winnings</h3>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#92400e' }}>
              {formatCurrency(reportData.summary.expectedWinnings)}
            </div>
            <div style={{ fontSize: '14px', color: '#a16207', marginTop: '5px' }}>
              Pending: {formatCurrency(reportData.summary.pendingClaims)}
            </div>
          </div>

          <div style={{
            backgroundColor: '#fecaca',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #ef4444'
          }}>
            <h3 style={{ color: '#991b1b', marginBottom: '10px' }}>🏆 Claimed Winnings</h3>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#991b1b' }}>
              {formatCurrency(reportData.summary.claimedWinnings)}
            </div>
            <div style={{ fontSize: '14px', color: '#b91c1c', marginTop: '5px' }}>
              Claimed tickets: {reportData.summary.claimedTickets}
            </div>
          </div>

          <div style={{
            backgroundColor: '#d1fae5',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #10b981'
          }}>
            <h3 style={{ color: '#065f46', marginBottom: '10px' }}>📈 Net Sales</h3>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#065f46' }}>
              {formatCurrency(reportData.summary.netSales)}
            </div>
            <div style={{ fontSize: '14px', color: '#047857', marginTop: '5px' }}>
              Profit margin: {formatPercentage(reportData.metrics.profitMargin)}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      {reportData && (
        <div style={{
          backgroundColor: '#f8fafc',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#374151' }}>📊 Key Metrics</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#3b82f6' }}>
                {formatPercentage(reportData.metrics.claimRate)}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Claim Rate</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>
                {formatPercentage(reportData.metrics.profitMargin)}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Profit Margin</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>
                {formatPercentage(reportData.metrics.winRate)}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>Win Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Summary Table */}
      {agentSummary && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          marginBottom: '30px',
          overflow: 'hidden'
        }}>
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '20px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ color: '#374151', margin: 0 }}>👥 Agent Performance Summary</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Agent</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Gross Sales</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Claimed Winnings</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Net Sales</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Tickets</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Profit %</th>
                </tr>
              </thead>
              <tbody>
                {agentSummary.agentSummaries.map((agent, index) => (
                  <tr key={agent.agentId} style={{
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                  }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{ fontWeight: '600' }}>{agent.agentName}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {agent.agentId}</div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                      {formatCurrency(agent.grossSales)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', color: '#dc2626' }}>
                      {formatCurrency(agent.claimedWinnings)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                      {formatCurrency(agent.netSales)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                      {agent.totalTickets} / {agent.claimedTickets}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center', 
                      borderBottom: '1px solid #e5e7eb',
                      color: agent.profitMargin >= 0 ? '#10b981' : '#dc2626',
                      fontWeight: '600'
                    }}>
                      {formatPercentage(agent.profitMargin)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#f3f4f6', fontWeight: '700' }}>
                  <td style={{ padding: '12px', borderTop: '2px solid #d1d5db' }}>TOTALS</td>
                  <td style={{ padding: '12px', textAlign: 'right', borderTop: '2px solid #d1d5db' }}>
                    {formatCurrency(agentSummary.totals.grossSales)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', borderTop: '2px solid #d1d5db', color: '#dc2626' }}>
                    {formatCurrency(agentSummary.totals.claimedWinnings)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', borderTop: '2px solid #d1d5db' }}>
                    {formatCurrency(agentSummary.totals.netSales)}
                  </td>
                  <td colSpan="2" style={{ padding: '12px', borderTop: '2px solid #d1d5db' }}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Daily Summary */}
      {dailyData && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '10px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden'
        }}>
          <div style={{
            backgroundColor: '#f9fafb',
            padding: '20px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h3 style={{ color: '#374151', margin: 0 }}>📅 Last 7 Days Summary</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Tickets</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Gross Sales</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>Claims</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Est. Winnings</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>Net Sales</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.dailyData.map((day, index) => (
                  <tr key={day.date} style={{
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                  }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb' }}>
                      {new Date(day.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                      {day.ticketCount}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb' }}>
                      {formatCurrency(day.grossSales)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #e5e7eb' }}>
                      {day.claimedCount}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', color: '#dc2626' }}>
                      {formatCurrency(day.estimatedClaimedWinnings)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #e5e7eb', fontWeight: '600' }}>
                      {formatCurrency(day.netSales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#f0f9ff',
        borderRadius: '10px',
        border: '1px solid #0ea5e9'
      }}>
        <h4 style={{ color: '#0c4a6e', marginBottom: '15px' }}>📋 Understanding the Reports:</h4>
        <ul style={{ color: '#075985', lineHeight: '1.6', paddingLeft: '20px' }}>
          <li><strong>Gross Sales:</strong> Total amount collected from ticket sales</li>
          <li><strong>Expected Winnings:</strong> Calculated winnings based on draw results</li>
          <li><strong>Claimed Winnings:</strong> Actual amount paid out to winners</li>
          <li><strong>Net Sales:</strong> Gross Sales minus Claimed Winnings (your profit)</li>
          <li><strong>Claim Rate:</strong> Percentage of expected winnings that have been claimed</li>
          <li><strong>Profit Margin:</strong> Net Sales as percentage of Gross Sales</li>
        </ul>
      </div>
    </div>
  );
};

export default WinningDashboard;
