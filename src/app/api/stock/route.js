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
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 90);

    // Fetch quote, historical prices, and news concurrently in parallel
    const [quoteResult, historicalResult, searchResult] = await Promise.allSettled([
      yahooFinance.quote(cleanSymbol),
      yahooFinance.historical(cleanSymbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      }),
      yahooFinance.search(cleanSymbol)
    ]);

    if (quoteResult.status === 'rejected') {
      throw new Error(`Invalid stock quote returned for symbol: ${cleanSymbol} (${quoteResult.reason.message})`);
    }
    if (historicalResult.status === 'rejected') {
      throw new Error(`No historical daily price data found for symbol: ${cleanSymbol} (${historicalResult.reason.message})`);
    }

    const quote = quoteResult.value;
    const historical = historicalResult.value;

    if (!quote || (!quote.regularMarketPrice && !quote.bid)) {
      throw new Error(`Invalid stock quote data structure returned for symbol: ${cleanSymbol}`);
    }
    if (!historical || historical.length === 0) {
      throw new Error(`Empty historical daily price array returned for symbol: ${cleanSymbol}`);
    }

    const news = searchResult.status === 'fulfilled' ? (searchResult.value.news || []) : [];

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
