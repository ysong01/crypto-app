// src/pages/Home.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import cryptocurrencies from '../cryptocurrencies';
import './Home.css';

function Home() {
  const [cryptoData, setCryptoData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const promises = cryptocurrencies.map(crypto => 
          axios.get(`https://stingray-app-prmsm.ondigitalocean.app/api/${crypto.code.toLowerCase()}`)
        );
        
        const responses = await Promise.all(promises);
        
        const data = responses.reduce((acc, response, index) => {
          acc[cryptocurrencies[index].code] = {
            price: response.data.market_price_usd,
            transactions: response.data.transactions_24h,
            priceChange: response.data.market_price_usd_change_24h_percentage
          };
          return acc;
        }, {});
        
        setCryptoData(data);
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
      <h2>Select a Cryptocurrency</h2>

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
