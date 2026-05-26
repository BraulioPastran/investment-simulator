# 📈 Investment Simulator

A web-based investment portfolio simulator that lets you practice investing with fictional money using real market data.

**Live Demo:** https://brauliopastran.github.io/inversion-simulator/

---

## Features

### 🎯 Portfolio Management
- Add/Edit/Delete purchases directly from the web UI
- Only three inputs needed: **Date** + **Ticker** + **Amount (€)** — the app auto-calculates shares and price per share
- All data stored locally in your browser (localStorage) — no account needed

### 📊 Real Market Data
- Historical prices from Yahoo Finance (15 years of data for 15 base tickers)
- Weekly prices for the last year, monthly for older history
- Auto-updated daily via GitHub Actions

### 🔮 Hypothetical Simulator
- Select any ticker + date from the last 15 years
- See what your investment would be worth today

### 🔍 Live Ticker Search
- Search any ticker from a comprehensive list of 537+ tickers
- Real-time autocomplete as you type by symbol or company name
- Works offline with built-in fallback ticker list

---

## Quick Start

1. Open [https://brauliopastran.github.io/inversion-simulator/](https://brauliopastran.github.io/inversion-simulator/)
2. Click **"+ Add Purchase"**
3. Enter Date, search for a Ticker, and enter Amount in euros
4. The app calculates shares and buy price automatically
5. Track your portfolio value in real-time

---

## How It Works

```
Yahoo Finance API → GitHub Actions → data/prices.json + data/tickers.json → GitHub Pages → Your Browser
                                                                                      ↑
                                                                    localStorage (portfolio)
```

1. **GitHub Actions** fetches prices and ticker info from Yahoo Finance
2. Commits `data/prices.json` (prices + history) and `data/tickers.json` (ticker list)
3. **GitHub Pages** serves JSON files publicly
4. **Web App** loads data and displays your portfolio
5. **Your Portfolio** is stored in browser localStorage

---

## Project Structure

```
inversion-simulator/
├── index.html              # Main web app
├── data/
│   ├── prices.json        # Historical price data (auto-generated)
│   └── tickers.json        # Ticker list for autocomplete (auto-generated)
├── scripts/
│   └── fetch-prices.js    # Node script for GitHub Actions
├── .github/
│   └── workflows/
│       └── fetch-prices.yml  # GitHub Actions workflow
└── README.md
```

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Vanilla HTML/CSS/JS |
| Charts | Chart.js (CDN) |
| Data Storage | GitHub Pages (prices) + localStorage (portfolio) |
| Price Updates | GitHub Actions + Yahoo Finance API |
| Hosting | GitHub Pages |

---

## Tickers with Full History (15)

These tickers have 15 years of historical data:
VOO, VTI, SPY, QQQ, AAPL, MSFT, CCJ, NEE, VEA, VT, NVDA, GOOGL, AMZN, META, TSLA

The autocomplete feature includes 537+ additional popular tickers (including VUSA.AS, PL, major ETFs, crypto, and UK/EU stocks).

---

## Manual Price Update

To force a full 15-year history refresh:

1. Go to **Actions** tab in the repo
2. Select **"Fetch Prices"** workflow
3. Click **"Run workflow"**
4. Check **"Force full history"**
5. Click **"Run workflow"**

---

## Known Issues

### Some tickers show generic names (e.g. "SQ" instead of "Block Inc.")
A small subset (~5) of tickers in the autocomplete list may show only the symbol as their name due to Yahoo Finance search not returning a match. The built-in fallback ticker list handles these for offline use.

---

## License

MIT — Use freely, modify freely, no guarantees.