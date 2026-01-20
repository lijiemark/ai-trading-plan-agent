// Purpose: Orchestrate snapshot building and Gemini plan generation with validation.

import { buildSnapshot } from "../snapshot/buildSnapshot";
import type { MarketDataProvider } from "../providers/types";
import type { SupportedSymbol } from "../symbols/normalize";
import { PlanResponseSchema, type PlanResponse } from "../schemas/plan";
import { generatePlan, criticizePlan, repairPlan } from "../llm/geminiClient";
import type { Snapshot } from "../schemas/snapshot";

export interface BuildPlanParams {
  provider: MarketDataProvider;
  symbol: SupportedSymbol;
  mode?: string;
  scenario?: string;
  useCritic?: boolean;
}

/**
 * Extract JSON from markdown code blocks if present
 */
function extractJSON(text: string): string {
  // Try to find JSON in markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find JSON object boundaries
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return text.trim();
}

/**
 * Parse and validate plan JSON with one repair attempt
 */
async function parseAndValidatePlan(
  rawText: string,
  snapshot: Snapshot,
  attempt: number = 1
): Promise<PlanResponse> {
  try {
    const jsonText = extractJSON(rawText);
    const parsed = JSON.parse(jsonText);
    const validated = PlanResponseSchema.parse(parsed);
    return validated;
  } catch (error) {
    if (attempt === 1) {
      // First attempt failed, try repair
      const validationError =
        error instanceof Error ? error.message : String(error);
      const repairedText = await repairPlan(rawText, snapshot, validationError);
      return parseAndValidatePlan(repairedText, snapshot, 2);
    }
    // Repair also failed
    throw new Error(
      `Failed to parse and validate plan after repair attempt: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Build a trading plan from a market snapshot
 */
export async function buildPlan(
  params: BuildPlanParams
): Promise<PlanResponse> {
  const { provider, symbol, mode, scenario, useCritic = false } = params;

  // Step 1: Build snapshot (direct call, not HTTP)
  const snapshot = await buildSnapshot({ provider, symbol });

  // Step 2: Generate plan with Strategist agent
  const strategistResponse = await generatePlan(snapshot, mode, scenario);

  // Step 3: Parse and validate (with one repair attempt)
  let plan = await parseAndValidatePlan(strategistResponse, snapshot);

  // Step 4: Optional Critic pass
  if (useCritic) {
    const criticResponse = await criticizePlan(plan, snapshot);
    plan = await parseAndValidatePlan(criticResponse, snapshot);
  }

  return plan;
}
