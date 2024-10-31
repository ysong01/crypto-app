// src/pages/Home.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import cryptocurrencies from '../cryptocurrencies';

function Home() {
  return (
    <div className="container">
      <h2>Select a Cryptocurrency</h2>

      <div className="card-grid">
        {cryptocurrencies.map((crypto) => (
          <Link key={crypto.code} to={`/crypto/${crypto.code}`}>
            <div className="card">
              <img
                src={`${process.env.PUBLIC_URL}/images/${crypto.logo}`}
                alt={crypto.name}
                width="50"
              />
              <h3>{crypto.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;
