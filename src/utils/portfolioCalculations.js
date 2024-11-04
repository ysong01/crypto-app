export const calculateHHI = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  if (totalValue === 0) return 0;

  const marketShares = holdings.map(holding => (holding.value / totalValue) ** 2);
  return marketShares.reduce((sum, share) => sum + share, 0);
};

export const calculateDiversificationRatio = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  
  const totalValue = holdings.reduce((sum, holding) => sum + holding.value, 0);
  if (totalValue === 0) return 0;

  const weights = holdings.map(holding => holding.value / totalValue);
  const weightedReturns = holdings.map((holding, i) => {
    const returnRate = (holding.currentPriceUSD - holding.purchasePriceUSD) / holding.purchasePriceUSD;
    return weights[i] * returnRate;
  });

  const portfolioReturn = weightedReturns.reduce((sum, ret) => sum + ret, 0);
  const individualReturns = holdings.map(holding => 
    (holding.currentPriceUSD - holding.purchasePriceUSD) / holding.purchasePriceUSD
  );

  const averageReturn = individualReturns.reduce((sum, ret) => sum + ret, 0) / holdings.length;
  
  return portfolioReturn !== 0 ? Math.abs(portfolioReturn / averageReturn) : 0;
};

export const calculateRiskScore = (hhi) => {
  // Risk score based on HHI thresholds
  if (hhi < 0.15) return 0.3; // Low risk
  if (hhi < 0.25) return 0.6; // Moderate risk
  return 0.9; // High risk
};

export const getRiskLevel = (riskScore) => {
  if (riskScore < 0.4) return 'Low';
  if (riskScore < 0.7) return 'Moderate';
  return 'High';
};

export const calculateVolatility = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  
  const returns = holdings.map(holding => 
    (holding.currentPriceUSD - holding.purchasePriceUSD) / holding.purchasePriceUSD
  );
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const squaredDiffs = returns.map(ret => (ret - mean) ** 2);
  return Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / returns.length);
};

export const calculatePriceVariance = (holdings) => {
  if (!holdings || holdings.length === 0) return 0;
  
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  if (totalValue === 0) return 0;

  // Calculate weighted average return
  const weightedReturns = holdings.map(h => {
    const weight = h.value / totalValue;
    const return_ = (h.currentPriceUSD - h.purchasePriceUSD) / h.purchasePriceUSD;
    return weight * return_;
  });
  
  const meanReturn = weightedReturns.reduce((sum, r) => sum + r, 0);
  
  // Calculate weighted variance
  const weightedVariance = holdings.reduce((sum, h) => {
    const weight = h.value / totalValue;
    const return_ = (h.currentPriceUSD - h.purchasePriceUSD) / h.purchasePriceUSD;
    return sum + weight * Math.pow(return_ - meanReturn, 2);
  }, 0);
  
  return weightedVariance;
}; 