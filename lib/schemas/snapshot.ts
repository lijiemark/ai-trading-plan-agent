// Purpose: Zod schema for validated market snapshots.

import { z } from "zod";

export const SnapshotSchema = z.object({
  symbol: z.string(),
  asOf: z.string(),
  timeframe: z.object({
    trend: z.literal("15m"),
    volatility: z.literal("5m"),
  }),
  price: z.number(),
  vwap: z.object({
    value: z.number(),
    band: z.object({
      low: z.number(),
      high: z.number(),
    }),
    lookback: z.number(),
  }),
  ema: z.object({
    ema20_15m: z.number(),
    ema50_15m: z.number(),
  }),
  adx: z.object({
    adx14_15m: z.number(),
  }),
  atr: z.object({
    atr14_5m: z.number(),
  }),
  regimeHints: z.object({
    aboveVWAP: z.boolean(),
    emaStack: z.enum(["bull", "bear", "mixed"]),
  }),
  dataSource: z.object({
    provider: z.enum(["demo", "live"]),
    notes: z.string().optional(),
  }),
});

export type Snapshot = z.infer<typeof SnapshotSchema>;

