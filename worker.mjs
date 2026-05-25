export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const ticker = url.searchParams.get('ticker');
    const period1 = url.searchParams.get('period1');
    const period2 = url.searchParams.get('period2');
    const interval = url.searchParams.get('interval') || '1d';
    
    if (!ticker) {
      return new Response(JSON.stringify({ error: 'Missing ticker param' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
    
    // Build Yahoo Finance URL
    let yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&includePrePost=false`;
    if (period1 && period2) {
      yahooUrl += `&period1=${period1}&period2=${period2}`;
    } else {
      yahooUrl += '&range=1d';
    }
    
    try {
      const resp = await fetch(yahooUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      
      if (!resp.ok) {
        return new Response(JSON.stringify({ 
          error: 'Yahoo Finance error', 
          status: resp.status,
          meta: { symbol: ticker, price: null, change: null }
        }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
      
      const data = await resp.json();
      const meta = data?.chart?.result?.[0]?.meta;
      
      const result = {
        symbol: ticker,
        price: meta?.regularMarketPrice || null,
        previousClose: meta?.chartPreviousClose || meta?.previousClose || null,
        change: meta?.regularMarketChangePercent || null,
        timestamp: meta?.regularMarketTime || null
      };
      
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
      
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message, symbol: ticker }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  }
};
