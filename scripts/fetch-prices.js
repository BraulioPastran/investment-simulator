const fs = require('fs');
const https = require('https');

const TICKERS = ['VOO', 'VTI', 'SPY', 'QQQ', 'AAPL', 'MSFT', 'CCJ', 'NEE', 'VEA', 'VT'];
const DATA_FILE = 'data/prices.json';

// Date utilities
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

// Yahoo Finance fetch
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
          console.error(`Error fetching ${ticker}: ${e.message}`);
          resolve({});
        }
      });
    }).on('error', () => {
      console.error(`Network error for ${ticker}`);
      resolve({});
    });
  });
}

// Load existing data
let data = { prices: {}, history: {} };
if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.log('Creating new data file');
  }
}

// Initialize structure
TICKERS.forEach(t => {
  if (!data.prices[t]) data.prices[t] = { current: null, previousClose: null, changePercent: null, updated: null };
  if (!data.history[t]) data.history[t] = { daily: {}, weekly: {}, monthly: {} };
});

// Check if first run (no history)
const hasHistory = Object.values(data.history).some(h => Object.keys(h.daily).length > 0);
const forceFullHistory = process.env.FORCE_FULL_HISTORY === 'true';

// Fetch current prices
console.log('Fetching current prices...');
const now = new Date();
const currentDate = formatDate(now);

async function fetchCurrentPrices() {
  for (const ticker of TICKERS) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      const json = await resp.json();
      const meta = json?.chart?.result?.[0]?.meta;
      if (meta) {
        data.prices[ticker] = {
          current: meta.regularMarketPrice,
          previousClose: meta.chartPreviousClose || meta.previousClose,
          changePercent: meta.regularMarketChangePercent,
          updated: currentDate
        };
        console.log(`${ticker}: ${meta.regularMarketPrice}`);
      }
    } catch (e) {
      console.error(`Error fetching ${ticker}: ${e.message}`);
    }
  }
}

// Fetch and merge history
async function fetchHistory() {
  const yearAgo = new Date(now);
  yearAgo.setFullYear(yearAgo.getFullYear() - 15);
  const period1 = Math.floor(yearAgo.getTime() / 1000);
  const period2 = Math.floor(now.getTime() / 1000);

  for (const ticker of TICKERS) {
    console.log(`Fetching 15-year history for ${ticker}...`);
    const hist = await fetchYahoo(ticker, period1, period2, '1d');
    
    // Get existing daily data
    const existingDaily = data.history[ticker].daily;
    
    // Merge new data
    Object.keys(hist).forEach(date => {
      existingDaily[date] = hist[date];
    });
    
    // Rebuild weekly (Fridays)
    const weekly = {};
    Object.keys(existingDaily).sort().forEach(date => {
      const d = new Date(date);
      const friday = getLastFriday(d);
      const fridayStr = formatDate(friday);
      if (!weekly[fridayStr] || date > weekly[fridayStr]) {
        weekly[fridayStr] = existingDaily[date];
      }
    });
    data.history[ticker].weekly = weekly;
    
    // Rebuild monthly (last day of month)
    const monthly = {};
    Object.keys(existingDaily).sort().forEach(date => {
      if (isLastDayOfMonth(new Date(date))) {
        monthly[date] = existingDaily[date];
      }
    });
    data.history[ticker].monthly = monthly;
    
    console.log(`${ticker}: ${Object.keys(existingDaily).length} daily, ${Object.keys(weekly).length} weekly, ${Object.keys(monthly).length} monthly`);
  }
}

async function main() {
  if (!hasHistory || forceFullHistory) {
    console.log('First run or forced - downloading full 15-year history...');
    await fetchHistory();
  } else {
    console.log('Incremental update - fetching current prices only');
    await fetchCurrentPrices();
    
    // Add today to daily if market is open
    for (const ticker of TICKERS) {
      if (data.prices[ticker].current) {
        data.history[ticker].daily[currentDate] = data.prices[ticker].current;
        
        // Update weekly (if Friday)
        const friday = getLastFriday(now);
        const fridayStr = formatDate(friday);
        if (now.getDay() === 5 || forceFullHistory) {
          data.history[ticker].weekly[fridayStr] = data.prices[ticker].current;
        }
        
        // Update monthly (if last day of month)
        if (isLastDayOfMonth(now) || forceFullHistory) {
          data.history[ticker].monthly[currentDate] = data.prices[ticker].current;
        }
      }
    }
  }
  
  data.updated = currentDate;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  console.log(`Saved to ${DATA_FILE}`);
}

main().catch(console.error);