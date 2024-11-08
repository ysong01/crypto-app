// src/pages/Compare.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import cryptocurrencies from '../cryptocurrencies';
import './Compare.css'; // Import CSS specific to Compare page

function Compare() {
  const [selectedCryptos, setSelectedCryptos] = useState([]);
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(false);
  const previousValues = useRef({});
  const tableRef = useRef(null);

  // Handle checkbox change
  const handleCheckboxChange = (event) => {
    const { value, checked } = event.target;
    setSelectedCryptos((prevSelected) => {
      if (checked) {
        return [...prevSelected, value];
      } else {
        return prevSelected.filter((crypto) => crypto !== value);
      }
    });
  };

  // Fetch data when selectedCryptos change
  useEffect(() => {
    const fetchCryptoData = async () => {
      setLoading(true);
      try {
        const data = await Promise.all(
          selectedCryptos.map(async (crypto) => {
            const response = await axios.get(
              `https://stingray-app-prmsm.ondigitalocean.app/api/${crypto}`
            );
            return { name: crypto, data: response.data };
          })
        );
        setCryptoData(data);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedCryptos.length > 0) {
      fetchCryptoData();
    } else {
      setCryptoData([]);
    }
  }, [selectedCryptos]);

  // Check for value changes
  const checkValueChanged = (crypto, metric, value) => {
    const key = `${crypto}-${metric}`;
    const prevValue = previousValues.current[key];
    previousValues.current[key] = value;
    
    return prevValue !== undefined && prevValue !== value ? 'value-changed' : '';
  };

  // Add scroll indicator
  useEffect(() => {
    const table = tableRef.current;
    if (!table) return;

    const checkScroll = () => {
      const isScrollable = table.scrollWidth > table.clientWidth;
      table.classList.toggle('is-scrollable', isScrollable);
    };

    // Check on mount and when data changes
    checkScroll();
    
    // Check on window resize
    window.addEventListener('resize', checkScroll);
    
    return () => window.removeEventListener('resize', checkScroll);
  }, [cryptoData]);

  return (
    <div className="container">
      <h2>Compare Cryptocurrencies</h2>
      <div className="compare-content">
        <div className="crypto-selection">
          <h3>Select Cryptocurrencies to Compare</h3>
          <div className="crypto-options">
            {cryptocurrencies.map((crypto) => (
              <label key={crypto.code} className="checkbox-label">
                <input
                  type="checkbox"
                  value={crypto.code}
                  onChange={handleCheckboxChange}
                />
                <img
                  src={`${process.env.PUBLIC_URL}/images/${crypto.logo}`}
                  alt={crypto.name}
                  width="30"
                />
                {crypto.name}
              </label>
            ))}
          </div>
        </div>
        {loading && <p>Loading data...</p>}
        {cryptoData.length > 0 && (
          <div className="comparison-table" ref={tableRef}>
            <table>
              <thead>
                <tr>
                  <th>Metric</th>
                  {cryptoData.map((crypto) => (
                    <th key={crypto.name}>
                      <img
                        src={`${process.env.PUBLIC_URL}/images/${
                          cryptocurrencies.find((c) => c.code === crypto.name)
                            .logo
                        }`}
                        alt={crypto.name}
                        width="30"
                      />
                      <br />
                      {crypto.name.replace('-', ' ').toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  'market_price_usd',
                  'transactions',
                  'circulation',
                  'market_cap_usd',
                ].map((metric) => (
                  <tr key={metric}>
                    <td>{formatMetricName(metric)}</td>
                    {cryptoData.map((crypto) => (
                      <td key={crypto.name} className={checkValueChanged(crypto.name, metric, crypto.data[metric])}>
                        {crypto.data[metric]
                          ? formatValue(crypto.data[metric], metric)
                          : 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function formatMetricName(metric) {
  switch (metric) {
    case 'market_price_usd':
      return 'Market Price (USD)';
    case 'transactions':
      return 'Transactions';
    case 'circulation':
      return 'Circulation';
    case 'market_cap_usd':
      return 'Market Cap (USD)';
    default:
      return metric;
  }
}

function formatValue(value, metric) {
  if (typeof value === 'number') {
    if (metric.includes('price') || metric.includes('cap')) {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  }
  return value;
}

export default Compare;
