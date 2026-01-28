// Purpose: Normalize supported symbols for snapshot requests.

export type SupportedSymbol =
  // Equity index futures
  | "MES" // Micro E-mini S&P 500
  | "MNQ" // Micro E-mini Nasdaq-100
  | "MYM" // Micro E-mini Dow
  | "M2K" // Micro E-mini Russell 2000
  | "ES" // E-mini S&P 500
  | "NQ" // E-mini Nasdaq-100
  | "YM" // E-mini Dow
  | "RTY" // E-mini Russell 2000
  // Energy
  | "MCL" // Micro Crude Oil
  | "CL" // Crude Oil
  | "NG" // Natural Gas
  | "RB" // RBOB Gasoline
  | "HO" // Heating Oil
  // Metals
  | "GC" // Gold
  | "SI" // Silver
  | "HG" // Copper
  | "PL" // Platinum
  | "PA" // Palladium
  // Rates (Treasuries)
  | "ZT" // 2Y T-Note
  | "ZF" // 5Y T-Note
  | "ZN" // 10Y T-Note
  | "ZB" // 30Y T-Bond
  // Grains / Oilseeds
  | "ZC" // Corn
  | "ZW" // Wheat
  | "ZS" // Soybeans
  | "ZL" // Soybean Oil
  | "ZM" // Soybean Meal
  // Softs
  | "SB" // Sugar
  | "KC" // Coffee
  | "CT" // Cotton
  | "CC" // Cocoa
  // Livestock
  | "LE" // Live Cattle
  | "GF" // Feeder Cattle
  | "HE"; // Lean Hogs

// Polygon uses different ticker formats for futures
// Format: I:{SYMBOL} for index futures, or C:{SYMBOL} for commodities
const SYMBOL_TO_POLYGON: Partial<Record<SupportedSymbol, string>> = {
  MES: "I:MES", // Micro E-mini S&P 500
  MNQ: "I:MNQ", // Micro E-mini Nasdaq-100
  MYM: "I:MYM", // Micro E-mini Dow
  M2K: "I:M2K", // Micro E-mini Russell 2000
  MCL: "C:MCL", // Micro Crude Oil
  ES: "I:ES", // E-mini S&P 500
  NQ: "I:NQ", // E-mini Nasdaq-100
  YM: "I:YM", // E-mini Dow
  RTY: "I:RTY", // E-mini Russell 2000
  CL: "C:CL", // Crude Oil
};

// Yahoo Finance continuous futures tickers (when available).
// Note: Yahoo generally supports the standard futures (ES, NQ, YM, RTY, CL),
// but micro contracts (MES, MNQ, etc.) are often not available. For now we map
// micros to their corresponding standard contract to keep the UX simple.
const SYMBOL_TO_YAHOO: Record<SupportedSymbol, string> = {
  // Equity index (micros map to full-size)
  MES: "ES=F",
  MNQ: "NQ=F",
  MYM: "YM=F",
  M2K: "RTY=F",
  ES: "ES=F",
  NQ: "NQ=F",
  YM: "YM=F",
  RTY: "RTY=F",
  // Energy
  MCL: "CL=F",
  CL: "CL=F",
  NG: "NG=F",
  RB: "RB=F",
  HO: "HO=F",
  // Metals
  GC: "GC=F",
  SI: "SI=F",
  HG: "HG=F",
  PL: "PL=F",
  PA: "PA=F",
  // Rates
  ZT: "ZT=F",
  ZF: "ZF=F",
  ZN: "ZN=F",
  ZB: "ZB=F",
  // Grains / Oilseeds
  ZC: "ZC=F",
  ZW: "ZW=F",
  ZS: "ZS=F",
  ZL: "ZL=F",
  ZM: "ZM=F",
  // Softs
  SB: "SB=F",
  KC: "KC=F",
  CT: "CT=F",
  CC: "CC=F",
  // Livestock
  LE: "LE=F",
  GF: "GF=F",
  HE: "HE=F",
};

const SYMBOL_MAP: Record<string, SupportedSymbol> = {
  // Equity index
  MES: "MES",
  MNQ: "MNQ",
  MYM: "MYM",
  M2K: "M2K",
  ES: "ES",
  NQ: "NQ",
  YM: "YM",
  RTY: "RTY",
  // Energy
  MCL: "MCL",
  CL: "CL",
  NG: "NG",
  RB: "RB",
  HO: "HO",
  // Metals
  GC: "GC",
  SI: "SI",
  HG: "HG",
  PL: "PL",
  PA: "PA",
  // Rates
  ZT: "ZT",
  ZF: "ZF",
  ZN: "ZN",
  ZB: "ZB",
  // Grains / Oilseeds
  ZC: "ZC",
  ZW: "ZW",
  ZS: "ZS",
  ZL: "ZL",
  ZM: "ZM",
  // Softs
  SB: "SB",
  KC: "KC",
  CT: "CT",
  CC: "CC",
  // Livestock
  LE: "LE",
  GF: "GF",
  HE: "HE",
};

export function normalizeSymbol(input: string): {
  symbol: SupportedSymbol;
  display: string;
} {
  const trimmed = input.trim().toUpperCase();
  const symbol = SYMBOL_MAP[trimmed];

  if (!symbol) {
    throw new Error(
      `Unsupported symbol: ${input}. Supported symbols: ${Object.keys(SYMBOL_MAP).join(", ")}`
    );
  }

  return { symbol, display: symbol };
}

/**
 * Convert internal symbol to Polygon ticker format
 */
export function symbolToPolygonTicker(symbol: SupportedSymbol): string {
  const ticker = SYMBOL_TO_POLYGON[symbol];
  if (!ticker) {
    throw new Error(`No Polygon ticker mapping for symbol: ${symbol}`);
  }
  return ticker;
}

/**
 * Convert internal symbol to Yahoo Finance ticker format
 */
export function symbolToYahooTicker(symbol: SupportedSymbol): string {
  return SYMBOL_TO_YAHOO[symbol];
}
