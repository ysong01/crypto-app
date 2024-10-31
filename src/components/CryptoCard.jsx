// frontend/src/components/CryptoCard.jsx

import React from 'react';

function CryptoCard({ title, value }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}

export default CryptoCard;
