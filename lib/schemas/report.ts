// Purpose: Zod schema for Report Agent output validation.

import { z } from "zod";

/**
 * Schema for validating Report Agent responses
 */
export const ReportSchema = z.object({
  bias: z.enum(["bullish", "bearish", "neutral"]),
  confidence: z.number().min(0).max(100),
  summary: z.string().optional(), // Brief one-liner explaining the bias
});

export type Report = z.infer<typeof ReportSchema>;
