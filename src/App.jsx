// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CryptoStats from './pages/CryptoStats';
import Compare from './pages/Compare';
import Chatbot from './components/Chatbot';
import PortfolioLogin from './components/Portfolio/PortfolioLogin';
import PortfolioManager from './components/Portfolio/PortfolioManager';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/crypto/:name" element={<CryptoStats />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/portfolio" element={<PortfolioLogin />} />
        <Route 
          path="/portfolio/manage" 
          element={
            <ProtectedRoute>
              <PortfolioManager />
            </ProtectedRoute>
          } 
        />
      </Routes>
      <Chatbot />
    </Router>
  );
}

export default App;
