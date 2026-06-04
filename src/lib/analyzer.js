/**
 * Stock Analysis Engine - Calculations & Screening Logic
 */

// Helper: Calculate Simple Moving Average (SMA)
export function calculateSMA(prices, period) {
  if (!prices || prices.length < period) return [];
  const smas = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((acc, p) => acc + p, 0);
    smas.push({
      index: i,
      value: Number((sum / period).toFixed(2))
    });
  }
  return smas;
}

// Helper: Calculate Exponential Moving Average (EMA)
export function calculateEMA(prices, period) {
  if (!prices || prices.length < period) return [];
  const emas = [];
  const k = 2 / (period + 1);
  
  // Start with SMA for the first value
  let ema = prices.slice(0, period).reduce((acc, p) => acc + p, 0) / period;
  emas.push({ index: period - 1, value: Number(ema.toFixed(2)) });

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
    emas.push({ index: i, value: Number(ema.toFixed(2)) });
  }
  return emas;
}

// Helper: Calculate Relative Strength Index (RSI)
export function calculateRSI(prices, period = 14) {
  if (!prices || prices.length <= period) return [];
  const rsis = [];
  
  let gains = 0;
  let losses = 0;

  // First RSI value calculations
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - 100 / (1 + rs);
  rsis.push({ index: period, value: Number(rsi.toFixed(2)) });

  // Subsequent RSI values
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - 100 / (1 + rs);
    rsis.push({ index: i, value: Number(rsi.toFixed(2)) });
  }
  return rsis;
}

// Helper: Calculate Moving Average Convergence Divergence (MACD)
export function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!prices || prices.length < slowPeriod + signalPeriod) return [];
  
  const fastEmaValues = calculateEMA(prices, fastPeriod);
  const slowEmaValues = calculateEMA(prices, slowPeriod);
  
  // Align fast and slow EMAs
  const macdLine = [];
  const slowMap = new Map(slowEmaValues.map(item => [item.index, item.value]));
  
  fastEmaValues.forEach(fast => {
    if (slowMap.has(fast.index)) {
      macdLine.push({
        index: fast.index,
        value: Number((fast.value - slowMap.get(fast.index)).toFixed(2))
      });
    }
  });

  const macdRawValues = macdLine.map(m => m.value);
  const signalLineValues = calculateEMA(macdRawValues, signalPeriod);
  
  const results = [];
  const signalMap = new Map(signalLineValues.map((item, idx) => [macdLine[item.index].index, item.value]));

  macdLine.forEach(m => {
    if (signalMap.has(m.index)) {
      const sigVal = signalMap.get(m.index);
      results.push({
        index: m.index,
        macd: m.value,
        signal: sigVal,
        histogram: Number((m.value - sigVal).toFixed(2))
      });
    }
  });

  return results;
}

// Core stock analysis function
export function analyzeStock(quote, historical, news = []) {
  const closePrices = historical.map(bar => bar.close || bar.adjClose);
  const currentPrice = quote.regularMarketPrice || closePrices[closePrices.length - 1];
  
  // Compute indicators
  const rsiHistory = calculateRSI(closePrices, 14);
  const macdHistory = calculateMACD(closePrices, 12, 26, 9);
  const ema9History = calculateEMA(closePrices, 9);
  const ema21History = calculateEMA(closePrices, 21);
  const sma50History = calculateSMA(closePrices, 50);
  const sma200History = calculateSMA(closePrices, 200);

  // Latest indicators values
  const rsi = rsiHistory.length > 0 ? rsiHistory[rsiHistory.length - 1].value : 50;
  const macdObj = macdHistory.length > 0 ? macdHistory[macdHistory.length - 1] : { macd: 0, signal: 0, histogram: 0 };
  const ema9 = ema9History.length > 0 ? ema9History[ema9History.length - 1].value : currentPrice;
  const ema21 = ema21History.length > 0 ? ema21History[ema21History.length - 1].value : currentPrice;
  const sma50 = sma50History.length > 0 ? sma50History[sma50History.length - 1].value : currentPrice;
  const sma200 = sma200History.length > 0 ? sma200History[sma200History.length - 1].value : currentPrice;

  // Sentiment Analysis from News (simple search keyword matching)
  let sentimentScore = 0; // -10 to +10
  const positiveWords = ['buy', 'growth', 'upgrade', 'bullish', 'strong', 'earnings', 'beat', 'innovative', 'surges', 'win', 'high'];
  const negativeWords = ['sell', 'decline', 'downgrade', 'bearish', 'weak', 'miss', 'drop', 'deficit', 'fall', 'investigation', 'risk'];
  
  news.forEach(item => {
    const title = (item.title || '').toLowerCase();
    const summary = (item.description || item.summary || '').toLowerCase();
    positiveWords.forEach(word => {
      if (title.includes(word)) sentimentScore += 2;
      if (summary.includes(word)) sentimentScore += 1;
    });
    negativeWords.forEach(word => {
      if (title.includes(word)) sentimentScore -= 2;
      if (summary.includes(word)) sentimentScore -= 1;
    });
  });
  sentimentScore = Math.max(-10, Math.min(10, sentimentScore));

  // Volatility (ATR approximation over 14 days)
  let sumRange = 0;
  const volPeriod = Math.min(14, historical.length - 1);
  for (let i = historical.length - volPeriod; i < historical.length; i++) {
    const high = historical[i].high || historical[i].close;
    const low = historical[i].low || historical[i].close;
    sumRange += (high - low);
  }
  const avgDailyRange = sumRange / volPeriod;
  const volatilityPct = (avgDailyRange / currentPrice) * 100;

  // 1. INTRADAY ANALYSIS (Short-term technical momentum)
  let intradayScore = 50;
  const intradaySignals = [];

  // RSI Signal
  if (rsi < 30) {
    intradayScore += 20;
    intradaySignals.push(`RSI is oversold at ${rsi}, indicating a strong technical rebound potential.`);
  } else if (rsi > 70) {
    intradayScore -= 20;
    intradaySignals.push(`RSI is overbought at ${rsi}, suggesting immediate consolidation or profit booking.`);
  } else if (rsi > 50) {
    intradayScore += 5;
    intradaySignals.push(`RSI is at ${rsi}, representing mild bullish momentum.`);
  } else {
    intradayScore -= 5;
    intradaySignals.push(`RSI is at ${rsi}, indicating weak short-term momentum.`);
  }

  // MACD Crossover Signal
  if (macdObj.macd > macdObj.signal && macdObj.histogram > 0) {
    intradayScore += 15;
    intradaySignals.push("MACD is above the signal line (bullish crossover), confirming upward momentum.");
  } else if (macdObj.macd < macdObj.signal && macdObj.histogram < 0) {
    intradayScore -= 15;
    intradaySignals.push("MACD has crossed below the signal line, indicating active selling pressure.");
  }

  // Moving Average Crossover (EMA 9 vs EMA 21)
  if (ema9 > ema21) {
    intradayScore += 10;
    intradaySignals.push("Short-term EMA (9) is trading above EMA (21), supporting an active intraday uptrend.");
  } else {
    intradayScore -= 10;
    intradaySignals.push("Short-term EMA (9) is below EMA (21), indicating intraday weakness.");
  }

  // Volatility impact for intraday
  if (volatilityPct > 2.5) {
    intradayScore += 5; // Volatile stocks are good for intraday
    intradaySignals.push(`Average daily range is high (${volatilityPct.toFixed(2)}%), offering excellent scalp and target opportunities.`);
  } else {
    intradayScore -= 5;
    intradaySignals.push(`Volatility is low (${volatilityPct.toFixed(2)}%), which may result in slow price movements for intraday trading.`);
  }

  // News Sentiment impact
  if (sentimentScore > 2) {
    intradayScore += 10;
    intradaySignals.push("Positive news sentiment is driving early buying interest.");
  } else if (sentimentScore < -2) {
    intradayScore -= 10;
    intradaySignals.push("Negative news flow is triggering panic selling or short building.");
  }

  intradayScore = Math.max(0, Math.min(100, intradayScore));
  let intradayAction = "HOLD";
  if (intradayScore >= 75) intradayAction = "STRONG BUY";
  else if (intradayScore >= 60) intradayAction = "BUY";
  else if (intradayScore <= 25) intradayAction = "STRONG SELL";
  else if (intradayScore <= 40) intradayAction = "SELL";

  // Calculate intraday targets based on ATR (using typical day trade ratios)
  const intradayTarget = currentPrice + (avgDailyRange * 0.75);
  const intradayStopLoss = currentPrice - (avgDailyRange * 0.40);


  // 2. MEDIUM-TERM / MUTUAL FUND-STYLE (3-6 Months)
  // Scoring based on trend stability, moderate valuation, news sentiment, and volatility
  let mediumScore = 50;
  const mediumSignals = [];

  // Price relative to 50 SMA
  if (currentPrice > sma50) {
    mediumScore += 15;
    mediumSignals.push(`Stock is trading above its 50-day SMA ($${sma50.toFixed(2)}), confirming a healthy medium-term uptrend.`);
  } else {
    mediumScore -= 15;
    mediumSignals.push(`Stock has slipped below its 50-day SMA ($${sma50.toFixed(2)}), showing medium-term distribution.`);
  }

  // Valuation (P/E ratio check)
  const pe = quote.trailingPE;
  if (pe) {
    if (pe < 15) {
      mediumScore += 15;
      mediumSignals.push(`Valuation is highly attractive with a low trailing P/E of ${pe.toFixed(1)}.`);
    } else if (pe > 45) {
      mediumScore -= 10;
      mediumSignals.push(`P/E ratio is premium at ${pe.toFixed(1)}, requiring high growth to justify.`);
    } else {
      mediumScore += 5;
      mediumSignals.push(`P/E ratio is at a reasonable industry standard of ${pe.toFixed(1)}.`);
    }
  } else {
    mediumSignals.push("P/E ratio data is unavailable (typical of tech startups or turnarounds).");
  }

  // Earnings growth
  const revenueGrowth = quote.revenueGrowth || 0;
  if (revenueGrowth > 0.15) {
    mediumScore += 10;
    mediumSignals.push(`Robust quarterly revenue growth of ${(revenueGrowth * 100).toFixed(1)}% supports investment accumulation.`);
  }

  // Volatility check (Low/Medium volatility is preferred for Mutual-fund styles)
  if (volatilityPct < 2.0) {
    mediumScore += 10;
    mediumSignals.push("Steady price behavior with low volatility makes it highly suitable for conservative systematic investment (SIP).");
  } else {
    mediumScore -= 5;
    mediumSignals.push("Elevated volatility indicates potential fluctuations in portfolio valuations.");
  }

  // Sector trend representation
  if (sentimentScore > 0) {
    mediumScore += 5;
  }

  mediumScore = Math.max(0, Math.min(100, mediumScore));
  let mediumAction = "HOLD";
  if (mediumScore >= 75) mediumAction = "BUY & ACCUMULATE";
  else if (mediumScore >= 60) mediumAction = "ACCUMULATE ON DIPS";
  else if (mediumScore <= 35) mediumAction = "REDUCE / AVOID";

  const mediumTarget = currentPrice * 1.15; // 15% upside target
  const mediumStopLoss = currentPrice * 0.92; // 8% support stop loss


  // 3. LONG-TERM INVESTING (1-5+ Years fundamental focus)
  let longScore = 50;
  const longSignals = [];

  // Position relative to 200 SMA (Long-term indicator)
  if (currentPrice > sma200) {
    longScore += 15;
    longSignals.push(`Trading above 200-day SMA ($${sma200.toFixed(2)}), validating structural long-term bullish architecture.`);
  } else {
    longScore -= 10;
    longSignals.push(`Below 200-day SMA ($${sma200.toFixed(2)}), signifying cyclical correction or structural downtrend.`);
  }

  // Return on Equity (ROE) & Debt
  const financialCurrency = quote.financialCurrency || 'USD';
  const roe = quote.returnOnEquity || 0.18; // Default to a standard metric if unavailable
  if (roe > 0.15) {
    longScore += 15;
    longSignals.push(`Excellent capitalization return with Return on Equity (ROE) at ${(roe * 100).toFixed(1)}%.`);
  } else if (roe < 0.08 && roe > 0) {
    longScore -= 10;
    longSignals.push(`Inefficient capital deployment, ROE is sub-optimal at ${(roe * 100).toFixed(1)}%.`);
  }

  // Enterprise Value / EBITDA or profit margins
  const profitMargin = quote.profitMargins || 0.10;
  if (profitMargin > 0.20) {
    longScore += 10;
    longSignals.push(`High profit margin (${(profitMargin * 100).toFixed(1)}%) denotes strong industry moat and pricing power.`);
  }

  // Dividend Compounding potential
  const divYield = quote.dividendYield || 0;
  if (divYield > 0.015) {
    longScore += 10;
    longSignals.push(`Compound interest booster: Dividends yield is stable at ${(divYield * 100).toFixed(2)}%.`);
  }

  // Market Cap (prefer stable blue-chips for low risk, or mid-caps for growth)
  const marketCap = quote.marketCap || 50000000000;
  if (marketCap > 100000000000) {
    longScore += 5;
    longSignals.push("Mega-cap status offers robust balance sheets capable of weathering economic downturns.");
  }

  longScore = Math.max(0, Math.min(100, longScore));
  let longAction = "HOLD";
  if (longScore >= 75) longAction = "STRONG BUY & HOLD";
  else if (longScore >= 60) longAction = "ACCUMULATE FOR LONG-TERM";
  else if (longScore <= 40) longAction = "AVOID / LIQUIDATE";

  const longTarget = currentPrice * 1.45; // 45% upside target over long run
  const longStopLoss = currentPrice * 0.80; // 20% max draw-down limit

  // 4. TOMORROW PREDICTION (Next-Day AI Quantitative Forecast)
  const lastBar = historical[historical.length - 1] || {};
  const highToday = lastBar.high || currentPrice;
  const lowToday = lastBar.low || currentPrice;
  const closeToday = lastBar.close || currentPrice;
  
  // Pivot point calculations for support & resistance
  const pivot = (highToday + lowToday + closeToday) / 3;
  const r1 = (2 * pivot) - lowToday;
  const s1 = (2 * pivot) - highToday;
  const r2 = pivot + (highToday - lowToday);
  const s2 = pivot - (highToday - lowToday);
  
  // Breakout and Breakdown triggers
  const breakoutTrigger = highToday * 1.0025;
  const breakdownTrigger = lowToday * 0.9975;
  
  // Historical context
  const prevMacdObj = macdHistory.length > 1 ? macdHistory[macdHistory.length - 2] : macdObj;
  const prevRsi = rsiHistory.length > 1 ? rsiHistory[rsiHistory.length - 2].value : rsi;
  
  // Tomorrow Trend Scoring
  let tomorrowScore = 50;
  const tomorrowSignals = [];
  
  // Rule 1: Moving average price alignment
  if (currentPrice > ema9) {
    tomorrowScore += 10;
    tomorrowSignals.push("Short-term bias is bullish with the price holding above the 9 EMA.");
  } else {
    tomorrowScore -= 10;
    tomorrowSignals.push("Price resides below the 9 EMA, indicating a minor short-term bearish drag.");
  }
  
  // Rule 2: MACD Histogram expansion/contraction
  if (macdObj.histogram > prevMacdObj.histogram) {
    tomorrowScore += 10;
    tomorrowSignals.push("MACD histogram is expanding positive, signaling upward momentum acceleration.");
  } else {
    tomorrowScore -= 10;
    tomorrowSignals.push("MACD momentum is slowing down or contracting, indicating consolidation or selling pressure.");
  }
  
  // Rule 3: RSI Slope
  if (rsi > prevRsi) {
    tomorrowScore += 8;
    tomorrowSignals.push("RSI slope is rising, validating increasing buyer strength.");
  } else {
    tomorrowScore -= 8;
    tomorrowSignals.push("RSI is sloping downward, reflecting minor momentum exhaustion.");
  }
  
  // Rule 4: Close relative to day's range
  const dayRange = highToday - lowToday;
  if (dayRange > 0) {
    const closePosition = (closeToday - lowToday) / dayRange;
    if (closePosition > 0.7) {
      tomorrowScore += 12;
      tomorrowSignals.push("Stock closed near the high of the day, exhibiting strong session-end buying.");
    } else if (closePosition < 0.3) {
      tomorrowScore -= 12;
      tomorrowSignals.push("Stock closed near the low of the day, showing active late-session distribution.");
    } else {
      tomorrowSignals.push("Stock closed in the middle of its daily range, reflecting neutral intraday balance.");
    }
  }
  
  // Rule 5: Sentiment
  if (sentimentScore > 2) {
    tomorrowScore += 10;
    tomorrowSignals.push("Bullish market sentiment is expected to carry over to tomorrow's opening bell.");
  } else if (sentimentScore < -2) {
    tomorrowScore -= 10;
    tomorrowSignals.push("Bearish news flows suggest defensive/cautious opening bids tomorrow.");
  }
  
  tomorrowScore = Math.max(5, Math.min(95, tomorrowScore));
  
  let tomorrowDirection = "NEUTRAL";
  let tomorrowAction = "RANGE CONSOLIDATION";
  let tomorrowConfidence = 50;
  
  if (tomorrowScore >= 62) {
    tomorrowDirection = "BULLISH";
    tomorrowAction = "LONG BREAKOUT SETUP";
    tomorrowConfidence = tomorrowScore;
  } else if (tomorrowScore <= 38) {
    tomorrowDirection = "BEARISH";
    tomorrowAction = "SHORT BREAKDOWN SETUP";
    tomorrowConfidence = 100 - tomorrowScore;
  } else {
    tomorrowDirection = "NEUTRAL";
    tomorrowAction = "RANGE SCALP SETUP";
    tomorrowConfidence = Math.round(Math.abs(50 - tomorrowScore) * 2 + 50);
  }
  
  // Volatility projections for expected range
  const rangeDelta = avgDailyRange * 0.9;
  let tomorrowHigh = currentPrice;
  let tomorrowLow = currentPrice;
  
  if (tomorrowDirection === "BULLISH") {
    tomorrowHigh = currentPrice + rangeDelta * 1.15;
    tomorrowLow = currentPrice - rangeDelta * 0.85;
  } else if (tomorrowDirection === "BEARISH") {
    tomorrowHigh = currentPrice + rangeDelta * 0.85;
    tomorrowLow = currentPrice - rangeDelta * 1.15;
  } else {
    tomorrowHigh = currentPrice + rangeDelta;
    tomorrowLow = currentPrice - rangeDelta;
  }

  return {
    symbol: quote.symbol || 'STOCK',
    companyName: quote.longName || quote.shortName || 'Stock Profile',
    currentPrice,
    change: quote.regularMarketChange || 0,
    changePercent: quote.regularMarketChangePercent || 0,
    currency: financialCurrency,
    marketCap: quote.marketCap,
    peRatio: quote.trailingPE || null,
    eps: quote.trailingEps || null,
    dividendYield: quote.dividendYield ? (quote.dividendYield * 100) : 0,
    fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
    volume: quote.regularMarketVolume,
    indicators: {
      rsi,
      macd: macdObj.macd,
      signal: macdObj.signal,
      hist: macdObj.histogram,
      ema9,
      ema21,
      sma50,
      sma200,
      volatilityPct
    },
    horizons: {
      intraday: {
        score: intradayScore,
        action: intradayAction,
        target: Number(intradayTarget.toFixed(2)),
        stopLoss: Number(intradayStopLoss.toFixed(2)),
        signals: intradaySignals
      },
      tomorrow: {
        score: tomorrowConfidence,
        action: tomorrowAction,
        direction: tomorrowDirection,
        expectedRange: {
          high: Number(tomorrowHigh.toFixed(2)),
          low: Number(tomorrowLow.toFixed(2))
        },
        pivot: Number(pivot.toFixed(2)),
        resistance: Number(r1.toFixed(2)),
        support: Number(s1.toFixed(2)),
        breakoutTrigger: Number(breakoutTrigger.toFixed(2)),
        breakdownTrigger: Number(breakdownTrigger.toFixed(2)),
        signals: tomorrowSignals
      },
      medium: {
        score: mediumScore,
        action: mediumAction,
        target: Number(mediumTarget.toFixed(2)),
        stopLoss: Number(mediumStopLoss.toFixed(2)),
        signals: mediumSignals
      },
      long: {
        score: longScore,
        action: longAction,
        target: Number(longTarget.toFixed(2)),
        stopLoss: Number(longStopLoss.toFixed(2)),
        signals: longSignals
      }
    },
    historicalClosePrices: closePrices.slice(-30),
    historicalDates: historical.slice(-30).map(bar => {
      const d = new Date(bar.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }),
    sentimentScore
  };
}

// Generate realistic mock data for custom/sandbox symbols, or in case of api error
export function generateMockData(symbol = "AAPL") {
  const cleanSym = symbol.toUpperCase();
  
  // Base prices for popular tickers
  let basePrice = 150;
  let companyName = "Simulated Stock Tech";
  let pe = 24.5;
  let eps = 6.2;
  let divYield = 0.012;
  let roe = 0.22;
  let profitMargin = 0.18;

  if (cleanSym.includes("AAPL")) {
    basePrice = 182.50; companyName = "Apple Inc."; pe = 28.2; eps = 6.45; divYield = 0.005; roe = 1.45; profitMargin = 0.26;
  } else if (cleanSym.includes("TSLA")) {
    basePrice = 210.80; companyName = "Tesla Motors, Inc."; pe = 68.4; eps = 3.08; divYield = 0; roe = 0.19; profitMargin = 0.12;
  } else if (cleanSym.includes("MSFT")) {
    basePrice = 415.50; companyName = "Microsoft Corporation"; pe = 35.1; eps = 11.80; divYield = 0.007; roe = 0.38; profitMargin = 0.35;
  } else if (cleanSym.includes("NVDA")) {
    basePrice = 905.20; companyName = "NVIDIA Corporation"; pe = 72.8; eps = 12.40; divYield = 0.0002; roe = 0.54; profitMargin = 0.48;
  } else if (cleanSym.includes("RELIANCE")) {
    basePrice = 2850.00; companyName = "Reliance Industries Ltd."; pe = 26.5; eps = 108.5; divYield = 0.008; roe = 0.12; profitMargin = 0.09;
  } else if (cleanSym.includes("TCS")) {
    basePrice = 3920.00; companyName = "Tata Consultancy Services"; pe = 30.2; eps = 129.8; divYield = 0.024; roe = 0.46; profitMargin = 0.19;
  }

  // Generate historical stock bars (60 days)
  const historical = [];
  let currentPrice = basePrice;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90);

  // We want to generate a nice upward trend with some volatility
  const trendFactor = 0.0005; // general upward crawl
  const dailyVolatility = 0.015; // 1.5% daily swings
  
  for (let i = 0; i < 90; i++) {
    const isWeekend = startDate.getDay() === 0 || startDate.getDay() === 6;
    if (!isWeekend) {
      const changePercent = (Math.random() - 0.48) * dailyVolatility + trendFactor;
      const open = currentPrice;
      const close = currentPrice * (1 + changePercent);
      const high = Math.max(open, close) * (1 + Math.random() * 0.008);
      const low = Math.min(open, close) * (1 - Math.random() * 0.008);
      const volume = Math.floor(1000000 + Math.random() * 5000000);
      
      currentPrice = close;
      
      historical.push({
        date: new Date(startDate),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume
      });
    }
    startDate.setDate(startDate.getDate() + 1);
  }

  // Mock Quote Summary
  const change = (currentPrice - historical[historical.length - 2].close);
  const changePercent = (change / historical[historical.length - 2].close) * 100;
  
  const quote = {
    symbol: cleanSym,
    longName: companyName,
    regularMarketPrice: Number(currentPrice.toFixed(2)),
    regularMarketChange: Number(change.toFixed(2)),
    regularMarketChangePercent: Number(changePercent.toFixed(2)),
    financialCurrency: cleanSym.endsWith(".NS") || cleanSym.endsWith(".BO") ? "INR" : "USD",
    marketCap: Math.floor(currentPrice * 500000000),
    trailingPE: pe,
    trailingEps: eps,
    dividendYield: divYield,
    returnOnEquity: roe,
    profitMargins: profitMargin,
    fiftyTwoWeekHigh: Number((basePrice * 1.25).toFixed(2)),
    fiftyTwoWeekLow: Number((basePrice * 0.80).toFixed(2)),
    regularMarketVolume: Math.floor(2000000 + Math.random() * 4000000),
    revenueGrowth: 0.12 + Math.random() * 0.15
  };

  // Mock News Search
  const news = [
    {
      title: `${companyName} Unveils Next-Gen AI Integration at Global Summit`,
      description: `Shares of ${cleanSym} ticked higher following the announcements of their latest technology roadmap, aiming to expand digital market penetration. Analysts remain bullish.`,
      source: "Financial Times",
      pubDate: new Date()
    },
    {
      title: `${cleanSym} Stock Price Forecast: Can It Keep Running?`,
      description: `Market technicians study the immediate resistance levels. A breakout above current indicators could open target parameters, with short-term support forming strong.`,
      source: "MarketWatch",
      pubDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
    },
    {
      title: `Why ${companyName} is Considered a Dividend Powerhouse for Long-Term Portfolios`,
      description: `With robust cash flows and low debt leveraging, ${cleanSym} represents a cornerstone security for mutual funds and conservative pension plans.`,
      source: "Reuters",
      pubDate: new Date(Date.now() - 48 * 60 * 60 * 1000)
    },
    {
      title: `Securities Regulator Investigates Sector Pricing Ratios; ${cleanSym} Minimally Affected`,
      description: `Broad market indices faced minor intraday selloffs, but ${cleanSym} consolidated above critical moving averages, showing relative strength.`,
      source: "Bloomberg",
      pubDate: new Date(Date.now() - 72 * 60 * 60 * 1000)
    }
  ];

  return analyzeStock(quote, historical, news);
}
