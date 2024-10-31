// frontend/src/pages/CryptoStats.jsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CryptoCard from '../components/CryptoCard';
import axios from 'axios';

function CryptoStats() {
  const { name } = useParams();
  const [stats, setStats] = useState(null);
  const [calculatedMetrics, setCalculatedMetrics] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(
          `https://your-backend-url.herokuapp.com/api/${name}`
        );
        setStats(response.data);
        calculateMetrics(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const calculateMetrics = (data) => {
      const {
        volume_24h,
        market_cap_usd,
        transactions_24h,
        inflation_usd_24h,
        mempool_transactions,
        largest_transaction_24h,
      } = data;

      const averageTransactionValue = volume_24h / transactions_24h;
      const whaleTransactionProportion =
        (largest_transaction_24h.value_usd / volume_24h) * 100;
      const miningInflationRate = (inflation_usd_24h / market_cap_usd) * 100;
      const mempoolCongestionRatio = (mempool_transactions / transactions_24h) * 100;
      const tvMarketCapRatio = (volume_24h / market_cap_usd) * 100;

      setCalculatedMetrics({
        averageTransactionValue,
        whaleTransactionProportion,
        miningInflationRate,
        mempoolCongestionRatio,
        tvMarketCapRatio,
      });
    };

    fetchStats();
  }, [name]);

  if (!stats || !calculatedMetrics) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="container">
      <h2>{name.replace('-', ' ').toUpperCase()}</h2>
      <div className="card-grid">
        <CryptoCard title="Blocks" value={stats.blocks} />
        <CryptoCard title="Transactions" value={stats.transactions} />
        <CryptoCard title="Transactions (24h)" value={stats.transactions_24h} />
        <CryptoCard title="Market Price (USD)" value={`$${stats.market_price_usd}`} />
        <CryptoCard title="Market Cap (USD)" value={`$${stats.market_cap_usd}`} />
        <CryptoCard title="Blockchain Size" value={`${stats.size_on_disk}`} />
        <CryptoCard title="Circulation" value={stats.circulation} />
        <CryptoCard title="Volume (24h)" value={`$${stats.volume_24h}`} />
        <CryptoCard title="Mempool Transactions" value={stats.mempool_transactions} />
        <CryptoCard title="Inflation (USD, 24h)" value={`$${stats.inflation_usd_24h}`} />
        <CryptoCard
          title="Largest Transaction (24h) Value (USD)"
          value={`$${stats.largest_transaction_24h.value_usd}`}
        />
        <CryptoCard
          title="Whale Transaction Proportion"
          value={`${calculatedMetrics.whaleTransactionProportion.toFixed(2)}%`}
        />
        <CryptoCard
          title="Mining Inflation Rate (Daily)"
          value={`${calculatedMetrics.miningInflationRate.toFixed(2)}%`}
        />
        <CryptoCard
          title="Mempool Congestion Ratio"
          value={`${calculatedMetrics.mempoolCongestionRatio.toFixed(2)}%`}
        />
        <CryptoCard
          title="Average Transaction Value"
          value={`$${calculatedMetrics.averageTransactionValue.toFixed(2)}`}
        />
        <CryptoCard
          title="TV/M Cap Ratio"
          value={`${calculatedMetrics.tvMarketCapRatio.toFixed(2)}%`}
        />
      </div>
    </div>
  );
}

export default CryptoStats;
