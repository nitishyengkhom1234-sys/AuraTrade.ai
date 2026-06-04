'use strict';

'use client';

import { useState, useEffect, useRef } from 'react';

// Helper to calculate market opening timing and status
function getMarketStatus(segment) {
  try {
    if (segment === 'india') {
      const dateInTz = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const day = dateInTz.getDay();
      const hour = dateInTz.getHours();
      const minute = dateInTz.getMinutes();
      
      const isWeekday = day >= 1 && day <= 5;
      const timeInMinutes = hour * 60 + minute;
      const startInMinutes = 9 * 60 + 15; // 09:15 AM
      const endInMinutes = 15 * 60 + 30;  // 03:30 PM
      
      const isOpen = isWeekday && (timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes);
      const timeStr = dateInTz.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
      
      return {
        isOpen,
        timeStr,
        schedule: '09:15 AM - 03:30 PM IST',
        label: 'NSE / BSE India'
      };
    } else {
      const dateInTz = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const day = dateInTz.getDay();
      const hour = dateInTz.getHours();
      const minute = dateInTz.getMinutes();
      
      const isWeekday = day >= 1 && day <= 5;
      const timeInMinutes = hour * 60 + minute;
      const startInMinutes = 9 * 60 + 30; // 09:30 AM
      const endInMinutes = 16 * 60;       // 04:00 PM
      
      const isOpen = isWeekday && (timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes);
      const timeStr = dateInTz.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
      
      return {
        isOpen,
        timeStr,
        schedule: '09:30 AM - 04:00 PM EST',
        label: 'NYSE / NASDAQ US'
      };
    }
  } catch (e) {
    console.error('Error calculating timezone clocks', e);
    return {
      isOpen: false,
      timeStr: '--:--:-- --',
      schedule: 'N/A',
      label: 'Market Clock'
    };
  }
}


// Recommended Tickers for India Phase (NSE/BSE)
const INDIAN_TICKERS = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'SBIN.NS', name: 'SBI' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro' },
  { symbol: 'ITC.NS', name: 'ITC' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Bank' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance' },
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel' },
  { symbol: 'WIPRO.NS', name: 'Wipro' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki' },
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharma' }
];

// Recommended Tickers for International Phase (US Markets)
const INTL_TICKERS = [
  { symbol: 'AAPL', name: 'Apple' },
  { symbol: 'TSLA', name: 'Tesla' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'NVDA', name: 'NVIDIA' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'GOOGL', name: 'Alphabet Google' },
  { symbol: 'META', name: 'Meta Platforms' },
  { symbol: 'NFLX', name: 'Netflix' },
  { symbol: 'AMD', name: 'AMD' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway' },
  { symbol: 'JPM', name: 'JPMorgan Chase' },
  { symbol: 'V', name: 'Visa' },
  { symbol: 'LLY', name: 'Eli Lilly' },
  { symbol: 'DIS', name: 'Disney' },
  { symbol: 'BABA', name: 'Alibaba' },
  { symbol: 'NKE', name: 'Nike' }
];

export default function Home() {
  const [marketSegment, setMarketSegment] = useState('india');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Market timing clocks state
  const [indiaTimeInfo, setIndiaTimeInfo] = useState(null);
  const [intlTimeInfo, setIntlTimeInfo] = useState(null);

  useEffect(() => {
    const updateClocks = () => {
      setIndiaTimeInfo(getMarketStatus('india'));
      setIntlTimeInfo(getMarketStatus('international'));
    };
    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE.NS');
  const [activeTab, setActiveTab] = useState('analyzer');
  const [stockData, setStockData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);

  // Professional advisory horizon selection filter state
  const [advisoryHorizon, setAdvisoryHorizon] = useState('all');


  // Comparison State
  const [compareQuery, setCompareQuery] = useState('');
  const [compareResults, setCompareResults] = useState([]);
  const [showCompareDropdown, setShowCompareDropdown] = useState(false);
  const [compareList, setCompareList] = useState(['RELIANCE.NS', 'TCS.NS']);
  const [compareData, setCompareData] = useState({});
  const [compareLoading, setCompareLoading] = useState(false);

  // Dashboard State (Preloaded Overview)
  const [dashboardData, setDashboardData] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Ref for TradingView Widget
  const tvWidgetRef = useRef(null);
  const [showTvWidget, setShowTvWidget] = useState(false);

  // Debouncing timeout storage
  const searchTimeout = useRef(null);
  const compareTimeout = useRef(null);

  // Scenario Analysis State
  const [scenarioPreset, setScenarioPreset] = useState('base');
  const [scenarioGrowth, setScenarioGrowth] = useState(12);
  const [scenarioPE, setScenarioPE] = useState(25);
  const [scenarioSentiment, setScenarioSentiment] = useState(0); // range: -50 to +50

  // Tickers selection based on segment
  const popularTickers = marketSegment === 'india' ? INDIAN_TICKERS : INTL_TICKERS;

  // Market segment switcher handler
  const handleMarketSegmentChange = (segment) => {
    setMarketSegment(segment);
    if (segment === 'india') {
      setSelectedSymbol('RELIANCE.NS');
      setCompareList(['RELIANCE.NS', 'TCS.NS']);
    } else {
      setSelectedSymbol('AAPL');
      setCompareList(['AAPL', 'TSLA']);
    }
    setShowTvWidget(false);
  };

  // Fetch Core Stock Data when selectedSymbol changes
  useEffect(() => {
    async function fetchStockDetails() {
      setLoading(true);
      setError('');
      setWarning('');
      try {
        const res = await fetch(`/api/stock?symbol=${encodeURIComponent(selectedSymbol)}`);
        const result = await res.json();
        
        if (result.success) {
          setStockData(result.data);
          setIsSimulated(result.isSimulated);
          if (result.isSimulated && result.warning) {
            setWarning(result.warning);
          }
        } else {
          setError(result.error || 'Failed to retrieve stock parameters.');
        }
      } catch (err) {
        setError('Connection error fetching stock analytics. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchStockDetails();
  }, [selectedSymbol]);

  // Sync Scenario Parameters with Stock Data changes
  useEffect(() => {
    if (stockData) {
      const basePE = Math.round(stockData.peRatio || 25);
      setScenarioPE(basePE);
      setScenarioGrowth(12);
      setScenarioSentiment(0);
      setScenarioPreset('base');
    }
  }, [stockData]);

  // Load Dashboard Data when marketSegment changes
  useEffect(() => {
    async function loadDashboard() {
      setDashboardLoading(true);
      const tickers = marketSegment === 'india' ? INDIAN_TICKERS : INTL_TICKERS;
      try {
        const promises = tickers.slice(0, 5).map(async (item) => {
          const res = await fetch(`/api/stock?symbol=${encodeURIComponent(item.symbol)}`);
          const resJson = await res.json();
          return resJson.success ? resJson.data : null;
        });
        const results = await Promise.all(promises);
        setDashboardData(results.filter(Boolean));
      } catch (e) {
        console.error('Failed to load dashboard presets');
      } finally {
        setDashboardLoading(false);
      }
    }
    loadDashboard();
  }, [marketSegment]);

  // Fetch Comparison Data when list changes
  useEffect(() => {
    async function loadComparisonData() {
      setCompareLoading(true);
      const dataMap = {};
      try {
        const promises = compareList.map(async (symbol) => {
          if (compareData[symbol] && !compareData[symbol].isExpired) {
            dataMap[symbol] = compareData[symbol];
            return;
          }
          const res = await fetch(`/api/stock?symbol=${symbol}`);
          const resJson = await res.json();
          if (resJson.success) {
            dataMap[symbol] = resJson.data;
          }
        });
        await Promise.all(promises);
        setCompareData(dataMap);
      } catch (e) {
        console.error('Failed to fetch comparisons');
      } finally {
        setCompareLoading(false);
      }
    }
    loadComparisonData();
  }, [compareList]);

  // Search Autocomplete Handler
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.success) {
          // Prioritize Indian stocks if under Indian segment and vice-versa
          let filtered = data.results;
          if (marketSegment === 'india') {
            filtered = [
              ...data.results.filter(item => item.symbol.endsWith('.NS') || item.symbol.endsWith('.BO')),
              ...data.results.filter(item => !item.symbol.endsWith('.NS') && !item.symbol.endsWith('.BO'))
            ];
          }
          setSearchResults(filtered);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Autocomplete query error:', err);
      }
    }, 300);
  };

  // Compare Search Autocomplete Handler
  const handleCompareSearchChange = (e) => {
    const value = e.target.value;
    setCompareQuery(value);
    
    if (compareTimeout.current) clearTimeout(compareTimeout.current);

    if (value.trim().length < 2) {
      setCompareResults([]);
      setShowCompareDropdown(false);
      return;
    }

    compareTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (data.success) {
          let filtered = data.results;
          if (marketSegment === 'india') {
            filtered = [
              ...data.results.filter(item => item.symbol.endsWith('.NS') || item.symbol.endsWith('.BO')),
              ...data.results.filter(item => !item.symbol.endsWith('.NS') && !item.symbol.endsWith('.BO'))
            ];
          }
          setCompareResults(filtered);
          setShowCompareDropdown(true);
        }
      } catch (err) {
        console.error('Compare autocomplete error:', err);
      }
    }, 300);
  };

  // Select Stock from Autocomplete
  const selectStock = (symbol) => {
    setSelectedSymbol(symbol);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    setShowTvWidget(false);
  };

  // Add stock to Comparison Matrix
  const addToCompare = (symbol) => {
    if (!compareList.includes(symbol)) {
      setCompareList([...compareList, symbol]);
    }
    setCompareQuery('');
    setCompareResults([]);
    setShowCompareDropdown(false);
  };

  // Remove stock from Comparison
  const removeFromCompare = (symbol) => {
    setCompareList(compareList.filter(s => s !== symbol));
  };

  // Apply Predefined Scenario Setting
  const applyScenarioPreset = (preset) => {
    setScenarioPreset(preset);
    const basePE = Math.round(stockData?.peRatio || 25);
    
    if (preset === 'bull') {
      setScenarioGrowth(30);
      setScenarioPE(Math.round(basePE * 1.35));
      setScenarioSentiment(20);
    } else if (preset === 'base') {
      setScenarioGrowth(12);
      setScenarioPE(basePE);
      setScenarioSentiment(0);
    } else if (preset === 'bear') {
      setScenarioGrowth(-8);
      setScenarioPE(Math.round(basePE * 0.7));
      setScenarioSentiment(-20);
    }
  };

  // TradingView Dynamic Embedding
  useEffect(() => {
    if (showTvWidget && tvWidgetRef.current && stockData) {
      // Clear container first
      tvWidgetRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.async = true;
      script.onload = () => {
        if (typeof window !== 'undefined' && window.TradingView) {
          // Format symbol for TradingView: e.g. NSE:RELIANCE or NASDAQ:AAPL
          let tvSymbol = stockData.symbol;
          if (tvSymbol.endsWith('.NS')) {
            tvSymbol = `NSE:${tvSymbol.split('.')[0]}`;
          } else if (tvSymbol.endsWith('.BO')) {
            tvSymbol = `BSE:${tvSymbol.split('.')[0]}`;
          } else {
            tvSymbol = `NASDAQ:${tvSymbol}`;
          }

          new window.TradingView.MediumWidget({
            symbols: [[tvSymbol, tvSymbol]],
            chartOnly: false,
            width: '100%',
            height: 400,
            locale: 'en',
            colorTheme: 'dark',
            gridLineColor: 'rgba(240, 243, 250, 0.05)',
            fontColor: '#787b86',
            isTransparent: true,
            autosize: false,
            showVolume: true,
            scalePosition: 'no',
            scaleMode: 'Normal',
            fontFamily: 'Trebuchet MS, sans-serif',
            noLogoOverlay: true,
            container_id: 'tv-medium-widget'
          });
        }
      };
      document.head.appendChild(script);
    }
  }, [showTvWidget, stockData]);

  // SVG Chart Coordinates Generator
  const generateChartCoordinates = (prices, dates, width = 600, height = 200, padding = 15) => {
    if (!prices || prices.length === 0) return { path: '', areaPath: '', points: [] };
    const minVal = Math.min(...prices);
    const maxVal = Math.max(...prices);
    const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    const points = prices.map((price, i) => {
      const x = padding + (i / (prices.length - 1)) * (width - padding * 2);
      const y = height - padding - ((price - minVal) / range) * (height - padding * 2);
      return { x, y, price, date: dates[i] || '' };
    });

    const path = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaPath = `${path} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return { path, areaPath, points };
  };

  // Helper colors mapping based on actions
  const getActionColorClass = (action) => {
    const act = action.toUpperCase();
    if (act.includes('STRONG BUY') || act.includes('ACCUMULATE')) return 'up';
    if (act.includes('SELL') || act.includes('AVOID') || act.includes('REDUCE')) return 'down';
    return 'hold';
  };

  const getActionBadgeClass = (action) => {
    const act = action.toUpperCase();
    if (act.includes('STRONG BUY') || act.includes('ACCUMULATE')) return 'badge-buy';
    if (act.includes('SELL') || act.includes('AVOID') || act.includes('REDUCE')) return 'badge-sell';
    return 'badge-hold';
  };

  // Formatting large market cap numbers
  const formatMarketCap = (cap) => {
    if (!cap) return 'N/A';
    // Handle currencies (standard representation)
    const prefix = marketSegment === 'india' ? '₹' : '$';
    if (cap >= 1e12) return `${prefix}${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `${prefix}${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `${prefix}${(cap / 1e6).toFixed(2)}M`;
    return prefix + cap.toLocaleString();
  };

  // Derive Buy/Sell recommendations in professional mode from preloaded dashboard stocks
  const getSuggestions = () => {
    if (!dashboardData || dashboardData.length === 0) return null;

    const buys = [];
    const sells = [];

    dashboardData.forEach(stock => {
      if (!stock) return;
      const rsi = stock.indicators?.rsi || 50;
      const volatility = stock.indicators?.volatilityPct || 0;
      const symbol = stock.symbol;
      const companyName = stock.companyName;
      const currentPrice = stock.currentPrice || 0;
      const currency = stock.currency;

      // Extract horizon specific values
      let intraday = stock.horizons?.intraday;
      let medium = stock.horizons?.medium;
      let long = stock.horizons?.long;

      if (advisoryHorizon === 'all' || advisoryHorizon === 'intraday') {
        if (intraday?.action.includes('BUY') || intraday?.score >= 60 || rsi < 35) {
          buys.push({
            symbol,
            companyName,
            price: currentPrice,
            currency,
            score: intraday?.score || 50,
            target: intraday?.target || currentPrice * 1.02,
            stopLoss: intraday?.stopLoss || currentPrice * 0.98,
            rsi,
            volatility,
            triggers: [
              `Intraday Trend: ${intraday?.action || 'BUY'} (${intraday?.score || 50}% match)`,
              rsi < 35 ? `Technical Oversold: RSI is at ${rsi.toFixed(1)}` : `Technical momentum: RSI at ${rsi.toFixed(1)}`,
              intraday?.signals?.[0] || 'Bullish intraday technical chart alignment.'
            ]
          });
        }
        if (intraday?.action.includes('SELL') || intraday?.score <= 45 || rsi > 68) {
          sells.push({
            symbol,
            companyName,
            price: currentPrice,
            currency,
            score: intraday?.score || 50,
            stopLoss: intraday?.stopLoss || currentPrice * 0.98,
            rsi,
            volatility,
            triggers: [
              `Intraday Signal: ${intraday?.action || 'SELL'} (${intraday?.score || 50}% rating)`,
              rsi > 68 ? `Overbought warning: RSI stands at ${rsi.toFixed(1)}` : `Weak intraday technical setup.`,
              intraday?.signals?.[1] || 'Technical momentum indicates distribution.'
            ]
          });
        }
      }

      if (advisoryHorizon === 'all' || advisoryHorizon === 'medium') {
        if (medium?.action.includes('BUY') || medium?.action.includes('ACCUMULATE') || medium?.score >= 60) {
          buys.push({
            symbol,
            companyName,
            price: currentPrice,
            currency,
            score: medium?.score || 50,
            target: medium?.target || currentPrice * 1.15,
            stopLoss: medium?.stopLoss || currentPrice * 0.92,
            rsi,
            volatility,
            triggers: [
              `SIP / Medium Term: ${medium?.action || 'BUY'} (${medium?.score || 50}% match)`,
              `Trend Support: Price trades ${currentPrice > (stock.indicators?.sma50 || currentPrice) ? 'above' : 'below'} 50-day SMA.`,
              medium?.signals?.[0] || 'Steady systematic accumulation zone.'
            ]
          });
        }
        if (medium?.action.includes('REDUCE') || medium?.action.includes('AVOID') || medium?.score <= 40) {
          sells.push({
            symbol,
            companyName,
            price: currentPrice,
            currency,
            score: medium?.score || 50,
            stopLoss: medium?.stopLoss || currentPrice * 0.92,
            rsi,
            volatility,
            triggers: [
              `Medium Term: ${medium?.action || 'AVOID'} (${medium?.score || 50}% rating)`,
              `Volatility: Daily standard deviation swings reach ${volatility.toFixed(2)}%.`,
              medium?.signals?.[1] || 'Price fatigue identified relative to key support lines.'
            ]
          });
        }
      }

      if (advisoryHorizon === 'all' || advisoryHorizon === 'long') {
        if (long?.action.includes('BUY') || long?.action.includes('ACCUMULATE') || long?.score >= 60) {
          buys.push({
            symbol,
            companyName,
            price: currentPrice,
            currency,
            score: long?.score || 50,
            target: long?.target || currentPrice * 1.45,
            stopLoss: long?.stopLoss || currentPrice * 0.80,
            rsi,
            volatility,
            triggers: [
              `Long Term Wealth: ${long?.action || 'BUY'} (${long?.score || 50}% match)`,
              `Capital Returns: Strong Return on Equity (ROE) & moats.`,
              long?.signals?.[1] || 'Structural compound growth indicators are strong.'
            ]
          });
        }
        if (long?.action.includes('AVOID') || long?.action.includes('SELL') || long?.score <= 40) {
          sells.push({
            symbol,
            companyName,
            price: currentPrice,
            currency,
            score: long?.score || 50,
            stopLoss: long?.stopLoss || currentPrice * 0.80,
            rsi,
            volatility,
            triggers: [
              `Long Term Watch: ${long?.action || 'AVOID'} (${long?.score || 50}% score)`,
              `Moving Averages: slips below structural 200-day support boundaries.`,
              long?.signals?.[0] || 'Long term structural growth Moat is sub-optimal.'
            ]
          });
        }
      }
    });

    // Remove duplicates if 'all' is selected (a stock might appear in multiple horizons)
    const uniqueBuysMap = {};
    buys.forEach(item => {
      if (!uniqueBuysMap[item.symbol] || item.score > uniqueBuysMap[item.symbol].score) {
        uniqueBuysMap[item.symbol] = item;
      }
    });

    const uniqueSellsMap = {};
    sells.forEach(item => {
      if (!uniqueSellsMap[item.symbol] || item.score < uniqueSellsMap[item.symbol].score) {
        uniqueSellsMap[item.symbol] = item;
      }
    });

    const uniqueBuys = Object.values(uniqueBuysMap);
    const uniqueSells = Object.values(uniqueSellsMap);

    uniqueBuys.sort((a, b) => b.score - a.score);
    uniqueSells.sort((a, b) => a.score - b.score);

    return { buys: uniqueBuys, sells: uniqueSells };
  };

  const suggestions = getSuggestions();


  return (

    <div className="app-container">
      {/* Header Panel */}
      <header className="header">
        <div className="logo-container">
          <img src="/logo.png" alt="AuraTrade Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }} />
          <div className="logo-text">AuraTrade.ai</div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="badge badge-buy" style={{ letterSpacing: '0.05em' }}>Live Analysis Active</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>v2.4.0</span>
        </div>
      </header>

      {/* Main Stock Finder Search & Preset Chips */}
      <section className="search-section">
        <h1 className="search-title">Algorithmic Stock Horizon Analyst</h1>
        <p className="search-subtitle">
          Real-time scanning and predictive intelligence for Intraday, Medium-Term (Mutual-Fund styles), and Long-Term horizons.
        </p>

        {/* Market Segment Toggle Switcher */}
        <div className="market-switcher-container">
          <button
            className={`market-switcher-btn ${marketSegment === 'india' ? 'active' : ''}`}
            onClick={() => handleMarketSegmentChange('india')}
          >
            🇮🇳 Indian Market
          </button>
          <button
            className={`market-switcher-btn ${marketSegment === 'international' ? 'active' : ''}`}
            onClick={() => handleMarketSegmentChange('international')}
          >
            🌐 International Market
          </button>
        </div>

        {/* Market Clock & Trading Hours Panel */}
        <div className="market-hours-panel">
          <div className={`market-hours-card ${marketSegment === 'india' ? 'focused' : ''}`}>
            <div className="market-hours-header">
              <span className="market-flag">🇮🇳</span>
              <span className="market-name">NSE / BSE India</span>
              {indiaTimeInfo && (
                <span className={`market-status-dot ${indiaTimeInfo.isOpen ? 'open' : 'closed'}`}>
                  {indiaTimeInfo.isOpen ? '● LIVE' : '○ CLOSED'}
                </span>
              )}
            </div>
            <div className="market-time-value">{indiaTimeInfo ? indiaTimeInfo.timeStr : '--:--:-- --'}</div>
            <div className="market-schedule">IST: 09:15 AM - 03:30 PM (Mon-Fri)</div>
          </div>

          <div className={`market-hours-card ${marketSegment === 'international' ? 'focused' : ''}`}>
            <div className="market-hours-header">
              <span className="market-flag">🌐</span>
              <span className="market-name">NYSE / NASDAQ US</span>
              {intlTimeInfo && (
                <span className={`market-status-dot ${intlTimeInfo.isOpen ? 'open' : 'closed'}`}>
                  {intlTimeInfo.isOpen ? '● LIVE' : '○ CLOSED'}
                </span>
              )}
            </div>
            <div className="market-time-value">{intlTimeInfo ? intlTimeInfo.timeStr : '--:--:-- --'}</div>
            <div className="market-schedule">EST: 09:30 AM - 04:00 PM (Mon-Fri)</div>
          </div>
        </div>

        <div className="search-bar-container">
          <svg className="search-icon-svg" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder={marketSegment === 'india' ? "Search Indian stocks (e.g. RELIANCE.NS, TCS.NS, INFYN.NS)..." : "Search international stocks (e.g. AAPL, TSLA, MSFT)..."}
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          />

          {showDropdown && searchResults.length > 0 && (
            <div className="autocomplete-dropdown">
              {searchResults.map((item, index) => (
                <div
                  key={`${item.symbol}-${index}`}
                  className="autocomplete-item"
                  onClick={() => selectStock(item.symbol)}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span className="suggestion-sym">{item.symbol}</span>
                    <span className="suggestion-name">{item.name}</span>
                  </div>
                  <span className="suggestion-exchange">{item.exchange}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick presets */}
        <div className="quick-tags">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>Popular Presets:</span>
          {popularTickers.map((tag) => (
            <button
              key={tag.symbol}
              className={`quick-tag ${selectedSymbol === tag.symbol ? 'active' : ''}`}
              onClick={() => selectStock(tag.symbol)}
            >
              {tag.name} ({tag.symbol.split('.')[0]})
            </button>
          ))}
        </div>
      </section>

      {/* Warning Banner for Simulated/Offline Data */}
      {warning && (
        <div className="warning-banner">
          <span className="warning-icon">⚠️</span>
          <div>
            <strong>API Data Mode:</strong> {warning}. Basic scoring indices and graphs are calculated from high-fidelity mathematical walk simulations.
          </div>
        </div>
      )}

      {/* Main Feature Tabs Navigation */}
      <nav className="tabs-navigation">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Market Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === 'intraday_screener' ? 'active' : ''}`}
          onClick={() => setActiveTab('intraday_screener')}
        >
          🚀 Intraday Scalps
        </button>
        <button
          className={`tab-btn ${activeTab === 'analyzer' ? 'active' : ''}`}
          onClick={() => setActiveTab('analyzer')}
        >
          Deep Analyzer
        </button>
        <button
          className={`tab-btn ${activeTab === 'scenario' ? 'active' : ''}`}
          onClick={() => setActiveTab('scenario')}
        >
          Scenario Projections
        </button>
        <button
          className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
          onClick={() => setActiveTab('comparison')}
        >
          Horizon Comparison Matrix
        </button>
        <button
          className={`tab-btn ${activeTab === 'strategies' ? 'active' : ''}`}
          onClick={() => setActiveTab('strategies')}
        >
          Strategy & Math Logic
        </button>
      </nav>

      {/* TAB 1: MARKET DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="two-col-grid" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
          <div className="glass-panel">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Horizon Scoreboard Overview - {marketSegment === 'india' ? '🇮🇳 Indian Equities' : '🌐 International Equities'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Compare multi-horizon performance across top-traded active segment securities. Click any row to load deep analyzer parameters.
            </p>

            {dashboardLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Calculating dashboard matrix metrics...</div>
            ) : (
              <div className="comparison-table-container">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Stock</th>
                      <th>Last Price</th>
                      <th>Intraday (1D)</th>
                      <th>Medium-Term (3-6M)</th>
                      <th>Long-Term (1-5Y)</th>
                      <th>RSI (14)</th>
                      <th>Volatility</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.map((item, index) => (
                      <tr key={`${item?.symbol || 'stock'}-${index}`} style={{ cursor: 'pointer' }} onClick={() => selectStock(item.symbol)}>
                        <td>
                          <div style={{ fontWeight: '700', color: 'var(--color-info)' }}>{item.symbol}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '140px', whiteSpace: 'nowrap' }}>{item.companyName}</div>
                        </td>
                        <td>
                          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                            {item.currency === 'INR' ? '₹' : '$'}{(item.currentPrice || 0).toFixed(2)}
                          </div>
                          <div className={`stock-change ${(item.change || 0) >= 0 ? 'up' : 'down'}`} style={{ fontSize: '0.75rem' }}>
                            {(item.change || 0) >= 0 ? '+' : ''}{(item.changePercent || 0).toFixed(2)}%
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getActionBadgeClass(item.horizons?.intraday?.action || 'HOLD')}`}>
                            {item.horizons?.intraday?.action || 'HOLD'} ({item.horizons?.intraday?.score || 50}%)
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getActionBadgeClass(item.horizons?.medium?.action || 'HOLD')}`}>
                            {item.horizons?.medium?.action || 'HOLD'} ({item.horizons?.medium?.score || 50}%)
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getActionBadgeClass(item.horizons?.long?.action || 'HOLD')}`}>
                            {item.horizons?.long?.action || 'HOLD'} ({item.horizons?.long?.score || 50}%)
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          <span className={(item.indicators?.rsi || 50) < 30 ? 'up' : (item.indicators?.rsi || 50) > 70 ? 'down' : ''} style={{ fontWeight: '600' }}>
                            {(item.indicators?.rsi || 50).toFixed(1)}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                          {(item.indicators?.volatilityPct || 0).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Dynamic AI Advisor Suggestions Panel */}
          {!dashboardLoading && suggestions && (
            <div className="glass-panel" style={{ border: '1px solid var(--border-color-active)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--color-info)' }}>⚡</span>
                    AuraTrade AI Quantitative Advisor
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Professional algorithmic execution signals matching multi-horizon parameters with precise target boundaries.
                  </p>
                </div>
                {/* Advisory Horizon Filter Chips */}
                <div style={{ display: 'flex', gap: '0.25rem', background: 'rgba(255,255,255,0.02)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  {['all', 'intraday', 'medium', 'long'].map((hz) => (
                    <button
                      key={hz}
                      className={`quick-tag ${advisoryHorizon === hz ? 'active' : ''}`}
                      style={{ margin: 0, padding: '0.35rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px' }}
                      onClick={() => setAdvisoryHorizon(hz)}
                    >
                      {hz === 'all' ? 'All Horizons' : hz === 'intraday' ? 'Intraday (1D)' : hz === 'medium' ? 'Medium (3-6M)' : 'Long (1-5Y)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Side by side columns */}
              <div className="two-col-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                
                {/* Buy Signals column */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span className="badge badge-buy" style={{ fontSize: '0.75rem', fontWeight: '800' }}>● BULLISH SIGNALS</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Screened Accumulation Moats</span>
                  </div>

                  {suggestions.buys.length === 0 ? (
                    <div className="professional-empty-advisory">No active buys matching this filter range.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {suggestions.buys.map((item) => (
                        <div key={item.symbol} className="professional-advisory-row buy-advisory" onClick={() => selectStock(item.symbol)}>
                          <div className="pro-advisory-header">
                            <div>
                              <span className="pro-advisory-sym">{item.symbol}</span>
                              <span className="pro-advisory-company">{item.companyName}</span>
                            </div>
                            <span className="badge badge-buy" style={{ fontSize: '0.7rem' }}>Match: {item.score}%</span>
                          </div>
                          
                          <div className="pro-advisory-metrics-grid">
                            <div className="pro-metric-box">
                              <span className="pro-metric-lbl">Execute Price</span>
                              <span className="pro-metric-val">{item.currency === 'INR' ? '₹' : '$'}{item.price.toFixed(2)}</span>
                            </div>
                            <div className="pro-metric-box">
                              <span className="pro-metric-lbl">Target bounds</span>
                              <span className="pro-metric-val up">{item.currency === 'INR' ? '₹' : '$'}{item.target.toFixed(2)}</span>
                            </div>
                            <div className="pro-metric-box">
                              <span className="pro-metric-lbl">Stop Loss</span>
                              <span className="pro-metric-val down">{item.currency === 'INR' ? '₹' : '$'}{item.stopLoss.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="pro-advisory-bullets">
                            {item.triggers.map((trigger, tIdx) => (
                              <div key={tIdx} className="pro-advisory-bullet-item">
                                <span className="pro-bullet-dot">▸</span>
                                <span className="pro-bullet-text">{trigger}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sell / Avoid Signals column */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span className="badge badge-sell" style={{ fontSize: '0.75rem', fontWeight: '800' }}>▼ BEARISH / AVOID ALERTS</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overbought / Trend Risk</span>
                  </div>

                  {suggestions.sells.length === 0 ? (
                    <div className="professional-empty-advisory">No active warnings matching this filter range.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {suggestions.sells.map((item) => (
                        <div key={item.symbol} className="professional-advisory-row sell-advisory" onClick={() => selectStock(item.symbol)}>
                          <div className="pro-advisory-header">
                            <div>
                              <span className="pro-advisory-sym" style={{ color: 'var(--color-sell)' }}>{item.symbol}</span>
                              <span className="pro-advisory-company">{item.companyName}</span>
                            </div>
                            <span className="badge badge-sell" style={{ fontSize: '0.7rem' }}>Risk Score: {item.score}%</span>
                          </div>
                          
                          <div className="pro-advisory-metrics-grid">
                            <div className="pro-metric-box">
                              <span className="pro-metric-lbl">Last Price</span>
                              <span className="pro-metric-val">{item.currency === 'INR' ? '₹' : '$'}{item.price.toFixed(2)}</span>
                            </div>
                            <div className="pro-metric-box">
                              <span className="pro-metric-lbl">Risk Boundary</span>
                              <span className="pro-metric-val down">{item.currency === 'INR' ? '₹' : '$'}{item.stopLoss.toFixed(2)}</span>
                            </div>
                            <div className="pro-metric-box">
                              <span className="pro-metric-lbl">RSI (14)</span>
                              <span className="pro-metric-val" style={{ color: item.rsi > 68 ? 'var(--color-sell)' : 'var(--text-primary)' }}>{item.rsi.toFixed(1)}</span>
                            </div>
                          </div>

                          <div className="pro-advisory-bullets">
                            {item.triggers.map((trigger, tIdx) => (
                              <div key={tIdx} className="pro-advisory-bullet-item">
                                <span className="pro-bullet-dot" style={{ color: 'var(--color-sell)' }}>▸</span>
                                <span className="pro-bullet-text">{trigger}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="three-col-grid">
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="badge badge-buy" style={{ alignSelf: 'flex-start' }}>Trending Buy Setup</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginTop: '0.25rem' }}>Intraday Scalp</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Seek high volume, high volatility setups where RSI matches oversold parameters (&lt; 32) and MACD confirms signal crosses. Use strict stop losses.
              </p>
            </div>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="badge badge-hold" style={{ alignSelf: 'flex-start' }}>Systematic Growth</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginTop: '0.25rem' }}>Medium Allocation</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Target stocks aligned above their 50 SMA with solid cash generation. Re-evaluate quarterly and accumulate during short correction dips.
              </p>
            </div>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="badge badge-buy" style={{ alignSelf: 'flex-start' }}>Value Moat Setup</div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginTop: '0.25rem' }}>Long-Term Compound</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Ignore temporary day-to-day noise. Buy industry leaders with high return on capital (ROE &gt; 15%), high profit margin, and low net gearing ratios.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: INTRADAY SCALP SCREENER */}
      {activeTab === 'intraday_screener' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass-panel" style={{ border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fff' }}>
              <span className="market-flag">🚀</span>
              Taurus High-Velocity Intraday Scalp Screener
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              High-volatility momentum scans targeting short-term breakout entries, scalp targets, and strict stop loss exits.
            </p>
          </div>

          {dashboardLoading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
              <h3>Scanning active stock segment for volatility spikes...</h3>
            </div>
          ) : (
            <div className="two-col-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {dashboardData
                .map(stock => {
                  if (!stock) return null;
                  const currentPrice = stock.currentPrice || 0;
                  const intraday = stock.horizons?.intraday;
                  const rsi = stock.indicators?.rsi || 50;
                  const vol = stock.indicators?.volatilityPct || 0;

                  // Calculate Risk/Reward ratio
                  const targetDiff = Math.abs((intraday?.target || currentPrice * 1.02) - currentPrice);
                  const stopDiff = Math.abs(currentPrice - (intraday?.stopLoss || currentPrice * 0.98));
                  const rrRatio = stopDiff === 0 ? 2.0 : (targetDiff / stopDiff);

                  return {
                    ...stock,
                    score: intraday?.score || 50,
                    action: intraday?.action || 'HOLD',
                    target: intraday?.target || currentPrice * 1.02,
                    stopLoss: intraday?.stopLoss || currentPrice * 0.98,
                    rrRatio: rrRatio.toFixed(1),
                    vol,
                    rsi
                  };
                })
                .filter(Boolean)
                // Sort by scalp score descending
                .sort((a, b) => b.score - a.score)
                .map((stock) => {
                  const setupStyle = stock.action.includes('BUY') ? 'buy-mode' : stock.action.includes('SELL') ? 'sell-mode' : 'hold-mode';
                  const setupGlow = stock.action.includes('BUY') ? 'rgba(16, 185, 129, 0.08)' : stock.action.includes('SELL') ? 'rgba(244, 63, 94, 0.08)' : 'rgba(245, 158, 11, 0.04)';
                  return (
                    <div 
                      key={stock.symbol} 
                      className={`glass-panel horizon-card ${setupStyle}`} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '1rem', 
                        background: setupGlow,
                        borderLeft: `4px solid ${stock.action.includes('BUY') ? 'var(--color-buy)' : stock.action.includes('SELL') ? 'var(--color-sell)' : 'var(--color-hold)'}`
                      }}
                    >
                      <div className="horizon-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.75rem' }}>
                        <div>
                          <span className="pro-advisory-sym" style={{ fontSize: '1.2rem', color: stock.action.includes('BUY') ? 'var(--color-buy)' : stock.action.includes('SELL') ? 'var(--color-sell)' : 'var(--color-hold)' }}>{stock.symbol}</span>
                          <span className="pro-advisory-company" style={{ fontSize: '0.8rem' }}>{stock.companyName}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge ${getActionBadgeClass(stock.action)}`} style={{ fontSize: '0.75rem' }}>{stock.action}</span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>Match: {stock.score}%</div>
                        </div>
                      </div>

                      <div className="three-col-grid" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                        <div className="pro-metric-box">
                          <span className="pro-metric-lbl">Scalp Entry</span>
                          <span className="pro-metric-val" style={{ fontSize: '0.9rem' }}>{stock.currency === 'INR' ? '₹' : '$'}{stock.currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="pro-metric-box">
                          <span className="pro-metric-lbl">Scalp Target</span>
                          <span className="pro-metric-val up" style={{ fontSize: '0.9rem' }}>{stock.currency === 'INR' ? '₹' : '$'}{stock.target.toFixed(2)}</span>
                        </div>
                        <div className="pro-metric-box">
                          <span className="pro-metric-lbl">Stop Loss guard</span>
                          <span className="pro-metric-val down" style={{ fontSize: '0.9rem' }}>{stock.currency === 'INR' ? '₹' : '$'}{stock.stopLoss.toFixed(2)}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Risk:Reward Ratio</span>
                        <strong style={{ color: 'var(--color-info)', fontFamily: 'var(--font-mono)' }}>{stock.rrRatio} : 1</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Volatility Index (ATR%)</span>
                        <strong style={{ color: stock.vol > 2.2 ? 'var(--color-buy)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{stock.vol.toFixed(2)}% ({stock.vol > 2.2 ? 'High Vol' : 'Normal Vol'})</strong>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', paddingBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>RSI Momentum</span>
                        <strong style={{ color: stock.rsi < 35 || stock.rsi > 65 ? 'var(--color-hold)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{stock.rsi.toFixed(1)}</strong>
                      </div>

                      <div className="pro-advisory-bullets" style={{ marginTop: '0.25rem' }}>
                        <div className="pro-advisory-bullet-item">
                          <span className="pro-bullet-dot" style={{ color: stock.action.includes('BUY') ? 'var(--color-buy)' : stock.action.includes('SELL') ? 'var(--color-sell)' : 'var(--color-hold)' }}>▸</span>
                          <span className="pro-bullet-text" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                            {stock.action.includes('BUY') 
                              ? `Entry trigger breakout above ${stock.currency === 'INR' ? '₹' : '$'}${stock.currentPrice.toFixed(2)} with targeted intraday scalp upside of ${stock.currency === 'INR' ? '₹' : '$'}{(stock.target - stock.currentPrice).toFixed(2)}.`
                              : stock.action.includes('SELL')
                              ? `Short-scalp entry trigger zone below ${stock.currency === 'INR' ? '₹' : '$'}${stock.currentPrice.toFixed(2)} with defensive stop loss trailing close at ${stock.currency === 'INR' ? '₹' : '$'}{stock.stopLoss.toFixed(2)}.`
                              : `Consolidation phase. Range range bound scalping triggers require breakout range verification.`
                            }
                          </span>
                        </div>
                      </div>

                      <button 
                        className="quick-tag" 
                        style={{ marginTop: 'auto', width: '100%', alignSelf: 'stretch', padding: '0.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}
                        onClick={() => {
                          selectStock(stock.symbol);
                          setActiveTab('analyzer');
                        }}
                      >
                        Launch Interactive Chart & Indicators
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEEP STOCK ANALYZER */}
      {activeTab === 'analyzer' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#fff' }}>Crunching Technical Data & Indicators...</div>
              <div>Parsing moving averages, sentiment scores, and building SVG timelines</div>
            </div>
          ) : error ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-sell)' }}>
              <h3>Error Fetching Stock Analysis</h3>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>{error}</p>
              <button className="quick-tag" style={{ marginTop: '1.5rem' }} onClick={() => selectStock('AAPL')}>Reset to AAPL</button>
            </div>
          ) : (
            <div className="dashboard-grid">
              
              {/* Left Column: Price Summary and Custom Graphs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Core Price Metadata Panel */}
                <div className="glass-panel">
                  <div className="stock-header-card">
                    <div className="stock-title-info">
                      <span className="stock-sym">{stockData.symbol}</span>
                      <h2 className="stock-name">{stockData.companyName}</h2>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Currency: {stockData.currency} | Sector: Equity</span>
                    </div>
                    
                    <div className="stock-price-info">
                      <span className="stock-price">
                        {stockData.currency === 'INR' ? '₹' : '$'}{(stockData.currentPrice || 0).toFixed(2)}
                      </span>
                      <span className={`stock-change ${(stockData.change || 0) >= 0 ? 'up' : 'down'}`}>
                        {(stockData.change || 0) >= 0 ? '▲' : '▼'} {stockData.currency === 'INR' ? '₹' : '$'}{Math.abs(stockData.change || 0).toFixed(2)} ({(stockData.changePercent || 0).toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  <div className="three-col-grid" style={{ margin: '1.5rem 0', padding: '1rem 0', borderTop: '1px solid rgba(255, 255, 255, 0.05)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div className="target-item">
                      <span className="target-label">Market Cap</span>
                      <span className="target-val" style={{ fontSize: '1rem' }}>{formatMarketCap(stockData.marketCap)}</span>
                    </div>
                    <div className="target-item">
                      <span className="target-label">P/E Ratio (Trailing)</span>
                      <span className="target-val" style={{ fontSize: '1rem' }}>{stockData.peRatio ? Number(stockData.peRatio).toFixed(2) : 'N/A'}</span>
                    </div>
                    <div className="target-item">
                      <span className="target-label">52 Week Range</span>
                      <span className="target-val" style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                        {stockData.currency === 'INR' ? '₹' : '$'}{stockData.fiftyTwoWeekLow ? Number(stockData.fiftyTwoWeekLow).toFixed(1) : 'N/A'} - {stockData.currency === 'INR' ? '₹' : '$'}{stockData.fiftyTwoWeekHigh ? Number(stockData.fiftyTwoWeekHigh).toFixed(1) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* SVG Historical Timeline Chart */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>Historical Closing Trend (30 Days)</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className={`quick-tag ${!showTvWidget ? 'active' : ''}`}
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}
                          onClick={() => setShowTvWidget(false)}
                        >
                          Native Vector
                        </button>
                        <button 
                          className={`quick-tag ${showTvWidget ? 'active' : ''}`}
                          style={{ padding: '0.2rem 0.6rem', fontSize: '0.7rem' }}
                          onClick={() => setShowTvWidget(true)}
                        >
                          TradingView Live Chart
                        </button>
                      </div>
                    </div>

                    {!showTvWidget ? (
                      <div className="chart-container">
                        <svg className="chart-svg" viewBox="0 0 600 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--color-info)" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="var(--color-info)" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          
                          {/* Y-axis guidelines */}
                          <line x1="15" y1="15" x2="585" y2="15" className="grid-line" />
                          <line x1="15" y1="100" x2="585" y2="100" className="grid-line" />
                          <line x1="15" y1="185" x2="585" y2="185" className="grid-line" />
                          
                          {/* Render the price path and fill area */}
                          {(() => {
                            const { path, areaPath } = generateChartCoordinates(
                              stockData.historicalClosePrices,
                              stockData.historicalDates
                            );
                            return (
                              <>
                                <path d={areaPath} className="chart-area" />
                                <path d={path} className="chart-line" />
                              </>
                            );
                          })()}
                        </svg>

                        {/* Chart Min / Max Price overlay */}
                        <div style={{ position: 'absolute', top: '10px', left: '20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Max: {stockData.currency === 'INR' ? '₹' : '$'}{Math.max(...(stockData.historicalClosePrices || [0])).toFixed(2)}
                        </div>
                        <div style={{ position: 'absolute', bottom: '15px', left: '20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Min: {stockData.currency === 'INR' ? '₹' : '$'}{Math.min(...(stockData.historicalClosePrices || [0])).toFixed(2)}
                        </div>
                        <div style={{ position: 'absolute', bottom: '15px', right: '20px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          Date timeline: 30 Trading Days
                        </div>
                      </div>
                    ) : (
                      <div style={{ marginTop: '1.25rem', width: '100%', height: '400px', background: '#090d14', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div id="tv-medium-widget" style={{ width: '100%', height: '100%' }}>
                          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading live TradingView script components...</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* News Sentiment Feed */}
                <div className="glass-panel">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Algorithmic News Sentiment Feed</span>
                    <span className={`badge ${stockData.sentimentScore > 2 ? 'badge-buy' : stockData.sentimentScore < -2 ? 'badge-sell' : 'badge-hold'}`}>
                      Sentiment: {stockData.sentimentScore > 2 ? 'Bullish' : stockData.sentimentScore < -2 ? 'Bearish' : 'Neutral'} ({stockData.sentimentScore > 0 ? '+' : ''}{stockData.sentimentScore})
                    </span>
                  </h3>
                  
                  {stockData.sentimentScore === 0 ? (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', padding: '1rem 0' }}>No active news stories matching ticker profiles. Calculations run on simulated neutral metrics.</p>
                  ) : (
                    <div className="news-container">
                      {stockData.symbol.endsWith('.NS') || stockData.symbol === 'AAPL' || stockData.symbol === 'TSLA' || isSimulated ? (
                        // Standard simulation stories if live feeds are blocked/unavailable
                        [
                          {
                            title: `Market Alert: ${stockData.companyName} Consolidates After Recent Corporate Updates`,
                            desc: `Valuation desk monitors relative strength margins. Price targets adjust upwards as moving average crossovers align in structural support grids.`,
                            source: 'Financial Index',
                            time: '2 hours ago'
                          },
                          {
                            title: `Analyst Forecast: Volume Outbreaks Support Short Term Rebound in ${stockData.symbol}`,
                            desc: `RSI indices trade in the neutral band while cash flow margins suggest defensive positioning in high volatility indices.`,
                            source: 'Equity Desk',
                            time: '6 hours ago'
                          },
                          {
                            title: `How Dividend Accumulations Boost Yield Compounding in ${stockData.symbol}`,
                            desc: `Portfolios increase systematic buy allocations as capital returns exceed benchmark averages.`,
                            source: 'Brokerage News',
                            time: '1 day ago'
                          }
                        ].map((newsItem, index) => (
                          <div key={index} className="news-card">
                            <div className="news-header">
                              <span className="news-source">{newsItem.source}</span>
                              <span className="news-date">{newsItem.time}</span>
                            </div>
                            <h4 className="news-title">{newsItem.title}</h4>
                            <p className="news-desc">{newsItem.desc}</p>
                          </div>
                        ))
                      ) : (
                        <div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Real-time search news feeds parsed from Yahoo Finance indexes.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Column: Calculations Gauge, Horizon Decision panels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Live indicators score gauge */}
                <div className="glass-panel" style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Technical Momentum Gauge</h3>
                  
                  {/* Gauge Drawing */}
                  <div className="gauge-outer">
                    {/* Calculate needle rotation: map RSI 0-100 to -90 to +90 degrees */}
                    {(() => {
                      const rsiVal = stockData.indicators.rsi || 50;
                      const rot = (rsiVal - 50) * 1.8; // map 50 to 0deg, 100 to 90deg, 0 to -90deg
                      return (
                        <>
                          <div 
                            className="gauge-inner" 
                            style={{ 
                              borderBottomColor: rsiVal >= 60 ? 'var(--color-buy)' : rsiVal <= 40 ? 'var(--color-sell)' : 'var(--color-hold)'
                            }} 
                          />
                          <div className="gauge-needle" style={{ transform: `translateX(-50%) rotate(${rot}deg)` }} />
                        </>
                      );
                    })()}
                  </div>
                  <div className="gauge-label" style={{ color: (stockData.indicators?.rsi || 50) > 60 ? 'var(--color-buy)' : (stockData.indicators?.rsi || 50) < 40 ? 'var(--color-sell)' : 'var(--color-hold)' }}>
                    RSI Value: {(stockData.indicators?.rsi || 50).toFixed(1)} ({(stockData.indicators?.rsi || 50) > 70 ? 'Overbought' : (stockData.indicators?.rsi || 50) < 30 ? 'Oversold' : 'Neutral'})
                  </div>
                  
                  <div className="two-col-grid" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1rem' }}>
                    <div className="metric-row" style={{ padding: '0.4rem 0' }}>
                      <span className="metric-label">MACD Line</span>
                      <span className={"metric-value " + ((stockData.indicators?.macd || 0) >= 0 ? 'up' : 'down')}>{(stockData.indicators?.macd || 0).toFixed(2)}</span>
                    </div>
                    <div className="metric-row" style={{ padding: '0.4rem 0' }}>
                      <span className="metric-label">Signal Line</span>
                      <span className="metric-value" style={{ color: 'var(--text-primary)' }}>{(stockData.indicators?.signal || 0).toFixed(2)}</span>
                    </div>
                    <div className="metric-row" style={{ padding: '0.4rem 0' }}>
                      <span className="metric-label">EMA 9 / 21</span>
                      <span className="metric-value" style={{ fontSize: '0.8rem' }}>
                        {(stockData.indicators?.ema9 || 0).toFixed(1)} / {(stockData.indicators?.ema21 || 0).toFixed(1)}
                      </span>
                    </div>
                    <div className="metric-row" style={{ padding: '0.4rem 0' }}>
                      <span className="metric-label">SMA 50 / 200</span>
                      <span className="metric-value" style={{ fontSize: '0.8rem' }}>
                        {(stockData.indicators?.sma50 || 0).toFixed(1)} / {(stockData.indicators?.sma200 || 0).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommendation Horizon Panels */}
                <div className="glass-panel">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Horizon Target Screener</h3>
                  
                  <div className="horizon-panel">
                    
                    {/* Horizon 1: INTRADAY */}
                    {(() => {
                      const horizon = stockData.horizons.intraday;
                      const cardStyle = horizon.action.includes('BUY') ? 'buy-mode' : horizon.action.includes('SELL') ? 'sell-mode' : 'hold-mode';
                      return (
                        <div className={`horizon-card ${cardStyle}`}>
                          <div className="horizon-header">
                            <div className="horizon-title-box">
                              <span className="horizon-name">1. Intraday Trading</span>
                              <span className="horizon-period">Holding Period: Day Trade (1D)</span>
                            </div>
                            <div className="horizon-score-badge">
                              <span className={`badge ${getActionBadgeClass(horizon.action)}`}>{horizon.action}</span>
                              <span className="horizon-score-val" style={{ color: horizon.action.includes('BUY') ? 'var(--color-buy)' : horizon.action.includes('SELL') ? 'var(--color-sell)' : 'var(--color-hold)' }}>{horizon.score}%</span>
                            </div>
                          </div>

                          <div className="horizon-targets">
                            <div className="target-item">
                              <span className="target-label">Day Target Price</span>
                              <span className="target-val up" style={{ fontSize: '0.95rem' }}>{stockData.currency === 'INR' ? '₹' : '$'}{horizon.target}</span>
                            </div>
                            <div className="target-item">
                              <span className="target-label">Stop Loss Limit</span>
                              <span className="target-val down" style={{ fontSize: '0.95rem' }}>{stockData.currency === 'INR' ? '₹' : '$'}{horizon.stopLoss}</span>
                            </div>
                          </div>

                          <div className="horizon-signals-list">
                            {horizon.signals.map((sig, idx) => (
                              <span key={idx} className="horizon-signal-bullet">{sig}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Horizon 2: MEDIUM-TERM (Mutual fund/ETF accumulation) */}
                    {(() => {
                      const horizon = stockData.horizons.medium;
                      const cardStyle = horizon.action.includes('BUY') || horizon.action.includes('ACCUMULATE') ? 'buy-mode' : horizon.action.includes('REDUCE') || horizon.action.includes('AVOID') ? 'sell-mode' : 'hold-mode';
                      return (
                        <div className={`horizon-card ${cardStyle}`}>
                          <div className="horizon-header">
                            <div className="horizon-title-box">
                              <span className="horizon-name">2. Medium-Term / SIP</span>
                              <span className="horizon-period">Holding Period: 3 - 6 Months</span>
                            </div>
                            <div className="horizon-score-badge">
                              <span className={`badge ${getActionBadgeClass(horizon.action)}`}>{horizon.action}</span>
                              <span className="horizon-score-val" style={{ color: horizon.action.includes('BUY') || horizon.action.includes('ACCUMULATE') ? 'var(--color-buy)' : horizon.action.includes('REDUCE') ? 'var(--color-sell)' : 'var(--color-hold)' }}>{horizon.score}%</span>
                            </div>
                          </div>

                          <div className="horizon-targets">
                            <div className="target-item">
                              <span className="target-label">Mid Target Price</span>
                              <span className="target-val up" style={{ fontSize: '0.95rem' }}>{stockData.currency === 'INR' ? '₹' : '$'}{horizon.target}</span>
                            </div>
                            <div className="target-item">
                              <span className="target-label">SIP Drawdown SL</span>
                              <span className="target-val down" style={{ fontSize: '0.95rem' }}>{stockData.currency === 'INR' ? '₹' : '$'}{horizon.stopLoss}</span>
                            </div>
                          </div>

                          <div className="horizon-signals-list">
                            {horizon.signals.map((sig, idx) => (
                              <span key={idx} className="horizon-signal-bullet">{sig}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Horizon 3: LONG-TERM INVESTING */}
                    {(() => {
                      const horizon = stockData.horizons.long;
                      const cardStyle = horizon.action.includes('BUY') || horizon.action.includes('HOLD') ? 'buy-mode' : 'sell-mode';
                      return (
                        <div className={`horizon-card ${cardStyle}`}>
                          <div className="horizon-header">
                            <div className="horizon-title-box">
                              <span className="horizon-name">3. Long-Term Investing</span>
                              <span className="horizon-period">Holding Period: 1 - 5+ Years</span>
                            </div>
                            <div className="horizon-score-badge">
                              <span className={`badge ${getActionBadgeClass(horizon.action)}`}>{horizon.action}</span>
                              <span className="horizon-score-val" style={{ color: horizon.action.includes('BUY') || horizon.action.includes('HOLD') ? 'var(--color-buy)' : 'var(--color-sell)' }}>{horizon.score}%</span>
                            </div>
                          </div>

                          <div className="horizon-targets">
                            <div className="target-item">
                              <span className="target-label">Long target Price</span>
                              <span className="target-val up" style={{ fontSize: '0.95rem' }}>{stockData.currency === 'INR' ? '₹' : '$'}{horizon.target}</span>
                            </div>
                            <div className="target-item">
                              <span className="target-label">Structural Stop Loss</span>
                              <span className="target-val down" style={{ fontSize: '0.95rem' }}>{stockData.currency === 'INR' ? '₹' : '$'}{horizon.stopLoss}</span>
                            </div>
                          </div>

                          <div className="horizon-signals-list">
                            {horizon.signals.map((sig, idx) => (
                              <span key={idx} className="horizon-signal-bullet">{sig}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                </div>

              </div>

            </div>
          )}
        </>
      )}

      {/* TAB 3: SCENARIO ANALYSIS SIMULATOR */}
      {activeTab === 'scenario' && (
        <>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
              <h3>Simulating scenarios parameters...</h3>
            </div>
          ) : (
            <div className="dashboard-grid">
              {/* Left Column: Sliders and Presets */}
              <div className="glass-panel">
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Scenario Customizer</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Model the stock's future value by adjusting underlying growth and evaluation multipliers.
                </p>

                {/* Preset buttons */}
                <div className="scenario-btn-group">
                  <button
                    className={`scenario-btn ${scenarioPreset === 'bull' ? 'active-bull' : ''}`}
                    onClick={() => applyScenarioPreset('bull')}
                  >
                    🚀 Bull Case
                  </button>
                  <button
                    className={`scenario-btn ${scenarioPreset === 'base' ? 'active-base' : ''}`}
                    onClick={() => applyScenarioPreset('base')}
                  >
                    ⚖️ Base Case
                  </button>
                  <button
                    className={`scenario-btn ${scenarioPreset === 'bear' ? 'active-bear' : ''}`}
                    onClick={() => applyScenarioPreset('bear')}
                  >
                    📉 Bear Case
                  </button>
                </div>

                {/* Growth Slider */}
                <div className="slider-group">
                  <div className="slider-label">
                    <span>Projected 1-Yr EPS Growth Rate</span>
                    <strong style={{ color: scenarioGrowth >= 0 ? 'var(--color-buy)' : 'var(--color-sell)' }}>
                      {scenarioGrowth >= 0 ? '+' : ''}{scenarioGrowth}%
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="60"
                    className="slider-input"
                    value={scenarioGrowth}
                    onChange={(e) => {
                      setScenarioGrowth(Number(e.target.value));
                      setScenarioPreset('custom');
                    }}
                  />
                </div>

                {/* PE Multiple Slider */}
                <div className="slider-group">
                  <div className="slider-label">
                    <span>Target Trailing P/E Multiple</span>
                    <strong style={{ color: 'var(--color-info)' }}>{scenarioPE}x</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    className="slider-input"
                    value={scenarioPE}
                    onChange={(e) => {
                      setScenarioPE(Number(e.target.value));
                      setScenarioPreset('custom');
                    }}
                  />
                </div>

                {/* Sentiment Slider */}
                <div className="slider-group" style={{ marginBottom: '1.5rem' }}>
                  <div className="slider-label">
                    <span>Market Sentiment Offset</span>
                    <strong style={{ color: scenarioSentiment > 0 ? 'var(--color-buy)' : scenarioSentiment < 0 ? 'var(--color-sell)' : 'var(--text-secondary)' }}>
                      {scenarioSentiment > 0 ? '+' : ''}{scenarioSentiment}%
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="40"
                    className="slider-input"
                    value={scenarioSentiment}
                    onChange={(e) => {
                      setScenarioSentiment(Number(e.target.value));
                      setScenarioPreset('custom');
                    }}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                  <h4 style={{ fontWeight: '700', color: '#fff', marginBottom: '0.25rem' }}>Mathematical Modeling Formula:</h4>
                  <div className="strategy-formula" style={{ margin: '0.4rem 0' }}>
                    Projected Price = CurrentEPS * (1 + Growth/100) * TargetPE * (1 + Sentiment/100)
                  </div>
                  <p>
                    * Current EPS is derived as <strong>{stockData.currency === 'INR' ? '₹' : '$'}{(stockData.eps || (stockData.currentPrice / (stockData.peRatio || 25)) || 0).toFixed(2)}</strong>. Future valuation assumes linear earnings acceleration under corporate updates.
                  </p>
                </div>
              </div>

              {/* Right Column: Outcomes & Visual SVG path */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel">
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1.25rem' }}>Dynamic ROI Projections (1-Year)</h3>
                  
                  {(() => {
                    const currentPrice = stockData.currentPrice;
                    const basePE = stockData.peRatio || 25;
                    const eps = stockData.eps || (currentPrice / basePE);
                    
                    // Projections math
                    const calcProjectedPrice = (growth, pe, sentiment) => {
                      const projEPS = eps * (1 + growth / 100);
                      return Math.max(0.1, projEPS * pe * (1 + sentiment / 100));
                    };

                    const customPrice = calcProjectedPrice(scenarioGrowth, scenarioPE, scenarioSentiment);
                    const customReturn = ((customPrice - currentPrice) / currentPrice) * 100;

                    // Preset comparison bounds
                    const bullPrice = calcProjectedPrice(30, Math.round(basePE * 1.35), 20);
                    const bullReturn = ((bullPrice - currentPrice) / currentPrice) * 100;

                    const bearPrice = calcProjectedPrice(-8, Math.round(basePE * 0.7), -20);
                    const bearReturn = ((bearPrice - currentPrice) / currentPrice) * 100;

                    // Recommendation Tag
                    let action = 'HOLD';
                    let badgeClass = 'badge-hold';
                    if (customReturn >= 20) {
                      action = 'STRONG BUY (Accumulate)';
                      badgeClass = 'badge-buy';
                    } else if (customReturn >= 8) {
                      action = 'BUY (Moderate Return)';
                      badgeClass = 'badge-buy';
                    } else if (customReturn <= -12) {
                      action = 'AVOID (High Downside Risk)';
                      badgeClass = 'badge-sell';
                    } else if (customReturn <= -2) {
                      action = 'REDUCE / SELL';
                      badgeClass = 'badge-sell';
                    }

                    // Scaling SVG prices to Y coordinates (bounds: 25 to 175)
                    const allPrices = [currentPrice, customPrice, bullPrice, bearPrice];
                    const maxP = Math.max(...allPrices) * 1.1;
                    const minP = Math.min(...allPrices) * 0.9;
                    const pRange = maxP - minP || 1;
                    const getScaleY = (p) => 25 + (1 - (p - minP) / pRange) * 150;

                    const yStart = getScaleY(currentPrice);
                    const yBull = getScaleY(bullPrice);
                    const yCustom = getScaleY(customPrice);
                    const yBear = getScaleY(bearPrice);

                    return (
                      <>
                        {/* Results Row */}
                        <div className="three-col-grid" style={{ marginBottom: '1.25rem' }}>
                          <div className="target-item">
                            <span className="target-label">Current Ticker Price</span>
                            <span className="target-val">{stockData.currency === 'INR' ? '₹' : '$'}{(currentPrice || 0).toFixed(2)}</span>
                          </div>
                          <div className="target-item">
                            <span className="target-label">Projected Price</span>
                            <span className={`target-val ${customReturn >= 0 ? 'up' : 'down'}`}>
                              {stockData.currency === 'INR' ? '₹' : '$'}{(customPrice || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="target-item">
                            <span className="target-label">Expected Return</span>
                            <span className={`target-val ${customReturn >= 0 ? 'up' : 'down'}`}>
                              {(customReturn || 0).toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Model Evaluation:</span>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.8rem' }}>{action}</span>
                        </div>

                        {/* Interactive Forecasting Bezier Curve Canvas */}
                        <div className="projection-chart-container">
                          <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none">
                            {/* Horizontal guide grids */}
                            <line x1="50" y1="25" x2="520" y2="25" className="grid-line" />
                            <line x1="50" y1="100" x2="520" y2="100" className="grid-line" />
                            <line x1="50" y1="175" x2="520" y2="175" className="grid-line" />
                            
                            {/* Projections Curves */}
                            {/* Bull Curve */}
                            <path
                              d={`M 50 ${yStart} C 200 ${yStart}, 400 ${yBull}, 520 ${yBull}`}
                              fill="none"
                              stroke="var(--color-buy)"
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                              opacity="0.6"
                            />
                            {/* Bear Curve */}
                            <path
                              d={`M 50 ${yStart} C 200 ${yStart}, 400 ${yBear}, 520 ${yBear}`}
                              fill="none"
                              stroke="var(--color-sell)"
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                              opacity="0.6"
                            />
                            {/* Custom Curve */}
                            <path
                              d={`M 50 ${yStart} C 200 ${yStart}, 400 ${yCustom}, 520 ${yCustom}`}
                              fill="none"
                              stroke="var(--color-info)"
                              strokeWidth="3"
                              filter="drop-shadow(0 2px 5px rgba(59, 130, 246, 0.3))"
                            />

                            {/* Circle Markers */}
                            <circle cx="50" cy={yStart} r="5" fill="#fff" />
                            <circle cx="520" cy={yCustom} r="5" fill="var(--color-info)" />
                            
                            {/* Text labels directly on charts */}
                            <text x="60" y={yStart - 8} fill="var(--text-secondary)" fontSize="10" fontFamily="var(--font-mono)">Start: {stockData.currency === 'INR' ? '₹' : '$'}{(currentPrice || 0).toFixed(1)}</text>
                            
                            <text x="530" y={yBull + 4} className="projection-label-bull">Bull: {bullReturn >= 0 ? '+' : ''}{(bullReturn || 0).toFixed(0)}%</text>
                            <text x="530" y={yCustom + 4} className="projection-label-base">Custom: {customReturn >= 0 ? '+' : ''}{(customReturn || 0).toFixed(0)}%</text>
                            <text x="530" y={yBear + 4} className="projection-label-bear">Bear: {bearReturn >= 0 ? '+' : ''}{(bearReturn || 0).toFixed(0)}%</text>
                          </svg>
                        </div>

                        {/* Forecast Summary Bullet details */}
                        <div className="horizon-signals-list" style={{ marginTop: '1.25rem' }}>
                          <div className="horizon-signal-bullet">
                            <span>Medium-term allocation (3-6 Months) handles this projection by adjusting portfolio weights. {customReturn > 15 ? 'Aggressive systematic buys are favored.' : customReturn < 0 ? 'Extreme caution is advised: hedge exposures.' : 'Moderate accumulation recommended.'}</span>
                          </div>
                          <div className="horizon-signal-bullet">
                            <span>Long-term compounders (1-5 Years) view this model as validation of structural P/E adjustments. {scenarioPE > basePE ? `Projected multiple expansion (${scenarioPE} vs current ${basePE.toFixed(0)}) suggests high sector demand.` : `Projected contraction (${scenarioPE} vs current ${basePE.toFixed(0)}) indicates value dilution risks.`}</span>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 4: COMPARISON MATRIX */}
      {activeTab === 'comparison' && (
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Horizon Comparison Matrix - {marketSegment === 'india' ? '🇮🇳 Indian Market' : '🌐 International Market'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Add stocks side-by-side to evaluate their suitability scores across short, medium, and long-term holding limits.
          </p>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', maxWidth: '500px', position: 'relative' }}>
            <input
              type="text"
              className="search-input"
              style={{ padding: '0.6rem 1rem 0.6rem 2.2rem', fontSize: '0.9rem' }}
              placeholder={marketSegment === 'india' ? "Search Indian ticker to add (e.g. TCS.NS)..." : "Search international ticker to add (e.g. MSFT)..."}
              value={compareQuery}
              onChange={handleCompareSearchChange}
              onFocus={() => setShowCompareDropdown(true)}
              onBlur={() => setTimeout(() => setShowCompareDropdown(false), 200)}
            />
            <svg className="search-icon-svg" style={{ left: '0.8rem', width: '14px', height: '14px' }} viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>

            {showCompareDropdown && compareResults.length > 0 && (
              <div className="autocomplete-dropdown" style={{ top: '100%' }}>
                {compareResults.map((item, index) => (
                  <div
                    key={`${item.symbol}-${index}`}
                    className="autocomplete-item"
                    onClick={() => addToCompare(item.symbol)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="suggestion-sym">{item.symbol}</span>
                      <span className="suggestion-name" style={{ fontSize: '0.85rem' }}>{item.name}</span>
                    </div>
                    <span className="suggestion-exchange" style={{ fontSize: '0.7rem' }}>{item.exchange}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {compareLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Comparing matrices details...</div>
          ) : (
            <div className="comparison-table-container">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Security Ticker</th>
                    <th>Current Price</th>
                    <th>Intraday Score</th>
                    <th>Medium-Term Score</th>
                    <th>Long-Term Score</th>
                    <th>RSI Momentum</th>
                    <th>Volatility Index</th>
                    <th>P/E Metric</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {compareList.map((symbol) => {
                    const data = compareData[symbol];
                    if (!data) return null;
                    return (
                      <tr key={symbol}>
                        <td style={{ fontWeight: '700' }}>
                          <span style={{ color: 'var(--color-info)' }}>{symbol}</span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '120px' }}>{data.companyName}</div>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {data.currency === 'INR' ? '₹' : '$'}{(data.currentPrice || 0).toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge ${getActionBadgeClass(data.horizons?.intraday?.action || 'HOLD')}`} style={{ marginRight: '0.5rem' }}>
                            {data.horizons?.intraday?.action || 'HOLD'}
                          </span>
                          <strong style={{ fontFamily: 'var(--font-mono)' }}>{data.horizons?.intraday?.score || 50}%</strong>
                        </td>
                        <td>
                          <span className={`badge ${getActionBadgeClass(data.horizons?.medium?.action || 'HOLD')}`} style={{ marginRight: '0.5rem' }}>
                            {data.horizons?.medium?.action || 'HOLD'}
                          </span>
                          <strong style={{ fontFamily: 'var(--font-mono)' }}>{data.horizons?.medium?.score || 50}%</strong>
                        </td>
                        <td>
                          <span className={`badge ${getActionBadgeClass(data.horizons?.long?.action || 'HOLD')}`} style={{ marginRight: '0.5rem' }}>
                            {data.horizons?.long?.action || 'HOLD'}
                          </span>
                          <strong style={{ fontFamily: 'var(--font-mono)' }}>{data.horizons?.long?.score || 50}%</strong>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{(data.indicators?.rsi || 50).toFixed(1)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{(data.indicators?.volatilityPct || 0).toFixed(2)}%</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{data.peRatio ? Number(data.peRatio).toFixed(1) : 'N/A'}</td>
                        <td>
                          <button
                            className="badge badge-sell"
                            style={{ cursor: 'pointer', background: 'transparent' }}
                            onClick={() => removeFromCompare(symbol)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: MATHEMATICAL LOGIC & STRATEGY CENTER */}
      {activeTab === 'strategies' && (
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Mathematical & Technical Screening Rationale</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              The algorithms combine modern technical indicators with core fundamental evaluation to filter stocks into discrete investment classes.
            </p>
          </div>

          <div className="three-col-grid">
            
            <div className="strategy-card">
              <span className="strategy-title">1. Intraday Momentum Indicator</span>
              <p className="strategy-desc">
                Focuses on immediate micro-trends. Integrates short EMA trends with RSI oversold/overbought parameters, MACD crossovers, and daily Average True Range (ATR) percentages.
              </p>
              <div className="strategy-formula">
                IntradayScore = Weight(RSI) + Weight(MACD Crossover) + Weight(EMA_9 &gt; EMA_21) + Weight(ATR_Volatility)
              </div>
              <p className="strategy-desc" style={{ fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem' }}>
                * High volatility is rewarded with positive weight, providing sufficient range to scalp within a 6.5 hour trading session.
              </p>
            </div>

            <div className="strategy-card">
              <span className="strategy-title">2. Medium-Term / SIP System</span>
              <p className="strategy-desc">
                Calculates technical trend alignments relative to the 50-day Simple Moving Average (SMA) combined with fundamental growth benchmarks (P/E relative to sector, trailing EPS, and revenue changes).
              </p>
              <div className="strategy-formula">
                MediumScore = Weight(Price &gt; SMA_50) + Weight(P/E &lt; 30) + Weight(RevGrowth &gt; 15%) - Penalty(ATR_Volatility &gt; 3%)
              </div>
              <p className="strategy-desc" style={{ fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem' }}>
                * High volatility is penalized as systemic SIP systems seek lower standard deviation assets to minimize portfolio drawdowns.
              </p>
            </div>

            <div className="strategy-card">
              <span className="strategy-title">3. Long-Term Compounder</span>
              <p className="strategy-desc">
                Disregards short-term indicators. Screens structural price support (200 SMA), Return on Equity (ROE &gt; 15%), operating net margins (&gt; 20%), dividend compounders, and enterprise scale.
              </p>
              <div className="strategy-formula">
                LongScore = Weight(Price &gt; SMA_200) + Weight(ROE &gt; 15%) + Weight(Margin &gt; 20%) + Weight(DivYield &gt; 1.5%)
              </div>
              <p className="strategy-desc" style={{ fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.5rem' }}>
                * Focuses on structural moats. Stocks with high pricing power and cash flows receive the highest score rating here.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className="footer">
        <div>
          Calculations are powered by <a href="https://www.tradingview.com" target="_blank" rel="noreferrer" className="footer-link">TradingView Widget APIs</a> and Yahoo Finance quotes.
        </div>
        <div>
          © {new Date().getFullYear()} AuraTrade.ai. All analytical indicators are for educational simulation. Invest at your own risk.
        </div>
      </footer>
    </div>
  );
}
