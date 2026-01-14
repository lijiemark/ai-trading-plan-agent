// Purpose: Average True Range (ATR) calculation using Wilder's method.

import type { Candle } from "./types";

/**
 * Calculate the Average True Range (ATR) aligned to input candles.
 * Warm-up values are NaN until the first ATR seed is available.
 */
export function calculateATR(candles: Candle[], period: number): number[] {
  const length = candles.length;
  if (length === 0) {
    return [];
  }
  if (period <= 0) {
    return candles.map(() => Number.NaN);
  }

  const atr: number[] = new Array(length).fill(Number.NaN);
  if (length < period) {
    return atr;
  }

  const trueRanges: number[] = new Array(length).fill(0);
  for (let i = 0; i < length; i += 1) {
    const current = candles[i];
    if (i === 0) {
      trueRanges[i] = current.h - current.l;
      continue;
    }
    const prevClose = candles[i - 1].c;
    const highLow = current.h - current.l;
    const highPrevClose = Math.abs(current.h - prevClose);
    const lowPrevClose = Math.abs(current.l - prevClose);
    trueRanges[i] = Math.max(highLow, highPrevClose, lowPrevClose);
  }

  let trSum = 0;
  for (let i = 0; i < period; i += 1) {
    trSum += trueRanges[i];
  }

  const seedIndex = period - 1;
  let prevAtr = trSum / period;
  atr[seedIndex] = prevAtr;

  for (let i = seedIndex + 1; i < length; i += 1) {
    const nextAtr = (prevAtr * (period - 1) + trueRanges[i]) / period;
    atr[i] = nextAtr;
    prevAtr = nextAtr;
  }

  return atr;
}

