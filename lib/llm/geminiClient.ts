// Purpose: Gemini 3 client wrapper for generating and validating trading plans.

import { GoogleGenAI } from "@google/genai";
import type { Snapshot } from "../schemas/snapshot";
import type { PlanResponse } from "../schemas/plan";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-pro"; // Default documented here

if (!GEMINI_API_KEY) {
  throw new Error(
    "Missing GEMINI_API_KEY environment variable. Please set it to use the plan API."
  );
}

const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Generate a trading plan using the Strategist agent
 */
export async function generatePlan(
  snapshot: Snapshot,
  mode?: string,
  scenario?: string
): Promise<string> {
  const prompt = buildStrategistPrompt(snapshot, mode, scenario);

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    throw new Error(
      `Gemini API error in generatePlan: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Criticize and improve a draft plan using the Critic agent
 */
export async function criticizePlan(
  plan: PlanResponse,
  snapshot: Snapshot
): Promise<string> {
  const prompt = buildCriticPrompt(plan, snapshot);

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    throw new Error(
      `Gemini API error in criticizePlan: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Repair an invalid plan JSON using a repair-focused prompt
 */
export async function repairPlan(
  invalidPlan: string,
  snapshot: Snapshot,
  validationErrors: string
): Promise<string> {
  const prompt = buildRepairPrompt(invalidPlan, snapshot, validationErrors);

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    throw new Error(
      `Gemini API error in repairPlan: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function buildStrategistPrompt(
  snapshot: Snapshot,
  mode?: string,
  scenario?: string
): string {
  const contextParts: string[] = [];
  if (mode) {
    contextParts.push(`Mode: ${mode}`);
  }
  if (scenario) {
    contextParts.push(`Scenario: ${scenario}`);
  }

  return `You are a trading strategist. Analyze the market snapshot and generate a structured trading plan.

${contextParts.length > 0 ? `Context:\n${contextParts.join("\n")}\n` : ""}

Market Snapshot:
${JSON.stringify(snapshot, null, 2)}

Generate a trading plan as a JSON object matching this exact structure:
{
  "decision": "trade" | "no_trade",
  "reasoning": "brief explanation of your decision",
  "entries": [{"price": number, "label": "optional string"}],  // optional if decision is "no_trade"
  "stops": [{"price": number, "label": "optional string"}],
  "targets": [{"price": number, "label": "optional string"}],
  "sizing": {
    "riskPerTrade": number (optional),
    "positionSize": number (optional),
    "assumptions": "string (optional)"
  },
  "disclaimer": "risk warning text",
  "mode": "${mode || ""}",
  "scenario": "${scenario || ""}"
}

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanatory text. Just the JSON object.`;
}

function buildCriticPrompt(plan: PlanResponse, snapshot: Snapshot): string {
  return `You are a risk and logic critic for trading plans. Review the draft plan and improve it for logic, risk management, and coherence.

Market Snapshot:
${JSON.stringify(snapshot, null, 2)}

Draft Plan:
${JSON.stringify(plan, null, 2)}

Review the plan and return a corrected version as a JSON object matching this exact structure:
{
  "decision": "trade" | "no_trade",
  "reasoning": "improved reasoning",
  "entries": [{"price": number, "label": "optional string"}],
  "stops": [{"price": number, "label": "optional string"}],
  "targets": [{"price": number, "label": "optional string"}],
  "sizing": {
    "riskPerTrade": number (optional),
    "positionSize": number (optional),
    "assumptions": "string (optional)"
  },
  "disclaimer": "risk warning text",
  "mode": "${plan.mode || ""}",
  "scenario": "${plan.scenario || ""}"
}

Focus on:
- Logical consistency between entries, stops, and targets
- Risk management (stop losses are reasonable)
- Coherence with market snapshot indicators
- Realistic sizing assumptions

IMPORTANT: Return ONLY valid JSON. No markdown, no code blocks, no explanatory text. Just the JSON object.`;
}

function buildRepairPrompt(
  invalidPlan: string,
  snapshot: Snapshot,
  validationErrors: string
): string {
  return `The following trading plan JSON failed validation. Repair it to match the required schema.

Validation Errors:
${validationErrors}

Invalid Plan JSON:
${invalidPlan}

Market Snapshot (for context):
${JSON.stringify(snapshot, null, 2)}

Required JSON structure:
{
  "decision": "trade" | "no_trade",
  "reasoning": "string",
  "entries": [{"price": number, "label": "optional string"}],  // optional if decision is "no_trade"
  "stops": [{"price": number, "label": "optional string"}],
  "targets": [{"price": number, "label": "optional string"}],
  "sizing": {
    "riskPerTrade": number (optional),
    "positionSize": number (optional),
    "assumptions": "string (optional)"
  },
  "disclaimer": "string",
  "mode": "string (optional)",
  "scenario": "string (optional)"
}

Extract the JSON from any markdown code blocks if present, fix all validation errors, and return ONLY the corrected JSON object. No markdown, no code blocks, no explanatory text. Just the JSON.`;
}
