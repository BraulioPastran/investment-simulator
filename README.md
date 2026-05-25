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
- Historical prices from Yahoo Finance (15 years of data)
- Weekly prices for the last year, monthly for older history
- Auto-updated daily via GitHub Actions

### 🔮 Hypothetical Simulator
- Select any ticker + date from the last 15 years
- See what your investment would be worth today

### 🔍 Live Ticker Search
- Search any ticker available on Yahoo Finance
- Real-time autocomplete as you type

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
Yahoo Finance API → GitHub Actions → data/prices.json → GitHub Pages → Your Browser
                                                              ↑
                                              localStorage (portfolio)
```

1. **GitHub Actions** fetches prices from Yahoo Finance and commits to `data/prices.json`
2. **GitHub Pages** serves the JSON file publicly
3. **Web App** loads prices and displays your portfolio
4. **Your Portfolio** is stored in browser localStorage

---

## Project Structure

```
inversion-simulator/
├── index.html              # Main web app
├── data/
│   └── prices.json        # Historical price data (auto-generated)
├── scripts/
│   └── fetch-prices.js    # Node script for price fetching
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
| Charts | Chart.js |
| Data Storage | GitHub Pages (prices) + localStorage (portfolio) |
| Price Updates | GitHub Actions + Yahoo Finance API |
| Hosting | GitHub Pages |

---

## Manual Price Update

To force a full 15-year history refresh:

1. Go to **Actions** tab in the repo
2. Select **"Fetch Prices"** workflow
3. Click **"Run workflow"**
4. Check **"Force full history"**
5. Click **"Run workflow"**

---

## License

MIT — Use freely, modify freely, no guarantees.