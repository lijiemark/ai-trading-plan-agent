// Purpose: Demo market data provider loading bundled JSON candles.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import type { Candle } from "../indicators/types";
import type { MarketDataProvider, Timeframe } from "./types";

type DemoCandle = Candle;

const isValidCandle = (value: DemoCandle): boolean => {
  return (
    typeof value.t === "string" &&
    Number.isFinite(value.o) &&
    Number.isFinite(value.h) &&
    Number.isFinite(value.l) &&
    Number.isFinite(value.c) &&
    Number.isFinite(value.v)
  );
};

const getDataPath = (symbol: string, timeframe: Timeframe): string =>
  join(process.cwd(), "data", `${symbol}_${timeframe}.json`);

export class DemoProvider implements MarketDataProvider {
  name: "demo" = "demo";

  async getCandles(params: {
    symbol: string;
    timeframe: Timeframe;
    limit: number;
  }): Promise<Candle[]> {
    const { symbol, timeframe, limit } = params;
    const raw = await readFile(getDataPath(symbol, timeframe), "utf-8");
    const parsed = JSON.parse(raw) as DemoCandle[];

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("Demo data is empty.");
    }

    const filtered = parsed.filter(isValidCandle);
    if (filtered.length === 0) {
      throw new Error("Demo data is invalid.");
    }

    const sorted = filtered
      .slice()
      .sort((a, b) => Date.parse(a.t) - Date.parse(b.t));

    const safeLimit = Math.max(1, limit);
    return sorted.slice(-safeLimit);
  }
}

