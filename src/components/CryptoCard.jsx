// frontend/src/components/CryptoCard.jsx

import React from 'react';
import './CryptoCard.css';

function CryptoCard({ title, value }) {
  // Function to determine card type based on title
  const getCardType = (title) => {
    if (title.toLowerCase().includes('price')) return 'price';
    if (title.toLowerCase().includes('volume')) return 'volume';
    if (title.toLowerCase().includes('market')) return 'market';
    if (title.toLowerCase().includes('transaction')) return 'transaction';
    if (title.toLowerCase().includes('ratio')) return 'ratio';
    return 'default';
  };

  // Function to get tooltip text based on title
  const getTooltip = (title) => {
    const tooltips = {
      'Blocks': 'Total number of blocks in the blockchain',
      'Transactions': 'Total number of transactions processed',
      'Transactions (24h)': 'Number of transactions processed in the last 24 hours',
      'Market Price (USD)': 'Current trading price in US Dollars',
      'Market Cap (USD)': 'Total market value of all coins in circulation',
      'Circulation': 'Total number of coins currently in circulation',
      'Volume (24h)': 'Total trading volume in the last 24 hours',
      'Mempool Transactions': 'Number of unconfirmed transactions waiting to be processed',
      'Inflation (USD, 24h)': 'Value of new coins mined in the last 24 hours',
      'Largest Transaction (24h) Value (USD)': 'Value of the largest single transaction in the last 24 hours',
      'Average Transaction Value': 'Mean value of transactions in the last 24 hours',
      'Whale Transaction Proportion': 'Percentage of total volume from the largest single transaction',
      'Mining Inflation Rate (Daily)': 'Daily percentage increase in supply from mining rewards',
      'Mempool Congestion Ratio': 'Ratio of pending to processed transactions as a percentage',
      'Fee-to-Transaction Value Ratio': 'Average transaction fee as a percentage of transaction value',
      'TV/M Cap Ratio': 'Trading volume to market cap ratio as a percentage'
    };
    return tooltips[title] || 'Statistical metric for cryptocurrency analysis';
  };

  const cardType = getCardType(title);

  return (
    <div className={`crypto-card ${cardType}`}>
      <div className="inner-content">
        <div className="metric-header">
          <h3 className="title">{title}</h3>
          <div className="tooltip">{getTooltip(title)}</div>
        </div>
        <div className="value">{value}</div>
      </div>
    </div>
  );
}

export default CryptoCard;
