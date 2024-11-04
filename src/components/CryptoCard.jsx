// frontend/src/components/CryptoCard.jsx

import React from 'react';
import './CryptoCard.css';

function CryptoCard({ title, value }) {
  const getTooltipText = (title) => {
    const tooltips = {
      "Blocks": "Total number of blocks in the blockchain since genesis",
      "Transactions": "Total number of transactions processed since the cryptocurrency's inception",
      "Transactions (24h)": "Number of transactions processed in the last 24 hours",
      "Market Price (USD)": "Current market price in US dollars",
      "Market Cap (USD)": "Total market value of the cryptocurrency (Price × Circulating Supply)",
      "Circulation": "Total number of coins currently in circulation",
      "Volume (24h)": "Total trading volume in USD over the last 24 hours",
      "Mempool Transactions": "Number of unconfirmed transactions waiting to be included in blocks",
      "Inflation (USD, 24h)": "Value of new coins mined in the last 24 hours",
      "Largest Transaction (24h) Value (USD)": "Value of the largest single transaction in the last 24 hours",
      "Average Transaction Value": "Mean value of transactions (24h Volume ÷ Number of Transactions)",
      "Whale Transaction Proportion": "Percentage of 24h volume represented by the largest transaction",
      "Mining Inflation Rate (Daily)": "Daily increase in supply as a percentage of total market cap",
      "Mempool Congestion Ratio": "Ratio of pending to processed transactions, indicating network congestion",
      "Fee-to-Transaction Value Ratio": "Average transaction fee as a percentage of transaction value",
      "TV/M Cap Ratio": "Trading Volume to Market Cap ratio, indicating trading activity relative to market size"
    };
    return tooltips[title] || "Statistical metric for cryptocurrency analysis";
  };

  return (
    <div className="crypto-metric-card">
      <div className="metric-header">
        <h4>{title}</h4>
        <div className="tooltip">{getTooltipText(title)}</div>
      </div>
      <p className="value">{value}</p>
    </div>
  );
}

export default CryptoCard;
