// src/pages/Home.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import cryptocurrencies from '../cryptocurrencies';
import './Home.css';

function Home() {
  const [cryptoData, setCryptoData] = useState({});
  const [loading, setLoading] = useState(true);
  const [aggregateStats, setAggregateStats] = useState({
    totalPercentageChange: 0,
    totalTransactions24h: 0
  });

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const promises = cryptocurrencies.map(crypto => 
          axios.get(`https://stingray-app-prmsm.ondigitalocean.app/api/${crypto.code.toLowerCase()}`)
        );
        
        const responses = await Promise.all(promises);
        
        const data = responses.reduce((acc, response, index) => {
          const priceChange = response.data.market_price_usd_change_24h_percentage;
          
          // Log each crypto's price change
          console.log(`${cryptocurrencies[index].name}: ${priceChange}%`);
          
          acc[cryptocurrencies[index].code] = {
            price: response.data.market_price_usd,
            transactions: response.data.transactions_24h,
            priceChange: priceChange
          };
          return acc;
        }, {});
        
        setCryptoData(data);

        // Calculate totals only for the listed cryptocurrencies
        const totals = cryptocurrencies.reduce((acc, crypto) => {
          const cryptoData = data[crypto.code];
          return {
            totalPercentageChange: acc.totalPercentageChange + (cryptoData?.priceChange || 0),
            totalTransactions24h: acc.totalTransactions24h + (cryptoData?.transactions || 0)
          };
        }, { totalPercentageChange: 0, totalTransactions24h: 0 });

        // Log the final total
        console.log('Total percentage change:', totals.totalPercentageChange);
        
        setAggregateStats(totals);
      } catch (error) {
        console.error('Error fetching crypto data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container">
      <div className="home-header">
        <div className="title-section">
          <h2>Select a Cryptocurrency</h2>
        </div>
        <div className="aggregate-stats">
          <div className="stat-item">
            <span className="stat-label">Total % Change (24h)</span>
            <span className={`stat-value ${aggregateStats.totalPercentageChange >= 0 ? 'positive' : 'negative'}`}>
              {aggregateStats.totalPercentageChange >= 0 ? '+' : ''}
              {aggregateStats.totalPercentageChange.toFixed(2)}%
            </span>
            <span className="stat-tooltip">Combined percentage change of all listed cryptocurrencies in the last 24 hours</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Transactions (24h)</span>
            <span className="stat-value">
              {aggregateStats.totalTransactions24h.toLocaleString()}
            </span>
            <span className="stat-tooltip">Combined number of transactions across all listed cryptocurrencies in the last 24 hours</span>
          </div>
        </div>
      </div>

      <div className="card-grid">
        {cryptocurrencies.map((crypto) => {
          const liveData = cryptoData[crypto.code] || {};
          
          return (
            <Link key={crypto.code} to={`/crypto/${crypto.code}`}>
              <div className="crypto-card">
                <div className="crypto-header">
                  <img
                    src={`${process.env.PUBLIC_URL}/images/${crypto.logo}`}
                    alt={crypto.name}
                    width="50"
                  />
                  <div className="name-price-change">
                    <h3>{crypto.name}</h3>
                    {!loading && liveData.priceChange !== undefined && (
                      <span className={`price-change ${liveData.priceChange >= 0 ? 'positive' : 'negative'}`}>
                        {liveData.priceChange >= 0 ? '+' : ''}{liveData.priceChange.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="crypto-details">
                  {loading ? (
                    <div className="loading-spinner">Loading...</div>
                  ) : (
                    <>
                      <div className="price-container">
                        <span className="label">Price:</span>
                        <span className="value">
                          ${liveData.price ? Number(liveData.price).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }) : 'N/A'}
                        </span>
                      </div>
                      <div className="transactions-container">
                        <span className="label">24h Transactions:</span>
                        <span className="value">
                          {liveData.transactions ? Number(liveData.transactions).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default Home;
