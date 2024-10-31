// src/components/Navbar.jsx

import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <div className="navbar">
      <Link to="/">
        <h1>CryptoStats</h1>
      </Link>
      <div className="nav-links">
        <Link to="/compare">Compare Cryptos</Link>
      </div>
    </div>
  );
}

export default Navbar;
