// Purpose: Polygon.io live market data provider.

import { restClient } from "@polygon.io/client-js";
import type { Candle } from "../indicators/types";
import type { MarketDataProvider, Timeframe } from "./types";
import {
  symbolToPolygonTicker,
  type SupportedSymbol,
} from "../symbols/normalize";

interface PolygonProviderConfig {
  apiKey: string;
}

export class PolygonProvider implements MarketDataProvider {
  name: "live" = "live";
  private readonly client: ReturnType<typeof restClient>;

  constructor(config: PolygonProviderConfig) {
    if (!config.apiKey) {
      throw new Error("Polygon API key is required");
    }
    this.client = restClient(config.apiKey);
  }

  async getCandles(params: {
    symbol: string;
    timeframe: Timeframe;
    limit: number;
  }): Promise<Candle[]> {
    const { symbol, timeframe, limit } = params;

    // Convert internal symbol to Polygon ticker format
    const polygonTicker = symbolToPolygonTicker(symbol as SupportedSymbol);

    // Convert timeframe: "5m" -> 5, "15m" -> 15
    const multiplier = timeframe === "5m" ? 5 : 15;
    const timespan = "minute";

    try {
      // Calculate date range (Polygon requires from/to dates)
      const to = new Date();
      const from = new Date();
      // Subtract enough time to get the requested number of candles
      // Assuming ~390 trading minutes per day, add buffer
      const minutesNeeded = limit * multiplier;
      from.setMinutes(from.getMinutes() - minutesNeeded - 60); // Add 1 hour buffer

      // For futures, Polygon uses the stocks aggregates endpoint but with futures ticker format
      // The I: and C: prefixes indicate index and commodity futures respectively
      // Note: Some Polygon plans may require futures-specific endpoints - adjust if needed
      const response = await this.client.stocks.aggregates(
        polygonTicker,
        multiplier,
        timespan,
        from.toISOString().split("T")[0], // YYYY-MM-DD format
        to.toISOString().split("T")[0],
        {
          limit: limit,
          sort: "asc",
        }
      );

      if (response.status !== "OK" || !response.results) {
        const errorDetails = (response as { error?: string; message?: string }).error || 
                            (response as { error?: string; message?: string }).message ||
                            "Unknown error";
        throw new Error(
          `Polygon API error: ${response.status} - ${errorDetails}. Ticker: ${polygonTicker}`
        );
      }

      // Transform Polygon response to Candle format
      return this.transformToCandles(response.results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Log more details in development
      if (process.env.NODE_ENV === "development") {
        console.error("Polygon API call failed:", {
          symbol,
          polygonTicker,
          timeframe,
          multiplier,
          timespan,
          error: errorMessage,
        });
      }
      throw new Error(
        `Failed to fetch candles from Polygon for ${symbol} (${polygonTicker}): ${errorMessage}`
      );
    }
  }

  private transformToCandles(aggregates: Array<{
    t?: number; // timestamp in milliseconds
    o?: number; // open
    h?: number; // high
    l?: number; // low
    c?: number; // close
    v?: number; // volume
  }>): Candle[] {
    return aggregates
      .filter(
        (bar) =>
          bar.t !== undefined &&
          bar.o !== undefined &&
          bar.h !== undefined &&
          bar.l !== undefined &&
          bar.c !== undefined &&
          bar.v !== undefined
      )
      .map((bar) => ({
        t: new Date(bar.t!).toISOString(),
        o: Number(bar.o),
        h: Number(bar.h),
        l: Number(bar.l),
        c: Number(bar.c),
        v: Number(bar.v || 0),
      }))
      .filter(
        (candle) =>
          Number.isFinite(candle.o) &&
          Number.isFinite(candle.h) &&
          Number.isFinite(candle.l) &&
          Number.isFinite(candle.c) &&
          Number.isFinite(candle.v)
      );
  }
}
