# AI Trading Plan Agent

Deterministic market snapshot + Gemini planning (**decision support only**).

## What it does

- **Snapshot**: fetches candles, computes indicators, and returns a validated market snapshot
- **Plan**: calls Gemini to generate a **strict JSON** trading plan validated with Zod (optional Critic pass)
- **UI**: single-page Next.js UI to fetch snapshot + generate plans and inspect raw JSON

## Quickstart

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Create `.env.local` (this repo ignores `.env*` in `.gitignore`).

### Gemini (required for `/api/plan`)

```bash
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-3-pro-preview
```

### Market data provider

```bash
# demo | live | yahoo | polygon
MARKET_DATA_PROVIDER=demo
```

- **demo**: reads bundled candles from `data/` (no key required)
- **live / yahoo**: uses Yahoo Finance chart endpoint (no key required)
- **polygon**: uses Polygon (requires `POLYGON_API_KEY`, and paid entitlements for many futures feeds)

If using Polygon:

```bash
POLYGON_API_KEY=your_polygon_key
```

## Supported symbols

User input is normalized/validated in `lib/symbols/normalize.ts`.

### Equity index

- Micros: `MES`, `MNQ`, `MYM`, `M2K`
- Full: `ES`, `NQ`, `YM`, `RTY`

### Energy

- `MCL`, `CL`, `NG`, `RB`, `HO`

### Metals

- `GC` (gold), `SI` (silver), `HG` (copper), `PL` (platinum), `PA` (palladium)

### Rates

- `ZT`, `ZF`, `ZN`, `ZB`

### Grains / oilseeds

- `ZC`, `ZW`, `ZS`, `ZL`, `ZM`

### Softs

- `SB`, `KC`, `CT`, `CC`

### Livestock

- `LE`, `GF`, `HE`

Notes:
- When using **Yahoo live data**, micro contracts are commonly not available as separate tickers. The app maps micros to the corresponding full contract (e.g., `MES → ES=F`).

## API endpoints

### Snapshot

`GET /api/snapshot?symbol=MES`

Returns `Snapshot` JSON (validated by Zod in `lib/schemas/snapshot.ts`). The API route caches snapshots for ~30s.

### Plan

`POST /api/plan`

Body:

```json
{
  "symbol": "MES",
  "mode": "normal",
  "scenario": "fake_breakout",
  "useCritic": false
}
```

Returns `PlanResponse` JSON (validated by Zod in `lib/schemas/plan.ts`).

## Plan “modes” and stress scenarios

The UI supports:

- **Normal**: `mode="normal"` (baseline plan for current snapshot)
- **Stress**: `mode="stress"` + one scenario
  - `fake_breakout`: breakout fails quickly and reverses
  - `vwap_reject`: VWAP touch is rejected
  - `atr_spike`: volatility expansion / wider ranges
- **Use Critic**: `useCritic=true` triggers a second Gemini pass to review and improve the draft plan

## Project structure (high level)

- `lib/indicators/`: pure indicator math (EMA/ATR/ADX/VWAP)
- `lib/providers/`: data providers (Demo, Yahoo live, Polygon)
- `lib/snapshot/`: snapshot builder (domain glue)
- `lib/llm/`: Gemini client wrapper
- `lib/plan/`: plan orchestrator (snapshot → Gemini → Zod validation → optional Critic)
- `src/app/api/`: Next.js route handlers (`/api/snapshot`, `/api/plan`)
- `src/app/page.tsx`: UI MVP (controls + snapshot card + plan card)

## Disclaimer

This project provides **decision support only** and does not constitute financial advice. Use at your own risk.
