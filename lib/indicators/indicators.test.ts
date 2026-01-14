// Purpose: Minimal correctness checks for core indicators.

import { describe, expect, it } from "vitest";

import {
  calculateADX,
  calculateATR,
  calculateEMA,
  calculateVWAP,
  type Candle,
} from "./index";

const makeCandle = (
  t: string,
  o: number,
  h: number,
  l: number,
  c: number,
  v: number
): Candle => ({ t, o, h, l, c, v });

const trendingCandles: Candle[] = [
  makeCandle("2024-01-01T00:00:00Z", 10, 12, 9, 11, 100),
  makeCandle("2024-01-01T00:01:00Z", 11, 13, 10, 12, 100),
  makeCandle("2024-01-01T00:02:00Z", 12, 14, 11, 13, 100),
  makeCandle("2024-01-01T00:03:00Z", 13, 15, 12, 14, 100),
  makeCandle("2024-01-01T00:04:00Z", 14, 16, 13, 15, 100),
  makeCandle("2024-01-01T00:05:00Z", 15, 17, 14, 16, 100),
  makeCandle("2024-01-01T00:06:00Z", 16, 18, 15, 17, 100),
  makeCandle("2024-01-01T00:07:00Z", 17, 19, 16, 18, 100),
  makeCandle("2024-01-01T00:08:00Z", 18, 20, 17, 19, 100),
  makeCandle("2024-01-01T00:09:00Z", 19, 21, 18, 20, 100),
];

describe("indicator engine", () => {
  it("EMA converges on a constant series", () => {
    const constantCandles = Array.from({ length: 8 }, (_, index) =>
      makeCandle(
        `2024-01-02T00:0${index}:00Z`,
        10,
        10,
        10,
        10,
        100
      )
    );

    const ema = calculateEMA(constantCandles, 3);
    const last = ema[ema.length - 1];

    expect(Number.isNaN(ema[0])).toBe(true);
    expect(Number.isNaN(ema[1])).toBe(true);
    expect(last).toBeCloseTo(10, 6);
  });

  it("ATR is positive after warm-up", () => {
    const atr = calculateATR(trendingCandles, 3);
    const last = atr[atr.length - 1];

    expect(last).toBeGreaterThan(0);
  });

  it("ADX stays within [0, 100]", () => {
    const adx = calculateADX(trendingCandles, 3);
    const lastValue = [...adx].reverse().find((value) => !Number.isNaN(value));

    expect(lastValue).toBeDefined();
    expect(lastValue as number).toBeGreaterThanOrEqual(0);
    expect(lastValue as number).toBeLessThanOrEqual(100);
  });

  it("VWAP is monotonic when prices trend up", () => {
    const vwap = calculateVWAP(trendingCandles).filter(
      (value) => !Number.isNaN(value)
    );

    for (let i = 1; i < vwap.length; i += 1) {
      expect(vwap[i]).toBeGreaterThanOrEqual(vwap[i - 1]);
    }
  });
});

