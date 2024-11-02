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
        // Create an array of promises for each cryptocurrency
        const promises = cryptocurrencies.map(crypto => 
          axios.get(`https://stingray-app-prmsm.ondigitalocean.app/api/${crypto.code.toLowerCase()}`)
        );
        
        // Wait for all requests to complete
        const responses = await Promise.all(promises);
        
        // Create an object with the crypto data
        const data = responses.reduce((acc, response, index) => {
          acc[cryptocurrencies[index].code] = {
            price: response.data.market_price_usd,
            transactions: response.data.transactions_24h
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

    // Initial fetch
    fetchCryptoData();

    // Set up polling every 30 seconds
    const interval = setInterval(fetchCryptoData, 30000);

    // Cleanup interval on component unmount
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
                  <h3>{crypto.name}</h3>
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
