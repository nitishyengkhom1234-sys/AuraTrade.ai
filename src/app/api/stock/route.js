import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import { analyzeStock, generateMockData } from '@/lib/analyzer';
const yahooFinance = new YahooFinance();

// Attempt to suppress unnecessary console notices from yahoo-finance2
try {
  yahooFinance.suppressNotices(['yahooSurvey']);
} catch (e) {
  // Ignore
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { success: false, error: 'Ticker symbol is required' },
      { status: 400 }
    );
  }

  const cleanSymbol = symbol.trim().toUpperCase();

  try {
    // 1. Fetch core quote
    const quote = await yahooFinance.quote(cleanSymbol);
    if (!quote || (!quote.regularMarketPrice && !quote.bid)) {
      throw new Error(`Invalid stock quote returned for symbol: ${cleanSymbol}`);
    }

    // 2. Fetch historical prices (last 90 days to compute standard 50-day SMA, RSI, MACD, etc.)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 90);

    const historical = await yahooFinance.historical(cleanSymbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });

    if (!historical || historical.length === 0) {
      throw new Error(`No historical daily price data found for symbol: ${cleanSymbol}`);
    }

    // 3. Fetch recent news and related stories
    let news = [];
    try {
      const searchResponse = await yahooFinance.search(cleanSymbol);
      news = searchResponse.news || [];
    } catch (newsErr) {
      console.warn(`[News fetch failed for ${cleanSymbol}]:`, newsErr.message);
      // Fail silently for news, we can still perform technical calculations
    }

    // Run stock scoring analysis engine
    const analysis = analyzeStock(quote, historical, news);

    return NextResponse.json({
      success: true,
      isSimulated: false,
      data: analysis
    });

  } catch (error) {
    console.error(`[API Error for Ticker ${cleanSymbol}] Falling back to simulation. Reason:`, error.message);
    
    // High-fidelity fallback simulated analysis
    try {
      const mockData = generateMockData(cleanSymbol);
      return NextResponse.json({
        success: true,
        isSimulated: true,
        warning: `Could not retrieve live data. Displaying real-time simulated sandbox values. (Error: ${error.message})`,
        data: mockData
      });
    } catch (mockError) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch data and generate simulation: ${mockError.message}` },
        { status: 500 }
      );
    }
  }
}
