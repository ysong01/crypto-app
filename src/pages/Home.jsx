// frontend/src/pages/Home.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const cryptocurrencies = [
  { name: 'Bitcoin', code: 'bitcoin', logo: 'bitcoin.png' },
  { name: 'Bitcoin Cash', code: 'bitcoin-cash', logo: 'bitcoin-cash.png' },
  { name: 'Ethereum', code: 'ethereum', logo: 'ethereum.png' },
  { name: 'Litecoin', code: 'litecoin', logo: 'litecoin.png' },
  { name: 'Dogecoin', code: 'dogecoin', logo: 'dogecoin.png' },
  { name: 'Dash', code: 'dash', logo: 'dash.png' },
];

function Home() {
  return (
    <div className="container">
      <h2>Select a Cryptocurrency</h2>
      <div className="card-grid">
        {cryptocurrencies.map((crypto) => (
          <Link key={crypto.code} to={`/crypto/${crypto.code}`}>
            <div className="card">
              <img src={`/images/${crypto.logo}`} alt={crypto.name} width="50" />
              <h3>{crypto.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Home;
