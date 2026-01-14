// Purpose: Average Directional Index (ADX) calculation using Wilder's method.

import type { Candle } from "./types";

/**
 * Calculate the Average Directional Index (ADX) aligned to input candles.
 * Warm-up values are NaN until the first ADX seed is available.
 */
export function calculateADX(candles: Candle[], period: number): number[] {
  const length = candles.length;
  if (length === 0) {
    return [];
  }
  if (period <= 0) {
    return candles.map(() => Number.NaN);
  }

  const adx: number[] = new Array(length).fill(Number.NaN);
  if (length < period * 2 - 1) {
    return adx;
  }

  const trueRanges: number[] = new Array(length).fill(0);
  const plusDM: number[] = new Array(length).fill(0);
  const minusDM: number[] = new Array(length).fill(0);

  for (let i = 1; i < length; i += 1) {
    const current = candles[i];
    const prev = candles[i - 1];

    const upMove = current.h - prev.h;
    const downMove = prev.l - current.l;

    plusDM[i] = upMove > downMove && upMove > 0 ? upMove : 0;
    minusDM[i] = downMove > upMove && downMove > 0 ? downMove : 0;

    const highLow = current.h - current.l;
    const highPrevClose = Math.abs(current.h - prev.c);
    const lowPrevClose = Math.abs(current.l - prev.c);
    trueRanges[i] = Math.max(highLow, highPrevClose, lowPrevClose);
  }

  let trSum = 0;
  let plusSum = 0;
  let minusSum = 0;
  for (let i = 0; i < period; i += 1) {
    trSum += trueRanges[i];
    plusSum += plusDM[i];
    minusSum += minusDM[i];
  }

  let smoothedTR = trSum;
  let smoothedPlusDM = plusSum;
  let smoothedMinusDM = minusSum;

  const dx: number[] = new Array(length).fill(Number.NaN);
  const diStartIndex = period - 1;
  for (let i = diStartIndex; i < length; i += 1) {
    if (i > diStartIndex) {
      smoothedTR = smoothedTR - smoothedTR / period + trueRanges[i];
      smoothedPlusDM = smoothedPlusDM - smoothedPlusDM / period + plusDM[i];
      smoothedMinusDM =
        smoothedMinusDM - smoothedMinusDM / period + minusDM[i];
    }

    if (smoothedTR === 0) {
      dx[i] = 0;
      continue;
    }

    const plusDI = (100 * smoothedPlusDM) / smoothedTR;
    const minusDI = (100 * smoothedMinusDM) / smoothedTR;
    const diSum = plusDI + minusDI;
    dx[i] = diSum === 0 ? 0 : (100 * Math.abs(plusDI - minusDI)) / diSum;
  }

  const firstAdxIndex = period * 2 - 2;
  let dxSum = 0;
  for (let i = diStartIndex; i <= firstAdxIndex; i += 1) {
    dxSum += dx[i];
  }

  let prevAdx = dxSum / period;
  adx[firstAdxIndex] = prevAdx;

  for (let i = firstAdxIndex + 1; i < length; i += 1) {
    const nextAdx = (prevAdx * (period - 1) + dx[i]) / period;
    adx[i] = nextAdx;
    prevAdx = nextAdx;
  }

  return adx;
}

