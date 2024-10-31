// src/pages/CryptoStats.jsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CryptoCard from '../components/CryptoCard';
import axios from 'axios';
import cryptocurrencies from '../cryptocurrencies';
import TradingViewWidget from '../components/TradingViewWidget';
import SentimentAnalysis from '../components/SentimentAnalysis'; // Import the SentimentAnalysis component

function CryptoStats() {
  const { name } = useParams();
  const [stats, setStats] = useState(null);
  const [calculatedMetrics, setCalculatedMetrics] = useState({});
  const [error, setError] = useState(null);

  const crypto = cryptocurrencies.find((c) => c.code === name);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(
          `https://stingray-app-prmsm.ondigitalocean.app/api/${name}`
        );
        setStats(response.data);
        calculateMetrics(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data.');
      }
    };

    const calculateMetrics = (data) => {
      const {
        volume_24h = 0,
        market_cap_usd = 0,
        transactions_24h = 0,
        inflation_usd_24h = 0,
        mempool_transactions = 0,
        largest_transaction_24h = { value_usd: 0 },
        average_transaction_fee_usd_24h = 0,
      } = data;

      const averageTransactionValue =
        transactions_24h !== 0 ? volume_24h / transactions_24h : 0;

      const whaleTransactionProportion =
        volume_24h !== 0
          ? (largest_transaction_24h.value_usd / volume_24h) * 100
          : 0;

      const miningInflationRate =
        market_cap_usd !== 0
          ? (inflation_usd_24h / market_cap_usd) * 100
          : 0;

      const mempoolCongestionRatio =
        transactions_24h !== 0
          ? (mempool_transactions / transactions_24h) * 100
          : 0;

      const tvMarketCapRatio =
        market_cap_usd !== 0 ? (volume_24h / market_cap_usd) * 100 : 0;

      const feeToTransactionValueRatio =
        averageTransactionValue !== 0
          ? (average_transaction_fee_usd_24h / averageTransactionValue) * 100
          : 0;

      setCalculatedMetrics({
        averageTransactionValue,
        whaleTransactionProportion,
        miningInflationRate,
        mempoolCongestionRatio,
        tvMarketCapRatio,
        feeToTransactionValueRatio,
      });
    };

    fetchStats();
  }, [name]);

  if (error) {
    return <div className="container">{error}</div>;
  }

  if (!stats) {
    return <div className="container">Loading...</div>;
  }

  // Map your crypto codes to TradingView symbols
  const tradingViewSymbols = {
    bitcoin: 'BITSTAMP:BTCUSD|1D',
    'bitcoin-cash': 'BITSTAMP:BCHUSD|1D',
    ethereum: 'BITSTAMP:ETHUSD|1D',
    litecoin: 'BITSTAMP:LTCUSD|1D',
    dogecoin: 'BINANCE:DOGEUSDT|1D',
    dash: 'BITTREX:DASHUSD|1D',
    monero: 'KRAKEN:XMRUSD|1D',
    cardano: 'BINANCE:ADAUSDT|1D',
  };

  const symbol = tradingViewSymbols[name];

  return (
    <div className="container">
      <div className="crypto-header">
        {crypto && (
          <img
            src={`${process.env.PUBLIC_URL}/images/${crypto.logo}`}
            alt={crypto.name}
            width="50"
            style={{ marginRight: '10px' }}
          />
        )}
        <h2>{name.replace('-', ' ').toUpperCase()}</h2>
      </div>
      <div className="card-grid">
        <CryptoCard
          title="Blocks"
          value={stats.blocks ? stats.blocks.toLocaleString() : 'N/A'}
        />
        <CryptoCard
          title="Transactions"
          value={
            stats.transactions ? stats.transactions.toLocaleString() : 'N/A'
          }
        />
        <CryptoCard
          title="Transactions (24h)"
          value={
            stats.transactions_24h
              ? stats.transactions_24h.toLocaleString()
              : 'N/A'
          }
        />
        <CryptoCard
          title="Market Price (USD)"
          value={
            stats.market_price_usd
              ? `$${stats.market_price_usd.toLocaleString()}`
              : 'N/A'
          }
        />
        <CryptoCard
          title="Market Cap (USD)"
          value={
            stats.market_cap_usd
              ? `$${stats.market_cap_usd.toLocaleString()}`
              : 'N/A'
          }
        />
        <CryptoCard
          title="Circulation"
          value={
            stats.circulation ? stats.circulation.toLocaleString() : 'N/A'
          }
        />
        <CryptoCard
          title="Volume (24h)"
          value={
            stats.volume_24h
              ? `$${stats.volume_24h.toLocaleString()}`
              : 'N/A'
          }
        />
        <CryptoCard
          title="Mempool Transactions"
          value={
            stats.mempool_transactions
              ? stats.mempool_transactions.toLocaleString()
              : 'N/A'
          }
        />
        <CryptoCard
          title="Inflation (USD, 24h)"
          value={
            stats.inflation_usd_24h
              ? `$${stats.inflation_usd_24h.toLocaleString()}`
              : 'N/A'
          }
        />
        <CryptoCard
          title="Largest Transaction (24h) Value (USD)"
          value={
            stats.largest_transaction_24h?.value_usd
              ? `$${stats.largest_transaction_24h.value_usd.toLocaleString()}`
              : 'N/A'
          }
        />
        {/* Calculated Metrics */}
        <CryptoCard
          title="Average Transaction Value"
          value={
            calculatedMetrics.averageTransactionValue
              ? `$${calculatedMetrics.averageTransactionValue.toLocaleString(
                  undefined,
                  { maximumFractionDigits: 2 }
                )}`
              : 'N/A'
          }
        />
        <CryptoCard
          title="Whale Transaction Proportion"
          value={
            calculatedMetrics.whaleTransactionProportion
              ? `${calculatedMetrics.whaleTransactionProportion.toFixed(2)}%`
              : 'N/A'
          }
        />
        <CryptoCard
          title="Mining Inflation Rate (Daily)"
          value={
            calculatedMetrics.miningInflationRate
              ? `${calculatedMetrics.miningInflationRate.toFixed(2)}%`
              : 'N/A'
          }
        />
        <CryptoCard
          title="Mempool Congestion Ratio"
          value={
            calculatedMetrics.mempoolCongestionRatio
              ? `${calculatedMetrics.mempoolCongestionRatio.toFixed(2)}%`
              : 'N/A'
          }
        />
        <CryptoCard
          title="Fee-to-Transaction Value Ratio"
          value={
            calculatedMetrics.feeToTransactionValueRatio
              ? `${calculatedMetrics.feeToTransactionValueRatio.toFixed(2)}%`
              : 'N/A'
          }
        />
        <CryptoCard
          title="TV/M Cap Ratio"
          value={
            calculatedMetrics.tvMarketCapRatio
              ? `${calculatedMetrics.tvMarketCapRatio.toFixed(2)}%`
              : 'N/A'
          }
        />
      </div>
      {symbol && (
        <div className="chart-container">
          <h3>Price Chart</h3>
          <TradingViewWidget symbol={symbol} />
        </div>
      )}
      {/* Add SentimentAnalysis component */}
      <SentimentAnalysis crypto={name} />
    </div>
  );
}

export default CryptoStats;
