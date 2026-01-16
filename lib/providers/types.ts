// Purpose: Shared types for market data providers.

import type { Candle } from "../indicators/types";

export type Timeframe = "5m" | "15m";

export interface MarketDataProvider {
  name: "demo" | "live";
  getCandles(params: {
    symbol: string;
    timeframe: Timeframe;
    limit: number;
  }): Promise<Candle[]>;
}

