import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
import { Line } from 'react-chartjs-2';
import './BlockchainMonitor.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE_URL = 'https://stingray-app-prmsm.ondigitalocean.app';
const SUPPORTED_CHAINS = ['bitcoin', 'bitcoin-cash', 'litecoin', 'dogecoin'];

function formatLargeNumber(num) {
  if (!num) return '0';
  
  // Convert to absolute number to handle negative values
  const absNum = Math.abs(num);
  
  // Handle small decimal values (less than 1)
  if (absNum < 1) {
    // Show 8 decimal places for very small numbers
    return num.toFixed(8);
  }
  
  // Handle larger numbers as before
  if (absNum >= 1e12) {
    return (num / 1e12).toFixed(2) + 'T';
  } else if (absNum >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  } else if (absNum >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  } else if (absNum >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }
  
  // For numbers between 1 and 999, show 2 decimal places
  return num.toFixed(2);
}

function getCongestionLevel(mempoolTx) {
  if (mempoolTx > 100000) return 'High';
  if (mempoolTx > 50000) return 'Medium';
  return 'Low';
}

function getCongestionColor(mempoolTx) {
  if (mempoolTx > 100000) return '#ff4444';
  if (mempoolTx > 50000) return '#ffbb33';
  return '#00C851';
}

function formatCryptoAmount(value, chain) {
  // First log the incoming value to debug
  console.log('Raw fee value:', value);
  
  // Ensure we have a valid number to work with
  if (!value || isNaN(Number(value))) return '0';
  
  // Convert string to number if needed
  const rawValue = typeof value === 'string' ? Number(value) : value;
  
  // Convert from base units to crypto units
  let convertedValue;
  switch(chain) {
    case 'bitcoin':
    case 'bitcoin-cash':
    case 'litecoin':
      // Convert from satoshis (1 BTC = 100,000,000 satoshis)
      convertedValue = rawValue / 100000000;
      break;
    case 'ethereum':
      // Convert from wei (1 ETH = 1e18 wei)
      convertedValue = rawValue / 1000000000000000000;
      break;
    case 'dogecoin':
      // Convert from koinu (1 DOGE = 100,000,000 koinu)
      convertedValue = rawValue / 100000000;
      break;
    default:
      convertedValue = rawValue;
  }
  
  // Handle very small numbers with appropriate precision
  if (convertedValue < 0.00000001) {
    return convertedValue.toFixed(12);
  } else if (convertedValue < 0.0000001) {
    return convertedValue.toFixed(10);
  } else if (convertedValue < 0.000001) {
    return convertedValue.toFixed(8);
  } else if (convertedValue < 0.0001) {
    return convertedValue.toFixed(8);
  } else if (convertedValue < 0.01) {
    return convertedValue.toFixed(6);
  } else if (convertedValue < 1) {
    return convertedValue.toFixed(4);
  } else {
    return convertedValue.toFixed(2);
  }
}

function BlockchainMonitor() {
  const [selectedChain, setSelectedChain] = useState('bitcoin');
  const [networkStats, setNetworkStats] = useState({});
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [historicalData, setHistoricalData] = useState({
    hashRates: [],
    timestamps: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [liveTransactions, setLiveTransactions] = useState([]);
  const [lastTransactionTime, setLastTransactionTime] = useState(null);

  // Reset historical data when changing chains
  useEffect(() => {
    setHistoricalData({
      hashRates: [],
      timestamps: []
    });
  }, [selectedChain]);

  useEffect(() => {
    const fetchBlockchainData = async () => {
      try {
        const statsResponse = await axios.get(
          `${API_BASE_URL}/api/blockchain/stats/${selectedChain}`
        );
        
        if (statsResponse.data?.data) {
          setNetworkStats(statsResponse.data.data);
          
          // Only update hashrate historical data
          const newHashRate = statsResponse.data.data.hashrate_24h || 0;
          
          setHistoricalData(prev => ({
            hashRates: [...prev.hashRates, newHashRate].slice(-24),
            timestamps: [...prev.timestamps, new Date().toLocaleTimeString()].slice(-24)
          }));
        }

        const txResponse = await axios.get(
          `${API_BASE_URL}/api/blockchain/transactions/${selectedChain}`
        );
        
        if (txResponse.data?.data) {
          setRecentTransactions(txResponse.data.data);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching blockchain data:', error);
        setIsLoading(false);
      }
    };

    fetchBlockchainData();
    const interval = setInterval(fetchBlockchainData, 30000);
    return () => clearInterval(interval);
  }, [selectedChain]);

  useEffect(() => {
    const fetchLiveTransactions = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/blockchain/live-transactions/${selectedChain}`
        );
        
        if (response.data?.data) {
          const newTransactions = response.data.data;
          
          // Only add transactions newer than our last known transaction
          if (lastTransactionTime) {
            const newTxs = newTransactions.filter(tx => 
              new Date(tx.time) > new Date(lastTransactionTime)
            );
            
            if (newTxs.length > 0) {
              setLiveTransactions(prev => [...newTxs, ...prev].slice(0, 50));
              setLastTransactionTime(newTxs[0].time);
            }
          } else {
            setLiveTransactions(newTransactions);
            setLastTransactionTime(newTransactions[0]?.time);
          }
        }
      } catch (error) {
        console.error('Error fetching live transactions:', error);
      }
    };

    fetchLiveTransactions();
    const interval = setInterval(fetchLiveTransactions, 10000);
    
    return () => clearInterval(interval);
  }, [selectedChain, lastTransactionTime]);

  const chartData = {
    labels: historicalData.timestamps,
    datasets: [
      {
        label: 'Hash Rate',
        data: historicalData.hashRates,
        borderColor: '#4CAF50',
        tension: 0.4,
        fill: false
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#fff'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(0, 0, 0, 0.8)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff'
        }
      },
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#fff'
        }
      }
    }
  };

  return (
    <div className="blockchain-monitor">
      <div className="monitor-header">
        <h1>Blockchain Monitor</h1>
        <select 
          value={selectedChain} 
          onChange={(e) => setSelectedChain(e.target.value)}
          className="chain-selector"
        >
          {SUPPORTED_CHAINS.map(chain => (
            <option key={chain} value={chain}>
              {chain.charAt(0).toUpperCase() + chain.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="loading">Loading blockchain data...</div>
      ) : (
        <div className="monitor-grid">
          <div className="network-stats card">
            <h2>Network Health</h2>
            
            {/* Basic Stats */}
            <div className="stats-grid">
              <div className="stat-item" title="Total number of blocks mined since the blockchain's creation. Each block contains multiple transactions and is added approximately every 10 minutes.">
                <span className="stat-label">Blocks</span>
                <span className="stat-value">
                  {(networkStats?.blocks || 0).toLocaleString()}
                </span>
              </div>
              <div className="stat-item" title="A measure of how hard it is to mine a new block. Higher difficulty means more computing power is needed to mine blocks, ensuring consistent block times despite changes in network hash power.">
                <span className="stat-label">Difficulty</span>
                <span className="stat-value">
                  {formatLargeNumber(networkStats?.difficulty || 0)}
                </span>
              </div>
              <div className="stat-item" title="The total computing power being used to mine blocks. Higher hashrate means better network security. Measured in hashes per second.">
                <span className="stat-label">Hashrate</span>
                <span className="stat-value">
                  {formatLargeNumber(networkStats?.hashrate_24h || 0)}
                </span>
              </div>
            </div>

            {/* Velocity Metrics */}
            <div className="velocity-metrics">
              <h3>Network Velocity</h3>
              <div className="stats-grid velocity">
                <div className="stat-item" title="Average number of transactions processed per hour over the last 24 hours. Indicates short-term network activity.">
                  <span className="stat-label">Hourly Velocity</span>
                  <div className="velocity-value">
                    <span className="stat-value">
                      {(networkStats?.transactions_24h / 24 || 0).toFixed(2)}
                    </span>
                    <span className="velocity-unit">tx/hour</span>
                  </div>
                </div>
                <div className="stat-item" title="Total number of transactions processed in the last 24 hours. Shows overall network usage and activity level.">
                  <span className="stat-label">Daily Velocity</span>
                  <div className="velocity-value">
                    <span className="stat-value">
                      {(networkStats?.transactions_24h || 0).toLocaleString()}
                    </span>
                    <span className="velocity-unit">tx/day</span>
                  </div>
                </div>
                <div className="stat-item" title="Current rate of transactions being processed per second. Indicates real-time network throughput.">
                  <span className="stat-label">Network Load</span>
                  <div className="velocity-value">
                    <span className="stat-value">
                      {(networkStats?.mempool_tps || 0).toFixed(2)}
                    </span>
                    <span className="velocity-unit">tx/second</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Network Trends Chart */}
            <div className="network-trends">
              <h3>Hashrate Trend (24h)</h3>
              <Line data={chartData} options={chartOptions} />
            </div>

            {/* Transaction Stats (Moved from bottom card) */}
            <div className="transaction-stats">
              <h3>Transaction Statistics</h3>
              <div className="stats-grid">
                <div className="stat-item" title="Total number of transactions confirmed in the last 24 hours. Shows the overall transaction volume and network usage.">
                  <span className="stat-label">24h Transactions</span>
                  <div className="stat-value">
                    {formatLargeNumber(networkStats?.transactions_24h || 0)} {selectedChain.toUpperCase()}
                  </div>
                  <span className="stat-count">
                    Count: {networkStats?.transactions_24h?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="stat-item" title="Number of transactions waiting to be confirmed. A larger mempool indicates higher network congestion and potentially higher fees.">
                  <span className="stat-label">Mempool Transactions</span>
                  <div className="stat-value">
                    {formatLargeNumber(networkStats?.mempool_transactions || 0)} {selectedChain.toUpperCase()}
                  </div>
                  <span className="stat-count">
                    Count: {networkStats?.mempool_transactions?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="stat-item" title="Total size of all unconfirmed transactions in bytes. Affects how many transactions can fit in the next block and influences transaction fees.">
                  <span className="stat-label">Mempool Size</span>
                  <div className="stat-value">
                    {formatLargeNumber(networkStats?.mempool_size || 0)} {selectedChain.toUpperCase()}
                  </div>
                  <span className="stat-count">
                    Count: {networkStats?.mempool_size?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="stat-item" title="Average number of transactions the network is processing per second. Indicates network capacity utilization and transaction throughput.">
                  <span className="stat-label">Transaction Rate (TPS)</span>
                  <div className="stat-value">
                    {(networkStats?.mempool_tps || 0).toFixed(2)} {selectedChain.toUpperCase()}
                  </div>
                  <span className="stat-count">
                    Count: {networkStats?.mempool_tps?.toFixed(3) || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="transactions card">
            <h3>Live Transactions</h3>
            <div className="transaction-feed">
              {liveTransactions.length > 0 ? (
                liveTransactions.map((tx, index) => {
                  console.log('Full transaction object:', tx);
                  return (
                    <div key={tx.hash} className="live-tx-item">
                      <div className="tx-header">
                        <span className="tx-hash" title={tx.hash}>
                          {tx.hash}
                        </span>
                        <span className="tx-time">
                          {new Date(tx.time).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="tx-body">
                        <div className="tx-addresses">
                          <span className="tx-from" title={`From: ${tx.sender}`}>
                            From: {tx.sender}
                          </span>
                          <span className="tx-arrow">→</span>
                          <span className="tx-to" title={`To: ${tx.receiver}`}>
                            To: {tx.receiver}
                          </span>
                        </div>
                        <div className="tx-details">
                          <span className="tx-value">
                            Fee: {formatCryptoAmount(tx.fee, selectedChain)} {selectedChain.toUpperCase()}
                          </span>
                          <span className="tx-size">
                            Size: {formatLargeNumber(tx.size)} bytes
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-transactions">
                  No live transactions available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlockchainMonitor; 