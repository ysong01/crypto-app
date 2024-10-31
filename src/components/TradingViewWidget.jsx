// src/components/TradingViewWidget.jsx

import React, { useEffect, useRef } from 'react';

function TradingViewWidget({ symbol }) {
  const containerRef = useRef();

  useEffect(() => {
    // Clear any existing child elements
    containerRef.current.innerHTML = '';

    // Create the script element
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js';
    script.async = true;

    // Configure the widget settings
    script.innerHTML = JSON.stringify({
      symbols: [[symbol]],
      chartOnly: false,
      width: '100%',
      height: '400',
      locale: 'en',
      colorTheme: 'dark',
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: 'right',
      scaleMode: 'Normal',
      fontFamily: '-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif',
      fontSize: '10',
      noTimeScale: false,
      valuesTracking: '1',
      changeMode: 'price-and-percent',
      chartType: 'area',
      maLineColor: '#2962FF',
      maLineWidth: 1,
      maLength: 9,
      headerFontSize: 'medium',
      lineWidth: 2,
      lineType: 0,
      dateRanges: [
        '1d|1',
        '1m|30',
        '3m|60',
        '12m|1D',
        '60m|1W',
        'all|1M',
      ],
    });

    // Append the script to the container
    containerRef.current.appendChild(script);
  }, [symbol]);

  return (
    <div className="tradingview-widget-container">
      <div ref={containerRef} />
    </div>
  );
}

export default TradingViewWidget;
