// Purpose: Factory for creating market data providers.

import { DemoProvider } from "./demoProvider";
import { PolygonProvider } from "./polygonProvider";
import { YahooProvider } from "./yahooProvider";
import type { MarketDataProvider } from "./types";

export function createProvider(): MarketDataProvider {
  const providerType = process.env.MARKET_DATA_PROVIDER || "demo";

  // Live provider defaults to Yahoo Finance (no API key) for a better free-tier dev experience.
  if (providerType === "live" || providerType === "yahoo") {
    return new YahooProvider();
  }

  // Polygon support remains available behind an explicit selector.
  if (providerType === "polygon") {
    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) {
      throw new Error(
        "POLYGON_API_KEY environment variable is required for polygon provider"
      );
    }
    return new PolygonProvider({ apiKey });
  }

  return new DemoProvider();
}
