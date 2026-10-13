// Purpose: Zod schemas for trade intent create/update API bodies.

import { z } from "zod";

export const TradeIntentStatusSchema = z.enum([
  "draft",
  "planted",
  "closed",
  "canceled",
]);

export const TradeIntentCreateSchema = z.object({
  entry: z.number().finite(),
  stop: z.number().finite(),
  takeProfit: z.number().finite(),
  status: z.enum(["draft", "planted"]).default("draft"),
  sourcePlanId: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export type TradeIntentCreate = z.infer<typeof TradeIntentCreateSchema>;

export const TradeIntentUpdateSchema = z.object({
  id: z.string().uuid(),
  entry: z.number().finite().optional(),
  stop: z.number().finite().optional(),
  takeProfit: z.number().finite().optional(),
  status: TradeIntentStatusSchema.optional(),
  sourcePlanId: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export type TradeIntentUpdate = z.infer<typeof TradeIntentUpdateSchema>;
