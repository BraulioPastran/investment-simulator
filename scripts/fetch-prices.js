const fs = require('fs');
const https = require('https');

const DATA_FILE = 'data/prices.json';
const TICKERS_FILE = 'data/tickers.json';

// Base tickers that we always track
const BASE_TICKERS = ['VOO', 'VTI', 'SPY', 'QQQ', 'AAPL', 'MSFT', 'CCJ', 'NEE', 'VEA', 'VT'];

// Comprehensive list of tickers for autocomplete (loaded from Yahoo on first run)
const AUTOCOMPLETE_TICKERS = [
    // Tech
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'INTC',
    'CRM', 'ADBE', 'NFLX', 'PYPL', 'SHOP', 'SQ', 'UBER', 'LYFT', 'COIN', 'SNOW',
    'NOW', 'PLTR', 'NET', 'DDOG', 'SNAP', 'PINS', 'DOCU', 'ZM', 'SPOT', 'ROKU',
    'EA', 'TTWO', 'ATVI', 'WDAY', 'TEAM', 'FVRR', 'UPWK', 'GPRO', 'INTU', 'ADP',
    'FIS', 'FISV', 'GPN', 'PAYX', 'ADSK', 'PANW', 'CRWD', 'ZS', 'OKTA', 'SPLK',
    'HUBS', 'TWLO', 'MSTR', 'SAP', 'ORCL', 'IBM', 'QCOM', 'TXN', 'AVGO', 'MU',
    'LRCX', 'AMAT', 'KLAC', 'MPWR', 'ON', 'MRVL', 'CDNS', 'SNPS', 'FTNT', 'CHKP',
    'PANW', 'FFIV', 'AKAM', 'JNPR', 'HPQ', 'DELL', 'HP', 'HPE', 'ANET', 'CDEV',
    
    // Finance
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA', 'AXP', 'DFS', 'C', 'USB', 'PNC',
    'TFC', 'SCHW', 'COIN', 'MCO', 'SPGI', 'CME', 'ICE', 'BLK', 'VICI', 'WY',
    'AFL', 'MET', 'PRU', 'TRV', 'ALL', 'HIG', 'CB', 'AON', 'WLTW', 'MMC',
    'AJG', 'AIG', 'BRO', 'FISV', 'GL', 'HBAN', 'RF', 'KEY', 'USB', 'CBOE',
    
    // Healthcare
    'UNH', 'JNJ', 'PFE', 'ABBV', 'LLY', 'MRK', 'TMO', 'ABT', 'BMY', 'AMGN',
    'GILD', 'CVS', 'ISRG', 'MDT', 'SYK', 'ZTS', 'REGN', 'BIIB', 'MRNA', 'NVAX',
    'DHR', 'EW', 'VRTX', 'MRNA', 'BMT', 'TECH', 'IQV', 'IDXX', 'ALGN', 'HOLX',
    'DGX', 'LH', 'DVA', 'XRAY', 'INFN', 'OMCL', 'CERN', 'CPSI', 'MGLN', 'HSIC',
    
    // Consumer
    'PG', 'KO', 'PEP', 'MCD', 'SBUX', 'NKE', 'DIS', 'CMCSA', 'T', 'VZ', 'TMUS',
    'HD', 'LOW', 'WMT', 'TGT', 'COST', 'LULU', 'ROST', 'DG', 'DLTR', 'URBN',
    'GPS', 'AZO', 'ORLY', 'APOL', 'CPRT', 'KMX', 'GPC', 'SBH', 'ROST', 'TJX',
    'BURL', 'FL', 'ULTA', 'LZB', 'M', 'KSS', 'JWN', 'Macy\'s', 'DRI', 'CMG',
    
    // Industrial
    'BA', 'CAT', 'HON', 'UPS', 'FDX', 'RTX', 'GE', 'MMM', 'EMR', 'DE', 'CMI',
    'SWK', 'ITW', 'ETN', 'APH', 'PH', 'ROK', 'CARR', 'OTIS', 'WM', 'RSG',
    'FAST', 'PCAR', 'JCI', 'PWR', 'VRSN', 'CDNS', 'SNPS', 'TEL', 'FTV', 'AME',
    'GPN', 'XYL', 'LDOS', 'WAB', 'NDSN', 'IR', 'TT', 'TDG', 'LUV', 'DAL',
    
    // Energy
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'NEE', 'DUK',
    'SO', 'D', 'AEP', 'EXC', 'SRE', 'EIX', 'DOW', 'DD', 'LYB', 'APD',
    'SHW', 'PPG', 'ALB', 'FMC', 'CE', 'IFF', 'EMN', 'AVY', 'PKG', 'IP',
    
    // ETFs
    'VOO', 'VTI', 'SPY', 'QQQ', 'VEA', 'VWO', 'VT', 'BND', 'VNQ', 'XLE', 'XLV',
    'XLK', 'XLF', 'XLY', 'VGT', 'VHT', 'IWM', 'EFA', 'EWJ', 'EWZ', 'QQQ',
    'QQQM', 'VUG', 'VTV', 'VEA', 'VO', 'VB', 'SCHA', 'SCHB', 'SCHZ', 'SCHP',
    'VTIP', 'VGSH', 'VIG', 'VYM', 'VYMI', 'DVY', 'HDV', 'SPHD', 'SPYD', 'RSP',
    
    // Crypto
    'BTC-USD', 'ETH-USD', 'MSTR', 'COIN', 'MARA', 'RIOT', 'Hut 8', 'GBTC',
    
    // More popular
    'BRK.B', 'BRK.A', 'JPM', 'LLY', 'MA', 'HD', 'PG', 'UNH', 'NVDA', 'ABBV'
];

function formatDate(d) {
  return d.toISOString().split('T')[0];
}

function getLastFriday(d) {
  const day = d.getDay();
  const diff = day === 0 ? 2 : (day === 6 ? 1 : 0);
  const friday = new Date(d);
  friday.setDate(d.getDate() - diff);
  return friday;
}

function isLastDayOfMonth(d) {
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return formatDate(d) === formatDate(lastDay);
}

function isFriday(d) {
  return d.getDay() === 5;
}

function fetchYahoo(ticker, period1, period2, interval) {
  return new Promise((resolve) => {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=${interval}`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const timestamps = json?.chart?.result?.[0]?.timestamp || [];
          const closes = json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || [];
          const result = {};
          timestamps.forEach((ts, i) => {
            if (closes[i] !== null) {
              result[formatDate(new Date(ts * 1000))] = closes[i];
            }
          });
          resolve(result);
        } catch (e) {
          resolve({});
        }
      });
    }).on('error', () => resolve({}));
  });
}

// Fetch ticker info from Yahoo Finance
function fetchTickerInfo(ticker) {
  return new Promise((resolve) => {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const quote = json?.quoteResponse?.result?.[0];
          if (quote) {
            resolve({
              symbol: quote.symbol,
              name: quote.longName || quote.shortName || quote.symbol,
              exchange: quote.exchange || '',
              type: quote.quoteType || '',
              currency: quote.currency || 'USD'
            });
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

let data = { prices: {}, history: {} };
if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {}
}

let tickersData = { tickers: [], updated: null };
if (fs.existsSync(TICKERS_FILE)) {
  try {
    tickersData = JSON.parse(fs.readFileSync(TICKERS_FILE, 'utf8'));
  } catch (e) {}
}

// Ensure base tickers exist in prices
BASE_TICKERS.forEach(t => {
  if (!data.prices[t]) data.prices[t] = { current: null, previousClose: null, changePercent: null, updated: null };
  if (!data.history[t]) data.history[t] = { weekly: {}, monthly: {} };
});

const hasHistory = Object.values(data.history).some(h => Object.keys(h.weekly).length > 0 || Object.keys(h.monthly).length > 0);
const forceFullHistory = process.env.FORCE_FULL_HISTORY === 'true';
const now = new Date();
const currentDate = formatDate(now);

async function fetchTickerBatch(tickers) {
  const results = [];
  // Fetch in batches of 20
  for (let i = 0; i < tickers.length; i += 20) {
    const batch = tickers.slice(i, i + 20);
    const symbols = batch.join(',');
    try {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
      const resp = await new Promise((resolve, reject) => {
        https.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        }).on('error', () => resolve('{}'));
      });
      const json = JSON.parse(resp);
      const quotes = json?.quoteResponse?.result || [];
      quotes.forEach(q => {
        results.push({
          symbol: q.symbol,
          name: q.longName || q.shortName || q.symbol,
          exchange: q.exchange || '',
          type: q.quoteType || '',
          currency: q.currency || 'USD',
          currentPrice: q.regularMarketPrice || null,
          previousClose: q.chartPreviousClose || null,
          changePercent: q.regularMarketChangePercent || null
        });
      });
    } catch (e) {}
    // Small delay to avoid rate limiting
    if (i + 20 < tickers.length) await new Promise(r => setTimeout(r, 500));
  }
  return results;
}

async function main() {
  // Always update ticker list on force_full_history or first run
  if (!tickersData.tickers.length || forceFullHistory) {
    console.log('Building ticker list from Yahoo...');
    const tickerInfos = await fetchTickerBatch(AUTOCOMPLETE_TICKERS);
    tickersData.tickers = tickerInfos.filter(t => t.symbol);
    tickersData.updated = currentDate;
    console.log(`Found ${tickersData.tickers.length} tickers`);
    
    // Also fetch current prices for all tickers
    console.log('Fetching current prices for all tickers...');
    for (const ticker of tickersData.tickers) {
      if (ticker.currentPrice) {
        data.prices[ticker.symbol] = {
          current: ticker.currentPrice,
          previousClose: ticker.previousClose,
          changePercent: ticker.changePercent,
          updated: currentDate
        };
      }
    }
  }
  
  if (!hasHistory || forceFullHistory) {
    console.log('Downloading full 15-year history for base tickers...');
    
    const yearAgo = new Date(now);
    yearAgo.setFullYear(yearAgo.getFullYear() - 15);
    const period1 = Math.floor(yearAgo.getTime() / 1000);
    const period2 = Math.floor(now.getTime() / 1000);
    
    for (const ticker of BASE_TICKERS) {
      console.log(`Fetching ${ticker}...`);
      const hist = await fetchYahoo(ticker, period1, period2, '1d');
      const sortedDates = Object.keys(hist).sort();
      
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oneYearAgoStr = formatDate(oneYearAgo);
      
      const weekly = {};
      const monthly = {};
      
      sortedDates.forEach(date => {
        if (date >= oneYearAgoStr) {
          if (isFriday(new Date(date))) {
            weekly[date] = hist[date];
          }
        }
        if (isLastDayOfMonth(new Date(date))) {
          monthly[date] = hist[date];
        }
      });
      
      data.history[ticker] = { weekly, monthly };
      if (!data.prices[ticker].current && sortedDates.length) {
        data.prices[ticker] = {
          current: hist[sortedDates[sortedDates.length - 1]],
          previousClose: sortedDates.length > 1 ? hist[sortedDates[sortedDates.length - 2]] : null,
          changePercent: null,
          updated: currentDate
        };
      }
      
      console.log(`  ${ticker}: ${Object.keys(weekly).length} weekly, ${Object.keys(monthly).length} monthly`);
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));
    }
  } else {
    console.log('Incremental update...');
    
    // Update base tickers prices
    for (const ticker of BASE_TICKERS) {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
        const resp = await new Promise((resolve, reject) => {
          https.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0',
              'Accept': 'application/json'
            }
          }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
          }).on('error', () => resolve('{}'));
        });
        const json = JSON.parse(resp);
        const meta = json?.chart?.result?.[0]?.meta;
        if (meta) {
          data.prices[ticker] = {
            current: meta.regularMarketPrice,
            previousClose: meta.chartPreviousClose || meta.previousClose,
            changePercent: meta.regularMarketChangePercent,
            updated: currentDate
          };
        }
      } catch (e) {
        console.error(`Error ${ticker}: ${e.message}`);
      }
      await new Promise(r => setTimeout(r, 500));
    }
    
    // Update current prices for autocomplete tickers too
    if (tickersData.tickers.length) {
      console.log('Updating prices for all tracked tickers...');
      const batchSize = 20;
      for (let i = 0; i < tickersData.tickers.length; i += batchSize) {
        const batch = tickersData.tickers.slice(i, i + batchSize);
        const symbols = batch.map(t => t.symbol).join(',');
        try {
          const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;
          const resp = await new Promise((resolve) => {
            https.get(url, {
              headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
            }, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => resolve(data));
            }).on('error', () => resolve('{}'));
          });
          const json = JSON.parse(resp);
          const quotes = json?.quoteResponse?.result || [];
          quotes.forEach(q => {
            if (q.regularMarketPrice) {
              data.prices[q.symbol] = {
                current: q.regularMarketPrice,
                previousClose: q.chartPreviousClose || null,
                changePercent: q.regularMarketChangePercent || null,
                updated: currentDate
              };
            }
          });
        } catch (e) {}
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    // Add current price to weekly if Friday, monthly if last day of month
    for (const ticker of BASE_TICKERS) {
      if (data.prices[ticker]?.current) {
        if (isFriday(now)) {
          data.history[ticker].weekly[currentDate] = data.prices[ticker].current;
        }
        if (isLastDayOfMonth(now)) {
          data.history[ticker].monthly[currentDate] = data.prices[ticker].current;
        }
      }
    }
  }
  
  data.updated = currentDate;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  fs.writeFileSync(TICKERS_FILE, JSON.stringify(tickersData, null, 2));
  console.log(`Saved! Updated: ${currentDate}`);
  console.log(`Tickers: ${tickersData.tickers.length}, Prices tracked: ${Object.keys(data.prices).length}`);
}

main().catch(console.error);