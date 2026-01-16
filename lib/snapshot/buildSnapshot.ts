// Purpose: Build a validated market snapshot using indicator engine outputs.

import { calculateADX, calculateATR, calculateEMA } from "../indicators";
import type { Candle } from "../indicators/types";
import type { MarketDataProvider } from "../providers/types";
import { SnapshotSchema, type Snapshot } from "../schemas/snapshot";
import type { SupportedSymbol } from "../symbols/normalize";

const VWAP_LOOKBACK = 78;
const CANDLE_LIMIT = 200;

const findLastNumber = (values: number[]): number | null => {
  for (let i = values.length - 1; i >= 0; i -= 1) {
    const value = values[i];
    if (!Number.isNaN(value) && Number.isFinite(value)) {
      return value;
    }
  }
  return null;
};

const ensureNumber = (value: number | null, label: string): number => {
  if (value === null || Number.isNaN(value)) {
    throw new Error(`Unable to compute ${label}.`);
  }
  return value;
};

const computeSessionVWAP = (candles: Candle[]): number => {
  let cumulativePV = 0;
  let cumulativeVolume = 0;

  for (const candle of candles) {
    const typicalPrice = (candle.h + candle.l + candle.c) / 3;
    cumulativePV += typicalPrice * candle.v;
    cumulativeVolume += candle.v;
  }

  if (cumulativeVolume === 0) {
    throw new Error("VWAP volume is zero.");
  }

  return cumulativePV / cumulativeVolume;
};

export async function buildSnapshot(params: {
  provider: MarketDataProvider;
  symbol: SupportedSymbol;
}): Promise<Snapshot> {
  const { provider, symbol } = params;

  const [candles15m, candles5m] = await Promise.all([
    provider.getCandles({ symbol, timeframe: "15m", limit: CANDLE_LIMIT }),
    provider.getCandles({ symbol, timeframe: "5m", limit: CANDLE_LIMIT }),
  ]);

  if (candles15m.length === 0 || candles5m.length === 0) {
    throw new Error("Not enough candles to build snapshot.");
  }

  const ema20 = calculateEMA(candles15m, 20);
  const ema50 = calculateEMA(candles15m, 50);
  const adx14 = calculateADX(candles15m, 14);
  const atr14 = calculateATR(candles5m, 14);
  const ema20_15m = ensureNumber(findLastNumber(ema20), "EMA20");
  const ema50_15m = ensureNumber(findLastNumber(ema50), "EMA50");
  const adx14_15m = ensureNumber(findLastNumber(adx14), "ADX14");
  const atr14_5m = ensureNumber(findLastNumber(atr14), "ATR14");
  const price = candles5m[candles5m.length - 1].c;

  const vwapCandles = candles15m.slice(-VWAP_LOOKBACK);
  if (vwapCandles.length < VWAP_LOOKBACK) {
    throw new Error("Not enough candles for VWAP lookback.");
  }
  const vwap = computeSessionVWAP(vwapCandles);
  const bandLow = vwap - atr14_5m;
  const bandHigh = vwap + atr14_5m;

  const emaStack =
    ema20_15m > ema50_15m && price > ema20_15m
      ? "bull"
      : ema20_15m < ema50_15m && price < ema20_15m
        ? "bear"
        : "mixed";

  const snapshot: Snapshot = {
    symbol,
    asOf: candles5m[candles5m.length - 1].t,
    timeframe: { trend: "15m", volatility: "5m" },
    price,
    vwap: {
      value: vwap,
      band: { low: bandLow, high: bandHigh },
      lookback: VWAP_LOOKBACK,
    },
    ema: { ema20_15m, ema50_15m },
    adx: { adx14_15m },
    atr: { atr14_5m },
    regimeHints: { aboveVWAP: price > vwap, emaStack },
    dataSource: {
      provider: provider.name,
      notes: provider.name === "demo" ? "Using bundled demo OHLCV" : undefined,
    },
  };

  return SnapshotSchema.parse(snapshot);
}

