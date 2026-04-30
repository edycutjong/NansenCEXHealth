# 🏦 NansenCEXHealth

> Real-time CEX health monitoring dashboard — powered by [Nansen API](https://nansen.ai)

Track centralized exchange (CEX) health by monitoring onchain asset balances and 24hr net flows. Built on [Use Case 5](https://docs.nansen.ai/guides/templates/complex-use-cases/use-case-5-monitoring-cex-health) from the Nansen API documentation.

## Dashboard

| Exchange | Assets on Exchange | 24hr Net Flows |
|----------|-------------------|----------------|
| Binance  | Real-time         | ↑↓ Live        |
| Coinbase | Real-time         | ↑↓ Live        |
| OKX      | Real-time         | ↑↓ Live        |
| Bybit    | Real-time         | ↑↓ Live        |
| Kraken   | Real-time         | ↑↓ Live        |

## Features

- **5 Major Exchanges** — Binance, Coinbase, OKX, Bybit, Kraken
- **Total Assets** — Sum of all onchain token holdings across all chains
- **24hr Net Flows** — Inflows vs outflows with visual flow bar
- **Top Holdings** — Top 5 tokens by USD value per exchange
- **Auto-Refresh** — Dashboard updates every 5 minutes
- **TTL Cache** — Prevents API rate limit hits on page refresh
- **Premium UI** — Dark mode, glassmorphism, responsive grid

## Quick Start

```bash
# Clone
git clone https://github.com/edycutjong/NansenCEXHealth.git
cd NansenCEXHealth

# Install
npm install

# Configure
cp .env.example .env
# Edit .env → add your NANSEN_API_KEY

# Run
npm run dev
# Open http://localhost:3000
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET`  | `/api/exchanges` | All exchange health data |
| `GET`  | `/api/exchanges/:name` | Single exchange (e.g., `/api/exchanges/binance`) |

### Response Shape

```json
{
  "exchanges": [
    {
      "name": "Binance",
      "entity": "Binance",
      "totalAssetsUsd": 100000000000,
      "netFlow24hUsd": 500000000,
      "totalInflows24hUsd": 1200000000,
      "totalOutflows24hUsd": 700000000,
      "topTokens": [
        { "symbol": "BTC", "chain": "bitcoin", "usdValue": 50000000000, "percentage": 50 }
      ],
      "fetchedAt": "2026-04-30T00:00:00Z"
    }
  ],
  "lastUpdated": "2026-04-30T00:00:00Z",
  "cacheHit": false
}
```

## Nansen API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/profiler/address/current-balance` | Total token holdings per exchange |
| `POST /api/v1/profiler/address/counterparties` | 24hr inflows/outflows for net flow calculation |

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Node.js 20+ · TypeScript (strict) |
| Server | Express 5 |
| API Client | Native `fetch` (zero deps) |
| Frontend | Vanilla HTML/CSS/JS |
| Cache | In-memory TTL Map |
| Tests | Node test runner + c8 |

## Scripts

```bash
npm run dev           # Build + run server
npm test              # Run unit tests
npm run test:coverage # Tests with coverage
npm run typecheck     # TypeScript strict check
npm run lint          # ESLint
npm run ci            # Full CI pipeline
```

## Project Structure

```
NansenCEXHealth/
├── src/
│   ├── index.ts              # Express server
│   ├── api/
│   │   ├── nansen.ts         # Nansen API client
│   │   └── types.ts          # TypeScript types
│   ├── routes/
│   │   └── health.ts         # REST API routes
│   └── services/
│       ├── cache.ts          # TTL cache
│       └── cex-monitor.ts    # Core business logic
├── public/
│   ├── index.html            # Dashboard shell
│   ├── styles.css            # Premium dark theme
│   └── app.js                # Frontend rendering
├── tests/
│   ├── cache.test.ts
│   ├── cex-monitor.test.ts
│   └── types.test.ts
└── package.json
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NANSEN_API_KEY` | ✅ | — | Your Nansen API key |
| `PORT` | ❌ | `3000` | Server port |
| `CACHE_TTL` | ❌ | `300` | Cache TTL in seconds |

## License

MIT — [@edycutjong](https://github.com/edycutjong)
