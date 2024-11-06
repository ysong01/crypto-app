// src/components/Navbar.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/portfolioSlice';
import './Navbar.css';

function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.portfolio);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" onClick={handleNavClick}>Crypto Analysis</Link>
      </div>
      <div className="hamburger" onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
        <div className="nav-item">
          <Link to="/" onClick={handleNavClick}>Home</Link>
          <span className="navbar-tooltip">View latest crypto trends and analysis</span>
        </div>
        
        <div className="nav-item">
          <Link to="/compare" onClick={handleNavClick}>Compare</Link>
          <span className="navbar-tooltip">Compare different cryptocurrencies</span>
        </div>
        
        {user ? (
          <>
            <div className="nav-item">
              <Link to="/portfolio/manage" onClick={handleNavClick}>Portfolio</Link>
              <span className="navbar-tooltip">Manage your crypto portfolio</span>
            </div>
          </>
        ) : null}

        <div className="nav-item">
          <Link to="/monitor" onClick={handleNavClick}>Monitor</Link>
          <span className="navbar-tooltip">Real-time blockchain monitoring</span>
        </div>

        <div className="nav-item">
          <Link to="/whales" onClick={handleNavClick}>Whale Tracker</Link>
          <span className="navbar-tooltip">Track large cryptocurrency transactions</span>
        </div>

        {user ? (
          <div className="nav-item">
            <button onClick={handleLogout} className="logout-btn">
              Logout ({user.username})
            </button>
            <span className="navbar-tooltip">Sign out of your account</span>
          </div>
        ) : (
          <div className="nav-item">
            <Link to="/portfolio" onClick={handleNavClick} className="login-btn">Login</Link>
            <span className="navbar-tooltip">Create an account or sign in to analyze your portfolio</span>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;