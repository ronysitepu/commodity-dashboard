# 📊 Commodity Dashboard

Interactive commodity price tracking dashboard, auto-updated via GitHub Actions.

**Live:** https://ronysitepu.github.io/commodity-dashboard/

## Features

- **4 sector tabs** — Energy, Fertilizer & Feedstock, Metals, Plastics & Agri
- **Interactive Chart.js line charts** — dark theme, endpoint annotations, hover tooltips
- **Price summary cards** — current price + 1D change per commodity
- **Price overview table** — 1D, 1W change, trend arrows, data point count
- **Auto-updated** every 4 hours via GitHub Actions cron

## Data Sources

| Source | Commodities |
|--------|-------------|
| TradingEconomics | Coal, LNG JKM, Urea, DAP, Brent, Polyethylene, PP |
| Yahoo Finance | Gold (GC=F), Copper (HG=F), CPO (CPO=F) |
| TradingView | Ammonia CFR (AMAF1!), Ammonia FOB (AMMF1!) |

Synthetic ratios: Coal/Gold (×100), Copper/Gold (×1000).

## Tech Stack

- **Frontend:** HTML5, CSS3 (flexbox/grid), Chart.js 4.x
- **Hosting:** GitHub Pages

## Project Structure

```
commodity-dashboard/
├── index.html
├── css/style.css
├── js/charts.js
├── js/app.js
├── data/commodities.json
├── .github/workflows/update-data.yml
└── README.md
```