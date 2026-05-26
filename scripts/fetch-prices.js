const fs = require('fs');
const https = require('https');

const DATA_FILE = 'data/prices.json';
const TICKERS_FILE = 'data/tickers.json';

// Base tickers with full history (15 years)
const BASE_TICKERS = ['VOO', 'VTI', 'SPY', 'QQQ', 'AAPL', 'MSFT', 'CCJ', 'NEE', 'VEA', 'VT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA'];

// Comprehensive ticker list for autocomplete (no historical data, just for search)
// Covers: S&P 500 majors, major ETFs (US + EU + UK), crypto, major indices
const AUTOCOMPLETE_TICKERS = [
    // ========== S&P 500 / MAJOR US EQUITIES ==========
    // Tech
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'INTC',
    'CRM', 'ADBE', 'NFLX', 'PYPL', 'SHOP', 'SQ', 'UBER', 'LYFT', 'COIN', 'SNOW',
    'NOW', 'PLTR', 'NET', 'DDOG', 'SNAP', 'DOCU', 'ZM', 'SPOT', 'ROKU', 'TEAM',
    'WDAY', 'PANW', 'CRWD', 'ZS', 'OKTA', 'HUBS', 'TWLO', 'MSTR', 'SAP', 'ORCL',
    'IBM', 'QCOM', 'TXN', 'AVGO', 'MU', 'AMAT', 'LRCX', 'KLAC', 'SNPS', 'CDNS',
    'INTU', 'ADP', 'FIS', 'FISV', 'GPN', 'PAYX', 'ADSK', 'FFIV', 'CDW',
    'EA', 'TTWO', 'ATVI', 'NTDOY', 'UBS', 'NXGL',
    // Finance
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA', 'AXP', 'DFS', 'C', 'USB', 'PNC',
    'TFC', 'SCHW', 'MCO', 'SPGI', 'CME', 'ICE', 'BLK', 'VICI', 'WY', 'AFL',
    'MET', 'PRU', 'TRV', 'ALL', 'HIG', 'CB', 'AON', 'WLTW', 'MMC', 'BRO',
    'RF', 'KEY', 'HBAN', 'CFG', 'STT', 'TROW', 'NDAQ', 'FND',
    // Healthcare
    'UNH', 'JNJ', 'PFE', 'ABBV', 'LLY', 'MRK', 'TMO', 'ABT', 'BMY', 'AMGN',
    'GILD', 'CVS', 'ISRG', 'MDT', 'SYK', 'ZTS', 'REGN', 'BIIB', 'MRNA', 'NVAX',
    'DHR', 'EW', 'VRTX', 'IQV', 'IDXX', 'ALGN', 'HOLX', 'DGX', 'LH', 'XRAY',
    'HCA', 'CNC', 'HUM', 'CI', 'MOH', 'OMC', 'BACH', 'RVTY', 'TECH', 'BOLT',
    // Consumer
    'PG', 'KO', 'PEP', 'MCD', 'SBUX', 'NKE', 'DIS', 'CMCSA', 'T', 'VZ', 'TMUS',
    'HD', 'LOW', 'WMT', 'TGT', 'COST', 'LULU', 'ROST', 'DG', 'DLTR', 'URBN',
    'GPS', 'AZO', 'ORLY', 'CPRT', 'KMX', 'GPC', 'SBH', 'TJX', 'BURL', 'FL',
    'ULTA', 'M', 'KSS', 'JWN', 'DRI', 'CMG', 'WYNN', 'MGM', 'CZR', 'LVS',
    'HAS', 'MAT', 'IPG', 'OMC', 'NWS', 'NWSA',
    // Industrial
    'BA', 'CAT', 'HON', 'UPS', 'FDX', 'RTX', 'GE', 'MMM', 'EMR', 'DE', 'CMI',
    'SWK', 'ITW', 'ETN', 'APH', 'PH', 'ROK', 'CARR', 'OTIS', 'WM', 'RSG',
    'FAST', 'PCAR', 'JCI', 'PWR', 'VRSN', 'FTV', 'AME', 'XYL', 'LDOS', 'WAB',
    'NDSN', 'IR', 'TT', 'TDG', 'LUV', 'DAL', 'UAL', 'AAL', 'ALK', 'SAVE',
    'CSX', 'NSC', 'UNP', 'KMB', 'PPG', 'SHW', 'AVY', 'PKG', 'CE', 'IFF',
    // Energy
    'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'NEE', 'DUK',
    'SO', 'D', 'AEP', 'EXC', 'SRE', 'EIX', 'DOW', 'DD', 'LYB', 'APD', 'FANG',
    'HAL', 'BKR', 'DVN', 'PXD', 'MRO', 'APA', 'CTRA',
    // Materials / Real Estate
    'LIN', 'APD', 'SHW', 'PPG', 'AVY', 'PKG', 'IP', 'GLD', 'SLV', ' copper', 'DBO',
    'AMT', 'PLD', 'CCI', 'EQIX', 'SPG', 'O', 'WELL', 'DLR', 'AVB', 'EQR',
    // Utilities
    'NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC', 'SRE', 'EIX', 'ED', 'PEG', 'ES',
    'AWK', 'NI', 'ETR', 'AEE', 'CMS', 'ATO', 'CNP', 'DTE', 'FE', 'EVRG',
    // ========== MAJOR ETFs ==========
    // US Broad Market
    'VOO', 'VTI', 'SPY', 'QQQ', 'VWO', 'VT', 'IWM', 'EFA', 'EEM', 'VEA',
    'IVV', 'VTSAX', 'FZROX', 'FZILX', 'FNDAX', 'SPHD', 'SPYD', 'RSP', 'IVW',
    // US Sectors
    'VGT', 'VHT', 'VFH', 'VIS', 'VCR', 'VDC', 'VDE', 'VAW', 'VGSG', 'VOX',
    'XLK', 'XLF', 'XLV', 'XLE', 'XLY', 'XLP', 'XLI', 'XLB', 'XLRE', 'XLC',
    'QQQM', 'VUG', 'VTV', 'VO', 'VB', 'VNQ', 'BND', 'AGG', 'SCHD',
    // International ETFs
    'VEA', 'VWO', 'VSS', 'VYMI', 'DGA', 'EFG', 'EFA', 'SCZ', 'EUFN', 'ESGE',
    'EWJ', 'EWZ', 'EWC', 'EIDO', 'EILV', 'EPOL', 'THD', 'IDV',
    // European / UK ETFs
    'VUSA', 'CSPX', 'IUSE', 'VWCE', 'SWRD', 'EACP', 'UEMS',
    'EQQQ', 'IEAA', 'ISF', 'SLXX', 'VUAA', 'CUKS',
    // Bond / Fixed Income ETFs
    'BND', 'AGG', 'GOVT', 'TLT', 'IEF', 'SHY', 'TIP', 'VCIT', 'VCLT', 'VGLT',
    'BSV', 'BIV', 'MUB', 'MUNI', 'PZA', 'ITM', 'MLN', 'RYLD',
    // Thematic ETFs
    'ARKK', 'ARKQ', 'ARKF', 'ARKW', 'ARKB', 'GBTC', 'IBIT', 'FBTC', 'MINI',
    'COIN', 'MARA', 'RIOT', 'HUT', 'BITO', 'BLOK', 'EMFQ', 'HERO', 'KSA',
    // ========== CRYPTO ==========
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'DOGE-USD',
    'DOT-USD', 'MATIC-USD', 'LINK-USD', 'AVAX-USD', 'UNI-USD', 'ATOM-USD',
    'LTC-USD', 'BCH-USD', 'XLM-USD', 'ALGO-USD', 'VET-USD', 'FIL-USD', 'ICP-USD',
    'MSTR', 'COIN', 'MARA', 'RIOT', 'HUT', 'BLOK',
    // ========== UK / EU STOCKS ==========
    'SHEL.L', 'BP.L', 'HSBA.L', 'ULVR.L', 'BATS.L', 'RIO.L', 'AZN.L', 'NESN.SW',
    'ASML.AS', 'ENEL.MI', 'ISP.MI', 'UBS', 'NOKIA', 'ERIC', 'TELEFONICA',
    // ========== ADDITIONAL S&P 500 / MAJORS ==========
    'BRK.B', 'BRK.A', 'LLY', 'HD', 'UNH', 'ABBV', 'PFE', 'MRK', 'VZ', 'T',
    'INTC', 'CMCSA', 'WMT', 'KO', 'PEP', 'MCD', 'COST', 'DIS', 'NKE', 'SBUX',
    'GE', 'CAT', 'RTX', 'BA', 'HON', 'UPS', 'DE', 'MMM', 'EMR', 'LMT', 'NOC',
    'GD', 'LHX', 'HII', 'AVGO', 'QCOM', 'TXN', 'AVGO', 'MU', 'AMAT', 'AMZN',
    'FBAZM', 'PCG', 'EXC', 'ED', 'AEP', 'DUK', 'SO', 'NEE', 'D',
    'PL', 'SMCI', 'ARM', 'CRWD', 'ON', 'TSM', 'BABA', 'TCEHY', '9988.HK',
    'INDA', 'KWEB', 'MCHI', 'ASHR', 'EEM', 'IEMG', 'SIXZ', 'PDBC', 'DJP'
];

function formatDate(d) {
  return d.toISOString().split('T')[0];
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

// Try to get ticker info from Yahoo using v1/search API
function fetchTickerInfo(ticker) {
  return new Promise((resolve) => {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=5&newsCount=0&enableFuzzyQuery=false`;
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
          // Find exact symbol match in results
          const quote = json?.quotes?.find(q => q.symbol === ticker);
          if (quote) {
            resolve({
              symbol: quote.symbol,
              name: quote.longname || quote.shortname || quote.symbol,
              exchange: quote.exchange || '',
              type: quote.quoteType || 'EQUITY',
              currency: 'USD'
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

async function main() {
  // Always rebuild ticker list
  console.log('Building ticker list...');
  
  // Try to get names from Yahoo for a subset of tickers
  const tickerInfos = [];
  const sampleTickers = AUTOCOMPLETE_TICKERS.slice(0, 100); // Check first 100 to get names
  
  for (const ticker of sampleTickers) {
    try {
      const info = await fetchTickerInfo(ticker);
      if (info) {
        tickerInfos.push(info);
      } else {
        // Fallback: use ticker symbol as name
        tickerInfos.push({ symbol: ticker, name: ticker, exchange: '', type: 'EQUITY', currency: 'USD' });
      }
    } catch (e) {
      // Fallback: use ticker symbol as name
      tickerInfos.push({ symbol: ticker, name: ticker, exchange: '', type: 'EQUITY', currency: 'USD' });
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Add remaining tickers without Yahoo lookup (just use symbol as name)
  for (const ticker of AUTOCOMPLETE_TICKERS.slice(100)) {
    tickerInfos.push({ symbol: ticker, name: ticker, exchange: '', type: 'EQUITY', currency: 'USD' });
  }
  
  tickersData.tickers = tickerInfos;
  tickersData.updated = currentDate;
  console.log(`Built ticker list with ${tickersData.tickers.length} tickers`);
  
  console.log('Fetching historical data for all tickers...');

  const fifteenYearsAgo = new Date(now);
  fifteenYearsAgo.setFullYear(fifteenYearsAgo.getFullYear() - 15);
  const twoYearsAgo = new Date(now);
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const period1 = Math.floor(fifteenYearsAgo.getTime() / 1000);
  const period2 = Math.floor(now.getTime() / 1000);

  for (const tickerInfo of tickersData.tickers) {
    const ticker = tickerInfo.symbol;
    if (!data.prices[ticker]) data.prices[ticker] = { current: null, previousClose: null, changePercent: null, updated: null };
    if (!data.history[ticker]) data.history[ticker] = { weekly: {}, monthly: {} };

    console.log(`Fetching ${ticker} (15-year history)...`);

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
    if (sortedDates.length) {
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
  
  data.updated = currentDate;
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  fs.writeFileSync(TICKERS_FILE, JSON.stringify(tickersData, null, 2));
  console.log(`Saved! Updated: ${currentDate}`);
  console.log(`Tickers: ${tickersData.tickers.length}, Prices tracked: ${Object.keys(data.prices).length}`);
}

main().catch(console.error);