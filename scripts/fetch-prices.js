const fs = require('fs');
const https = require('https');

const TICKERS = ['VOO', 'VTI', 'SPY', 'QQQ', 'AAPL', 'MSFT', 'CCJ', 'NEE', 'VEA', 'VT'];
const DATA_FILE = 'data/prices.json';
const PORTFOLIO_FILE = 'data/portfolio.json';

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
  const day = d.getDay();
  return day === 5;
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

let data = { prices: {}, history: {} };
if (fs.existsSync(DATA_FILE)) {
  try {
    data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {}
}

TICKERS.forEach(t => {
  if (!data.prices[t]) data.prices[t] = { current: null, previousClose: null, changePercent: null, updated: null };
  if (!data.history[t]) data.history[t] = { weekly: {}, monthly: {} };
});

const hasHistory = Object.values(data.history).some(h => Object.keys(h.weekly).length > 0 || Object.keys(h.monthly).length > 0);
const forceFullHistory = process.env.FORCE_FULL_HISTORY === 'true';
const now = new Date();
const currentDate = formatDate(now);

async function main() {
  if (!hasHistory || forceFullHistory) {
    console.log('First run or forced - downloading full 15-year history...');
    
    const yearAgo = new Date(now);
    yearAgo.setFullYear(yearAgo.getFullYear() - 15);
    const period1 = Math.floor(yearAgo.getTime() / 1000);
    const period2 = Math.floor(now.getTime() / 1000);
    
    for (const ticker of TICKERS) {
      console.log(`Fetching ${ticker}...`);
      const hist = await fetchYahoo(ticker, period1, period2, '1d');
      const sortedDates = Object.keys(hist).sort();
      
      // One year ago for weekly, older for monthly
      const oneYearAgo = new Date(now);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const oneYearAgoStr = formatDate(oneYearAgo);
      
      const weekly = {};
      const monthly = {};
      
      sortedDates.forEach(date => {
        if (date >= oneYearAgoStr) {
          // Weekly (Fridays) for last year
          if (isFriday(new Date(date))) {
            weekly[date] = hist[date];
          }
        }
        // Monthly (last day of month) for everything
        if (isLastDayOfMonth(new Date(date))) {
          monthly[date] = hist[date];
        }
      });
      
      data.history[ticker] = { weekly, monthly };
      data.prices[ticker] = { current: hist[sortedDates.pop()], updated: currentDate };
      
      console.log(`  ${ticker}: ${Object.keys(weekly).length} weekly, ${Object.keys(monthly).length} monthly`);
    }
  } else {
    console.log('Incremental update...');
    
    // Fetch current prices
    for (const ticker of TICKERS) {
      try {
        const resp = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
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
        }
      } catch (e) {
        console.error(`Error ${ticker}: ${e.message}`);
      }
    }
    
    // Add current price to weekly if Friday, monthly if last day of month
    for (const ticker of TICKERS) {
      if (data.prices[ticker].current) {
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
  console.log(`Saved! Updated: ${currentDate}`);
}

main().catch(console.error);