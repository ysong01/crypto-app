import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HoldingsList from './HoldingsList';
import './Portfolio.css';
import cryptoIcons from '../../utils/cryptoIcons';

// Add these utility functions at the top of your file, after the imports
const calculateHHI = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  if (totalValue === 0) return 0;
  const marketShares = holdings.map(holding => (holding.value / totalValue) ** 2);
  return marketShares.reduce((sum, share) => sum + share, 0);
};

const calculateDiversificationRatio = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  if (totalValue === 0) return 0;
  return 1 / (holdings.length * calculateHHI(holdings));
};

const getRiskLevel = (hhi) => {
  if (hhi < 0.15) return 'Low';
  if (hhi < 0.25) return 'Moderate';
  return 'High';
};

// Add these new utility functions alongside your existing ones
const calculateENB = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  if (totalValue === 0) return 0;
  
  const weights = holdings.map(holding => holding.value / totalValue);
  const squaredWeights = weights.map(w => w * w);
  const sumSquaredWeights = squaredWeights.reduce((sum, w) => sum + w, 0);
  
  return 1 / sumSquaredWeights;
};

const calculateGiniCoefficient = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  if (totalValue === 0) return 0;

  const weights = holdings.map(holding => holding.value / totalValue);
  weights.sort((a, b) => a - b);
  
  let sumNumerator = 0;
  for (let i = 0; i < weights.length; i++) {
    sumNumerator += (2 * (i + 1) - weights.length - 1) * weights[i];
  }
  
  return sumNumerator / (weights.length * weights.reduce((sum, w) => sum + w, 0));
};

const calculateSharpeRatio = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  
  // Calculate portfolio return
  const portfolioReturn = holdings.reduce((sum, holding) => {
    const returnRate = (holding.currentPriceUSD - holding.purchasePriceUSD) / holding.purchasePriceUSD;
    const weight = holding.value / holdings.reduce((total, h) => total + h.value, 0);
    return sum + (returnRate * weight);
  }, 0);

  // Assuming risk-free rate of 0.02 (2%)
  const riskFreeRate = 0.02;
  
  // Calculate portfolio volatility (standard deviation of returns)
  const returns = holdings.map(holding => 
    (holding.currentPriceUSD - holding.purchasePriceUSD) / holding.purchasePriceUSD
  );
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);

  // Calculate Sharpe Ratio
  return volatility === 0 ? 0 : (portfolioReturn - riskFreeRate) / volatility;
};

// Add these new utility functions at the top of your file
const calculateWeightedAveragePrice = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;

  let totalValue = 0;
  let totalQuantity = 0;

  holdings.forEach(holding => {
    const price = Number(holding.currentPriceUSD) || 0;
    const qty = Number(holding.quantity) || 0;
    
    totalValue += price * qty;
    totalQuantity += qty;
  });

  return totalQuantity > 0 ? totalValue / totalQuantity : 0;
};

const calculateWeightedPriceVariance = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  
  const weightedAvgPrice = calculateWeightedAveragePrice(holdings);
  const totalPortfolioValue = holdings.reduce((sum, holding) => {
    const price = Number(holding.currentPriceUSD) || 0;
    const qty = Number(holding.quantity) || 0;
    return sum + (price * qty);
  }, 0);

  if (totalPortfolioValue === 0) return 0;

  return holdings.reduce((sum, holding) => {
    const price = Number(holding.currentPriceUSD) || 0;
    const qty = Number(holding.quantity) || 0;
    const holdingValue = price * qty;
    const weight = holdingValue / totalPortfolioValue;
    const priceDiff = price - weightedAvgPrice;
    return sum + (weight * Math.pow(priceDiff, 2));
  }, 0);
};

const calculateCurrentYield = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;

  let totalUnrealizedGainLoss = 0;
  let totalInvestment = 0;

  holdings.forEach(holding => {
    const currentPrice = Number(holding.currentPriceUSD) || 0;
    const purchasePrice = Number(holding.purchasePriceUSD) || 0;
    const qty = Number(holding.quantity) || 0;

    const currentValue = currentPrice * qty;
    const purchaseValue = purchasePrice * qty;
    
    totalUnrealizedGainLoss += (currentValue - purchaseValue);
    totalInvestment += purchaseValue;
  });

  return totalInvestment > 0 ? (totalUnrealizedGainLoss / totalInvestment) * 100 : 0;
};

// Add this helper function at the top of your file
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

function PortfolioManager() {
  const { user, token } = useSelector((state) => state.portfolio);
  const navigate = useNavigate();
  
  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [newHolding, setNewHolding] = useState({
    cryptoSymbol: '',
    quantity: '',
    purchasePriceUSD: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [portfolioMetrics, setPortfolioMetrics] = useState({
    weightedAveragePrice: 0,
    weightedPriceVariance: 0,
    currentYield: 0
  });

  const fetchCryptoPrice = async (symbol) => {
    try {
      const cryptoEndpoint = symbol.toLowerCase();
      let endpoint;
      
      switch(cryptoEndpoint) {
        case 'btc':
          endpoint = 'bitcoin';
          break;
        case 'eth':
          endpoint = 'ethereum';
          break;
        case 'ltc':
          endpoint = 'litecoin';
          break;
        case 'bch':
          endpoint = 'bitcoin-cash';
          break;
        case 'xrp':
          endpoint = 'ripple';
          break;
        case 'ada':
          endpoint = 'cardano';
          break;
        case 'doge':
          endpoint = 'dogecoin';
          break;
        case 'dot':
          endpoint = 'polkadot';
          break;
        case 'sol':
          endpoint = 'solana';
          break;
        case 'matic':
          endpoint = 'polygon';
          break;
        case 'link':
          endpoint = 'chainlink';
          break;
        case 'uni':
          endpoint = 'uniswap';
          break;
        case 'avax':
          endpoint = 'avalanche';
          break;
        case 'atom':
          endpoint = 'cosmos';
          break;
        default:
          throw new Error('Unsupported cryptocurrency');
      }

      const response = await axios.get(`https://api.blockchair.com/${endpoint}/stats`);
      if (response.data && response.data.data) {
        return response.data.data.market_price_usd;
      } else {
        throw new Error('Invalid price data received');
      }
    } catch (error) {
      console.error('Error fetching crypto price:', error);
      throw new Error(`Failed to fetch price for ${symbol}`);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  useEffect(() => {
    if (selectedPortfolio) {
      fetchHoldings(selectedPortfolio._id);
    }
  }, [selectedPortfolio]);

  const fetchPortfolios = async () => {
    try {
      const response = await axios.get('https://hammerhead-app-cpxzd.ondigitalocean.app/api/portfolios', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPortfolios(response.data);
      setLoading(false);
    } catch (error) {
      setError('Failed to fetch portfolios');
      setLoading(false);
    }
  };

  const fetchHoldings = async (portfolioId) => {
    try {
      const response = await axios.get(`https://hammerhead-app-cpxzd.ondigitalocean.app/api/portfolios/${portfolioId}/holdings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHoldings(response.data);
    } catch (error) {
      setError('Failed to fetch holdings');
    }
  };

  const handleAddHolding = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!selectedPortfolio) {
        throw new Error('Please select a portfolio first');
      }

      // Validate inputs
      if (!newHolding.cryptoSymbol || !newHolding.quantity || !newHolding.purchasePriceUSD) {
        throw new Error('All fields are required');
      }

      // Update the valid symbols list
      const validSymbols = [
        'BTC', 'ETH', 'LTC', 'BCH', 'XRP', 'ADA', 
        'DOGE', 'DOT', 'SOL', 'MATIC', 'LINK', 
        'UNI', 'AVAX', 'ATOM'
      ];
      
      if (!validSymbols.includes(newHolding.cryptoSymbol.toUpperCase())) {
        throw new Error(`Unsupported cryptocurrency. Please use one of: ${validSymbols.join(', ')}`);
      }

      // Fetch current price
      const currentPrice = await fetchCryptoPrice(newHolding.cryptoSymbol);
      
      // Calculate value
      const quantity = parseFloat(newHolding.quantity);
      const value = currentPrice * quantity;

      // Create holding
      const response = await axios.post(
        `https://hammerhead-app-cpxzd.ondigitalocean.app/api/portfolios/${selectedPortfolio._id}/holdings`,
        {
          ...newHolding,
          currentPriceUSD: currentPrice,
          value
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      // Immediately update the holdings list
      setHoldings(prevHoldings => [...prevHoldings, response.data]);
      
      // Update the selected portfolio's total value
      const newTotalValue = (selectedPortfolio.totalValue || 0) + value;
      setSelectedPortfolio(prev => ({
        ...prev,
        totalValue: newTotalValue
      }));

      // Update the portfolios list with new total
      setPortfolios(prevPortfolios => 
        prevPortfolios.map(p => 
          p._id === selectedPortfolio._id 
            ? { ...p, totalValue: newTotalValue }
            : p
        )
      );

      // Reset form
      setNewHolding({
        cryptoSymbol: '',
        quantity: '',
        purchasePriceUSD: ''
      });

    } catch (error) {
      setError(error.message || 'Failed to add holding');
    }
  };

  useEffect(() => {
    if (selectedPortfolio) {
      const fetchHoldings = async () => {
        try {
          const response = await axios.get(
            `https://hammerhead-app-cpxzd.ondigitalocean.app/api/portfolios/${selectedPortfolio._id}/holdings`,
            { headers: { Authorization: `Bearer ${token}` }}
          );
          setHoldings(response.data);
        } catch (error) {
          setError('Failed to fetch holdings');
        }
      };
      fetchHoldings();
    }
  }, [selectedPortfolio, token]);

  useEffect(() => {
    const fetchPortfolios = async () => {
      try {
        const response = await axios.get('https://hammerhead-app-cpxzd.ondigitalocean.app/api/portfolios', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPortfolios(response.data);
      } catch (err) {
        setError('Failed to fetch portfolios');
      }
    };

    if (token) {
      fetchPortfolios();
    }
  }, [token]);

  const handleCreatePortfolio = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (!newPortfolioName.trim()) {
        throw new Error('Portfolio name is required');
      }

      const response = await axios.post(
        'https://hammerhead-app-cpxzd.ondigitalocean.app/api/portfolios',
        { name: newPortfolioName },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setPortfolios([...portfolios, response.data]);
      setNewPortfolioName('');
    } catch (error) {
      setError(error.message || 'Failed to create portfolio');
    }
  };

  const calculatePortfolioMetrics = useCallback(() => {
    if (!holdings.length) return;

    // Log the holdings data to verify structure
    console.log('Holdings data:', holdings);

    const weightedAvgPrice = calculateWeightedAveragePrice(holdings);
    const priceVariance = calculateWeightedPriceVariance(holdings);
    const currentYieldValue = calculateCurrentYield(holdings);

    // Log calculated values
    console.log('Calculated metrics:', {
      weightedAvgPrice,
      priceVariance,
      currentYieldValue
    });

    setPortfolioMetrics(prev => ({
      ...prev,
      weightedAveragePrice: weightedAvgPrice,
      weightedPriceVariance: priceVariance,
      currentYield: currentYieldValue
    }));
  }, [holdings]);

  useEffect(() => {
    if (holdings.length > 0) {
      console.log('Full holdings data:', JSON.stringify(holdings, null, 2));
      calculatePortfolioMetrics();
    }
  }, [holdings, calculatePortfolioMetrics]);

  const handlePortfolioSelect = (portfolio) => {
    setSelectedPortfolio(portfolio);
  };

  return (
    <div className="portfolio-manager">
      <div className="portfolio-grid">
        {/* Left Column - Portfolio List */}
        <div className="portfolio-list-section">
          <h2>Your Portfolios</h2>
          {error && <div className="error-message">{error}</div>}
          
          <div className="create-portfolio-form">
            <form onSubmit={handleCreatePortfolio}>
              <input
                type="text"
                placeholder="New Portfolio Name"
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                required
              />
              <button type="submit">Create Portfolio</button>
            </form>
          </div>

          <div className="portfolio-instructions">
            <p>
              <i className="fas fa-info-circle"></i> Quick Start Guide:
            </p>
            <ol>
              <li>Create a portfolio with your desired name</li>
              <li>Click on your portfolio to view/manage it</li>
              <li>Add your crypto holdings using the form</li>
              <li>View detailed analytics and metrics below your holdings</li>
            </ol>
          </div>

          <div className="portfolios-list">
            {portfolios.map((portfolio) => {
              // Get holdings for this specific portfolio
              const portfolioHoldings = holdings.filter(h => h.portfolio === portfolio._id);
              
              console.log('Portfolio:', portfolio.name);
              console.log('Portfolio Holdings:', portfolioHoldings);
              
              // Use the calculateCurrentYield function we already have
              const yieldPercentage = calculateCurrentYield(portfolioHoldings);
              
              console.log('Yield Percentage:', yieldPercentage);

              return (
                <div 
                  key={portfolio._id} 
                  className={`portfolio-item ${selectedPortfolio?._id === portfolio._id ? 'selected' : ''}`}
                  onClick={() => handlePortfolioSelect(portfolio)}
                >
                  <h3>{portfolio.name}</h3>
                  <div className="portfolio-value-info">
                    <p>Total Value: {formatCurrency(portfolio.totalValue || 0)}</p>
                    <span className={`portfolio-change ${yieldPercentage >= 0 ? 'positive' : 'negative'}`}>
                      {yieldPercentage >= 0 ? '+' : ''}{yieldPercentage.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Portfolio Details */}
        {selectedPortfolio && (
          <div className="portfolio-details-section">
            <h2>{selectedPortfolio.name} Details</h2>
            
            {/* Portfolio Metrics */}
            <div className="portfolio-metrics">
              <h3>Portfolio Analysis</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <h4>Total Value</h4>
                  <p>{formatCurrency(selectedPortfolio.totalValue || 0)}</p>
                </div>
                <div className="metric-card">
                  <h4>HHI Score</h4>
                  <p>{calculateHHI(holdings).toFixed(4)}</p>
                  <small>Lower is more diversified</small>
                </div>
                <div className="metric-card">
                  <h4>Effective Number of Bets</h4>
                  <p>{calculateENB(holdings).toFixed(2)}</p>
                  <small>Higher means better diversification</small>
                </div>
                <div className="metric-card">
                  <h4>Gini Coefficient</h4>
                  <p>{calculateGiniCoefficient(holdings).toFixed(4)}</p>
                  <small>0 = equal distribution, 1 = max concentration</small>
                </div>
                <div className="metric-card">
                  <h4>Sharpe Ratio</h4>
                  <p>{calculateSharpeRatio(holdings).toFixed(4)}</p>
                  <small>Higher means better risk-adjusted returns</small>
                </div>
                <div className="metric-card">
                  <h4>Risk Level</h4>
                  <p className={`risk-level ${getRiskLevel(calculateHHI(holdings)).toLowerCase()}`}>
                    {getRiskLevel(calculateHHI(holdings))}
                  </p>
                </div>
                <div className="metric-card">
                  <h4>Weighted Average Price</h4>
                  <p>{formatCurrency(portfolioMetrics.weightedAveragePrice || 0)}</p>
                  <small>Average price weighted by holding value</small>
                </div>
                <div className="metric-card">
                  <h4>Price Variance</h4>
                  <p>{portfolioMetrics.weightedPriceVariance.toFixed(4)}</p>
                  <small>Variance in asset prices across portfolio</small>
                </div>
                <div className="metric-card">
                  <h4>Current Yield</h4>
                  <p className={`yield-value ${portfolioMetrics.currentYield >= 0 ? 'positive' : 'negative'}`}>
                    {portfolioMetrics.currentYield >= 0 ? '+' : ''}{portfolioMetrics.currentYield.toFixed(2)}%
                  </p>
                  <small>Unrealized return on investment</small>
                </div>
              </div>
            </div>

            {/* Add New Holding Form */}
            <div className="add-holding-form">
              <h3>Add New Holding</h3>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleAddHolding}>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Crypto Symbol (e.g., BTC, ETH, SOL)"
                    value={newHolding.cryptoSymbol}
                    onChange={(e) => setNewHolding({
                      ...newHolding,
                      cryptoSymbol: e.target.value.toUpperCase()
                    })}
                    required
                  />
                  <small>
                    Supported: BTC, ETH, LTC, BCH, XRP, ADA, DOGE, DOT, SOL
                  </small>
                </div>
                <div className="form-group">
                  <input
                    type="number"
                    step="any"
                    placeholder="Quantity"
                    value={newHolding.quantity}
                    onChange={(e) => setNewHolding({
                      ...newHolding,
                      quantity: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="form-group">
                  <input
                    type="number"
                    step="any"
                    placeholder="Purchase Price (USD)"
                    value={newHolding.purchasePriceUSD}
                    onChange={(e) => setNewHolding({
                      ...newHolding,
                      purchasePriceUSD: e.target.value
                    })}
                    required
                  />
                </div>
                <button type="submit">Add Holding</button>
              </form>
            </div>

            {/* Holdings List */}
            <div className="holdings-list">
              <h3>Current Holdings</h3>
              {holdings.length === 0 ? (
                <p>No holdings yet. Add your first holding above.</p>
              ) : (
                holdings.map((holding) => (
                  <div key={holding._id} className="holding-card">
                    <div className="holding-info">
                      <div className="crypto-header">
                        <img 
                          src={cryptoIcons[holding.cryptoSymbol]} 
                          alt={holding.cryptoSymbol}
                          className="crypto-icon"
                        />
                        <h4>{holding.cryptoSymbol}</h4>
                      </div>
                      <p>Quantity: {holding.quantity}</p>
                    </div>
                    <div className="holding-info">
                      <p>Purchase Price: {formatCurrency(holding.purchasePriceUSD)}</p>
                      <p>Current Price: {formatCurrency(holding.currentPriceUSD)}</p>
                    </div>
                    <div className="holding-info">
                      <div className="holding-value">
                        Value: {formatCurrency(holding.value)}
                      </div>
                      <div className={`holding-change ${
                        holding.currentPriceUSD > holding.purchasePriceUSD ? 'positive' : 'negative'
                      }`}>
                        {((holding.currentPriceUSD - holding.purchasePriceUSD) / 
                          holding.purchasePriceUSD * 100).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PortfolioManager; 