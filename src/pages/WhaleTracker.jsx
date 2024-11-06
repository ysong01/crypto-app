import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import './WhaleTracker.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = 'https://crypto-whale-backend-m2iev.ondigitalocean.app/api';

const TIMEFRAMES = [
  { label: '24 Hours', value: '1d' },
  { label: '1 Week', value: '1w' },
  { label: '1 Month', value: '1m' },
  { label: '3 Months', value: '3m' },
  { label: '6 Months', value: '6m' }
];

const SUPPORTED_CHAINS = [
  { label: 'Bitcoin', value: 'bitcoin' },
  { label: 'Ethereum', value: 'ethereum' }
];

function WhaleTracker() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d');
  const [selectedChain, setSelectedChain] = useState('bitcoin');
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper functions first
  const getTimeframeLabel = (timeframe) => {
    switch(timeframe) {
      case '1d':
        return 'Time (24-hour)';
      case '1w':
        return 'Day and Time';
      case '1m':
        return 'Date';
      case '3m':
      case '6m':
        return 'Date (MM/DD/YYYY)';
      default:
        return 'Date';
    }
  };

  const formatUSD = (value) => {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      console.error('Invalid value:', value);
      return '$0';
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  };

  const formatAddress = (address) => {
    if (!address || address === 'Unknown') return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Get filtered transactions based on timeframe
  const getFilteredTransactions = useCallback((transactions, timeframe) => {
    const now = new Date();
    let cutoffDate;
    switch(timeframe) {
      case '1d':
        cutoffDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '1w':
        cutoffDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1m':
        cutoffDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        cutoffDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        cutoffDate = new Date(now - 180 * 24 * 60 * 60 * 1000);
        break;
      default:
        cutoffDate = new Date(now - 24 * 60 * 60 * 1000);
    }

    return transactions.filter(tx => new Date(tx.timestamp) >= cutoffDate);
  }, []);

  const formatChartData = useCallback((transactions, timeframe) => {
    const filteredTransactions = getFilteredTransactions(transactions, timeframe);
    const sortedTx = [...filteredTransactions].sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    const formatDate = (date) => {
      const dateObj = new Date(date);
      switch(timeframe) {
        case '1d':
          return dateObj.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
          });
        case '1w':
          return dateObj.toLocaleDateString('en-US', { 
            weekday: 'short',
            hour: '2-digit'
          });
        case '1m':
          return dateObj.toLocaleDateString('en-US', { 
            month: 'short',
            day: 'numeric'
          });
        case '3m':
        case '6m':
          return dateObj.toLocaleDateString('en-US', { 
            month: 'short',
            day: 'numeric'
          });
        default:
          return dateObj.toLocaleDateString();
      }
    };

    return {
      labels: sortedTx.map(tx => formatDate(tx.timestamp)),
      datasets: [{
        label: `Individual Whale Transactions (>${formatUSD(1000000)})`,
        data: sortedTx.map(tx => tx.valueUSD),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    };
  }, [getFilteredTransactions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#fff',
          font: {
            family: 'Poppins'
          }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            const tx = transactions[context.dataIndex];
            return [
              `Value: ${formatUSD(context.raw)}`,
              `From: ${formatAddress(tx.from)}`,
              `To: ${formatAddress(tx.to)}`,
              `Hash: ${formatAddress(tx.transactionHash)}`
            ];
          }
        }
      },
      title: {
        display: true,
        text: 'Individual Whale Transactions Over Time',
        color: '#fff',
        font: {
          family: 'Poppins',
          size: 16
        }
      },
      subtitle: {
        display: true,
        text: 'Each point represents a single transaction over $1,000,000',
        color: '#aaa',
        font: {
          family: 'Poppins',
          size: 12
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff',
          font: {
            family: 'Poppins'
          },
          callback: function(value) {
            return formatUSD(value);
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff',
          font: {
            family: 'Poppins'
          },
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: selectedTimeframe === '1d' ? 12 : 
                        selectedTimeframe === '1w' ? 7 :
                        selectedTimeframe === '1m' ? 15 :
                        selectedTimeframe === '3m' ? 12 :
                        selectedTimeframe === '6m' ? 12 : 12
        }
      }
    }
  };

  // First, let's try a simple health check
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get('https://crypto-whale-backend-m2iev.ondigitalocean.app/health');
        console.log('Health check response:', response.data);
      } catch (err) {
        console.error('Health check failed:', err);
      }
    };
    checkHealth();
  }, []);

  // Then modify our main data fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First, just get transactions by chain
        const txResponse = await axios.get(`${API_BASE_URL}/whales`, {
          params: {
            chain: selectedChain
          }
        });

        // Get stats
        const statsResponse = await axios.get(`${API_BASE_URL}/whales/stats`, {
          params: {
            chain: selectedChain
          }
        });

        console.log('Transaction response:', txResponse.data);
        console.log('Stats response:', statsResponse.data);

        setTransactions(txResponse.data || []);
        setStats(statsResponse.data?.[selectedTimeframe] || null);

      } catch (err) {
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url
        });
        setError(err.response?.data?.error || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTimeframe, selectedChain]);

  // Render function
  const renderChart = () => {
    const filteredTransactions = getFilteredTransactions(transactions, selectedTimeframe);
    const averageValue = filteredTransactions.length > 0
      ? filteredTransactions.reduce((sum, tx) => sum + tx.valueUSD, 0) / filteredTransactions.length
      : 0;

    return (
      <div className="chart-container" style={{ 
        height: '500px',
        marginBottom: '6rem',
        padding: '2rem',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h2 className="section-title" style={{ fontFamily: 'Poppins', marginTop: '2rem' }}>Transaction Overview</h2>
        <p className="chart-subtitle" style={{ fontFamily: 'Poppins' }}>
          Showing {filteredTransactions.length} whale transactions in the selected timeframe
        </p>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Line 
            data={formatChartData(transactions, selectedTimeframe)} 
            options={{
              ...chartOptions,
              maintainAspectRatio: false
            }} 
          />
        </div>
      </div>
    );
  };

  // Add this helper function to generate the correct Blockchair URL
  const getBlockchairUrl = (chain, hash) => {
    return `https://blockchair.com/${chain}/transaction/${hash}`;
  };

  return (
    <div className="whale-tracker-container">
      <h1 className="section-title" style={{ fontFamily: 'Poppins' }}>Whale Transaction Tracker</h1>
      
      <div className="whale-tracker-header">
        <div className="controls">
          <select 
            value={selectedChain}
            onChange={(e) => setSelectedChain(e.target.value)}
            className="chain-selector"
          >
            {SUPPORTED_CHAINS.map(chain => (
              <option key={chain.value} value={chain.value}>
                {chain.label}
              </option>
            ))}
          </select>
          <select 
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="timeframe-selector"
          >
            {TIMEFRAMES.map(timeframe => (
              <option key={timeframe.value} value={timeframe.value}>
                {timeframe.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="tooltip">
              Total number of whale transactions ({'>'}$1M) in the selected {selectedTimeframe} timeframe
            </div>
            <h3>Total Transactions</h3>
            <p>{stats.totalTransactions?.toLocaleString() || '0'}</p>
          </div>
          <div className="stat-card">
            <div className="tooltip">
              Combined value of all whale transactions in USD in selected period
            </div>
            <h3>Total Volume</h3>
            <p>{formatUSD(stats.totalVolumeUSD || 0)}</p>
          </div>
          <div className="stat-card">
            <div className="tooltip">
              Average value per transaction in the selected timeframe
            </div>
            <h3>Average Transaction</h3>
            <p>{formatUSD(stats.averageTransactionUSD || 0)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        renderChart()
      )}

      <h2 className="section-title" style={{ fontFamily: 'Poppins', marginTop: '4rem' }}>Recent Whale Transactions</h2>
      <div className="transactions-table">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Value (USD)</th>
                <th>From</th>
                <th>To</th>
                <th>Transaction Hash</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.transactionHash}>
                  <td>{new Date(tx.timestamp).toLocaleString()}</td>
                  <td className="value-cell">{formatUSD(tx.valueUSD)}</td>
                  <td className="address-cell">{formatAddress(tx.from)}</td>
                  <td className="address-cell">{formatAddress(tx.to)}</td>
                  <td className="hash-cell">
                    <a 
                      href={getBlockchairUrl(selectedChain, tx.transactionHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {formatAddress(tx.transactionHash)}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default WhaleTracker; 