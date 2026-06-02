import { NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();

const POPULAR_PRESETS = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Motors, Inc.', exchange: 'NASDAQ', sector: 'Automotive' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Semiconductors' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', exchange: 'NASDAQ', sector: 'E-commerce' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', sector: 'Internet' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', exchange: 'NSE', sector: 'Conglomerate' },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services', exchange: 'NSE', sector: 'IT Services' },
  { symbol: 'INFY.NS', name: 'Infosys Limited', exchange: 'NSE', sector: 'IT Services' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', exchange: 'NSE', sector: 'Banking' }
];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query || query.trim().length < 2) {
    // Return popular presets if query is short or empty
    return NextResponse.json({
      success: true,
      results: POPULAR_PRESETS
    });
  }

  const cleanQuery = query.trim().toLowerCase();

  try {
    const searchResponse = await yahooFinance.search(cleanQuery);
    
    // Parse quotes
    const results = (searchResponse.quotes || [])
      .filter(item => item.quoteType === 'EQUITY' || item.isYahooFinance)
      .slice(0, 8)
      .map(item => ({
        symbol: item.symbol,
        name: item.longname || item.shortname || item.name || '',
        exchange: item.exchange || '',
        sector: item.sector || 'Equity'
      }));

    return NextResponse.json({
      success: true,
      results: results.length > 0 ? results : POPULAR_PRESETS.filter(p => 
        p.symbol.toLowerCase().includes(cleanQuery) || 
        p.name.toLowerCase().includes(cleanQuery)
      )
    });

  } catch (error) {
    console.error(`[Search API Error for query: ${cleanQuery}]:`, error.message);
    
    // Filter presets
    const filteredPresets = POPULAR_PRESETS.filter(item => 
      item.symbol.toLowerCase().includes(cleanQuery) || 
      item.name.toLowerCase().includes(cleanQuery)
    );

    return NextResponse.json({
      success: true,
      isSimulated: true,
      results: filteredPresets.length > 0 ? filteredPresets : POPULAR_PRESETS
    });
  }
}
