// Purpose: Exponential Moving Average (EMA) calculation.

import type { Candle } from "./types";

/**
 * Calculate the Exponential Moving Average (EMA) aligned to input candles.
 * Warm-up values are NaN until the first EMA seed is available.
 */
export function calculateEMA(candles: Candle[], period: number): number[] {
  const length = candles.length;
  if (length === 0) {
    return [];
  }
  if (period <= 0) {
    return candles.map(() => Number.NaN);
  }

  const ema: number[] = new Array(length).fill(Number.NaN);
  if (length < period) {
    return ema;
  }

  let sum = 0;
  for (let i = 0; i < period; i += 1) {
    sum += candles[i].c;
  }

  const multiplier = 2 / (period + 1);
  let prevEma = sum / period;
  const seedIndex = period - 1;
  ema[seedIndex] = prevEma;

  for (let i = seedIndex + 1; i < length; i += 1) {
    const price = candles[i].c;
    const nextEma = (price - prevEma) * multiplier + prevEma;
    ema[i] = nextEma;
    prevEma = nextEma;
  }

  return ema;
}

