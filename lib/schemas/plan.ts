// Purpose: Zod schemas for plan request and response validation.

import { z } from "zod";

/**
 * Schema for validating POST request body to /api/plan
 */
export const PlanRequestSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  mode: z.string().optional(),
  scenario: z.string().optional(),
  useCritic: z.boolean().optional().default(false),
});

export type PlanRequest = z.infer<typeof PlanRequestSchema>;

/**
 * Schema for validating Gemini-generated plan responses
 */
export const PlanResponseSchema = z.object({
  decision: z.enum(["trade", "no_trade"]),
  reasoning: z.string(),
  entries: z
    .array(
      z.object({
        price: z.number(),
        label: z.string().optional(),
      })
    )
    .optional(),
  stops: z.array(
    z.object({
      price: z.number(),
      label: z.string().optional(),
    })
  ),
  targets: z.array(
    z.object({
      price: z.number(),
      label: z.string().optional(),
    })
  ),
  sizing: z.object({
    riskPerTrade: z.number().optional(),
    positionSize: z.number().optional(),
    assumptions: z.string().optional(),
  }),
  disclaimer: z.string(),
  mode: z.string().optional(),
  scenario: z.string().optional(),
});

export type PlanResponse = z.infer<typeof PlanResponseSchema>;
