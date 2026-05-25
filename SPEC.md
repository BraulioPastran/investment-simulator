# SPEC.md - Investment Simulator Specification

## Overview
Investment portfolio simulator using real market data from Yahoo Finance. Users can track fictional purchases and simulate hypothetical investments on past dates.

**Live:** https://brauliopastran.github.io/inversion-simulator/  
**Repo:** https://github.com/BraulioPastran/inversion-simulator

---

## Current Status (2026-05-25)

### ✅ Working Features
- GitHub Actions workflow running every 15 minutes
- 15 years of historical data (weekly + monthly)
- Portfolio management via localStorage
- Simple purchase form (Date + Ticker + Amount)
- Ticker autocomplete (with fallback list)
- Hypothetical simulator
- Dark theme UI with Chart.js charts

### 🔴 Known Issues
1. **tickers.json is empty**: GitHub Actions script `fetch-prices.js` runs but `data/tickers.json` ends up with `"tickers": []`. The Yahoo API call to `v7/finance/quote` is not returning ticker info properly.
   - **Impact**: Ticker autocomplete falls back to hardcoded list (works but generic names)
   - **Fix needed**: Debug why Yahoo API returns empty results for ticker info

### ⚠️ Pending / TODO
- Debug `fetch-prices.js` to properly fetch ticker names from Yahoo
- Consider adding more base tickers with full history
- Add dividend tracking (future)

---

## Data Architecture

### data/prices.json
```json
{
  "prices": {
    "TICKER": {
      "current": 123.45,
      "previousClose": 120.00,
      "changePercent": 2.87,
      "updated": "2026-05-25"
    }
  },
  "history": {
    "TICKER": {
      "weekly": { "2026-05-23": 123.45 },
      "monthly": { "2025-01-31": 115.00 }
    }
  },
  "updated": "2026-05-25"
}
```

### data/tickers.json (CURRENTLY EMPTY - ISSUE)
```json
{
  "tickers": [
    { "symbol": "AAPL", "name": "Apple Inc.", "exchange": "NASDAQ", "type": "EQUITY", "currency": "USD" }
  ],
  "updated": "2026-05-25"
}
```

**Fallback:** If `tickers.json` is empty, the web app uses a hardcoded list of 100+ tickers from `FALLBACK_TICKERS` in `index.html`.

---

## Base Tickers (10 with Full History)
VOO, VTI, SPY, QQQ, AAPL, MSFT, CCJ, NEE, VEA, VT

---

## User Flows

### Add Purchase
1. User clicks "+ Add Purchase"
2. User enters: Date, Ticker (autocomplete), Amount (€)
3. App looks up price at that date from `history[TICKER]`
4. Calculates shares: `amount / price`
5. Saves to localStorage

### Hypothetical Simulation
1. User enters: Ticker, Date (past), Amount (€)
2. App looks up historical price at that date
3. Compares with current price
4. Displays gain/loss percentage

---

## GitHub Actions

### Environment Variables
- `FORCE_FULL_HISTORY=true` — Force 15-year history re-download

### Cron Schedule
Every 15 minutes: `*/15 * * * *`

### Outputs
- `data/prices.json` — Updated prices + history
- `data/tickers.json` — Ticker list for autocomplete

---

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- localStorage required for portfolio
- JavaScript required

---

## Limitations
- Prices in USD (no EUR conversion)
- No dividends included
- No fees/commissions
- Closing prices only (no intraday)
- Maximum 15 years historical data

---

## Next Steps for Fix

1. **Debug fetch-prices.js**:
   - Add logging to see what Yahoo API returns
   - Check if `v7/finance/quote` endpoint requires authentication
   - Consider using `v1/finance/search` instead for ticker search

2. **Alternative approaches**:
   - Pre-populate tickers.json manually with known tickers
   - Use a different data source for ticker info
   - Accept generic names and improve fallback list

---

_Last updated: 2026-05-25_