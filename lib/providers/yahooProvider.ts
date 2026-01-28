// Purpose: Yahoo Finance market data provider using the public chart endpoint.

import type { Candle } from "../indicators/types";
import { symbolToYahooTicker, type SupportedSymbol } from "../symbols/normalize";
import type { MarketDataProvider, Timeframe } from "./types";

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
    error?: { code?: string; description?: string };
  };
};

const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

const toInterval = (timeframe: Timeframe): string => {
  switch (timeframe) {
    case "5m":
      return "5m";
    case "15m":
      return "15m";
    default:
      return timeframe;
  }
};

export class YahooProvider implements MarketDataProvider {
  name: "live" = "live";

  async getCandles(params: {
    symbol: string;
    timeframe: Timeframe;
    limit: number;
  }): Promise<Candle[]> {
    const { symbol, timeframe, limit } = params;
    const yahooTicker = symbolToYahooTicker(symbol as SupportedSymbol);
    const interval = toInterval(timeframe);

    // Use a range that reliably covers our candle limit for intraday bars.
    // 15m needs ~8-10 trading days for 200 bars; 5m needs ~3-4 days. Use 10d.
    const range = "10d";

    const url = `${YAHOO_CHART_BASE}/${encodeURIComponent(
      yahooTicker
    )}?interval=${encodeURIComponent(interval)}&range=${encodeURIComponent(
      range
    )}`;

    const response = await fetch(url, {
      // Avoid cached data during dev; caller-level caching exists in snapshot route.
      cache: "no-store",
      headers: {
        "User-Agent": "ai-trading-plan-agent/1.0",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Yahoo Finance HTTP error: ${response.status} ${response.statusText} (ticker ${yahooTicker})`
      );
    }

    const json = (await response.json()) as YahooChartResponse;

    const chartError = json.chart?.error;
    if (chartError) {
      throw new Error(
        `Yahoo Finance error: ${chartError.code || "unknown"} - ${
          chartError.description || "no description"
        } (ticker ${yahooTicker})`
      );
    }

    const result = json.chart?.result?.[0];
    const timestamps = result?.timestamp;
    const quote = result?.indicators?.quote?.[0];

    if (!result || !timestamps || !quote) {
      throw new Error(
        `Yahoo Finance response missing chart data (ticker ${yahooTicker})`
      );
    }

    const { open, high, low, close, volume } = quote;
    if (!open || !high || !low || !close || !volume) {
      throw new Error(
        `Yahoo Finance response missing OHLCV arrays (ticker ${yahooTicker})`
      );
    }

    const candles: Candle[] = [];
    const length = Math.min(
      timestamps.length,
      open.length,
      high.length,
      low.length,
      close.length,
      volume.length
    );

    for (let i = 0; i < length; i += 1) {
      const t = timestamps[i];
      const o = open[i];
      const h = high[i];
      const l = low[i];
      const c = close[i];
      const v = volume[i];

      if (
        typeof t !== "number" ||
        typeof o !== "number" ||
        typeof h !== "number" ||
        typeof l !== "number" ||
        typeof c !== "number"
      ) {
        continue;
      }

      const candle: Candle = {
        // Yahoo timestamps are in seconds
        t: new Date(t * 1000).toISOString(),
        o,
        h,
        l,
        c,
        v: typeof v === "number" ? v : 0,
      };

      if (
        Number.isFinite(candle.o) &&
        Number.isFinite(candle.h) &&
        Number.isFinite(candle.l) &&
        Number.isFinite(candle.c) &&
        Number.isFinite(candle.v)
      ) {
        candles.push(candle);
      }
    }

    if (candles.length === 0) {
      throw new Error(
        `Yahoo Finance returned no valid candles (ticker ${yahooTicker})`
      );
    }

    // Ensure ascending order
    candles.sort((a, b) => Date.parse(a.t) - Date.parse(b.t));

    const safeLimit = Math.max(1, limit);
    return candles.slice(-safeLimit);
  }
}

