import React from 'react';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

function HoldingsList({ holdings, onDeleteHolding }) {
  const calculateChange = (holding) => {
    const change = (holding.currentPriceUSD - holding.purchasePriceUSD) / holding.purchasePriceUSD * 100;
    return change.toFixed(2);
  };

  return (
    <div className="holdings-list">
      <h3>Current Holdings</h3>
      {holdings.map((holding) => {
        const changePercent = calculateChange(holding);
        const isPositive = parseFloat(changePercent) >= 0;

        return (
          <div key={holding._id} className="holding-card">
            <div className="holding-info">
              <h4>{holding.cryptoSymbol}</h4>
              <p>Quantity: {holding.quantity}</p>
            </div>
            <div className="holding-info">
              <p>Purchase Price: ${holding.purchasePriceUSD.toFixed(2)}</p>
              <p>Current Price: ${holding.currentPriceUSD.toFixed(2)}</p>
            </div>
            <div className="holding-info">
              <div className="holding-value">
                Value: ${holding.value.toFixed(2)}
              </div>
              <div className={`holding-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? <FaArrowUp /> : <FaArrowDown />}
                {Math.abs(changePercent)}%
              </div>
            </div>
            <button
              className="delete-holding"
              onClick={() => onDeleteHolding(holding._id)}
            >
              Remove
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default HoldingsList; 