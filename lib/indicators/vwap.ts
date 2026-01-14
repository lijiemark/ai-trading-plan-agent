// Purpose: Volume Weighted Average Price (VWAP) calculation.

import type { Candle } from "./types";

/**
 * Calculate the cumulative VWAP aligned to input candles.
 */
export function calculateVWAP(candles: Candle[]): number[] {
  const length = candles.length;
  if (length === 0) {
    return [];
  }

  const vwap: number[] = new Array(length).fill(Number.NaN);
  let cumulativePV = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < length; i += 1) {
    const candle = candles[i];
    const typicalPrice = (candle.h + candle.l + candle.c) / 3;
    cumulativePV += typicalPrice * candle.v;
    cumulativeVolume += candle.v;

    vwap[i] = cumulativeVolume === 0 ? Number.NaN : cumulativePV / cumulativeVolume;
  }

  return vwap;
}

