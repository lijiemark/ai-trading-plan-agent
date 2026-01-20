// Purpose: Trading plan API endpoint with Gemini integration.

import { NextResponse } from "next/server";

import { DemoProvider } from "@/lib/providers";
import { buildPlan } from "@/lib/plan/buildPlan";
import { PlanRequestSchema } from "@/lib/schemas/plan";
import { normalizeSymbol } from "@/lib/symbols/normalize";

// Plan caching skipped initially per plan
// If implementing later: use snapshot.asOf in cache key, TTL 5-10s max

export async function POST(request: Request): Promise<NextResponse> {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  // Validate request body with PlanRequestSchema
  let validatedRequest;
  try {
    validatedRequest = PlanRequestSchema.parse(body);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details:
          error instanceof Error && "issues" in error
            ? error
            : error instanceof Error
              ? error.message
              : "Validation failed",
      },
      { status: 400 }
    );
  }

  // Normalize symbol
  let normalized;
  try {
    normalized = normalizeSymbol(validatedRequest.symbol);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unsupported symbol" },
      { status: 400 }
    );
  }

  try {
    const provider = new DemoProvider();

    // Build plan (snapshot caching is handled in buildSnapshot layer)
    const plan = await buildPlan({
      provider,
      symbol: normalized.symbol,
      mode: validatedRequest.mode,
      scenario: validatedRequest.scenario,
      useCritic: validatedRequest.useCritic ?? false,
    });

    if (process.env.NODE_ENV === "development") {
      console.info(
        JSON.stringify({
          event: "plan_generated",
          symbol: normalized.symbol,
          mode: validatedRequest.mode,
          scenario: validatedRequest.scenario,
          useCritic: validatedRequest.useCritic ?? false,
          decision: plan.decision,
        })
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unable to build plan";

    if (process.env.NODE_ENV === "development") {
      console.error(
        JSON.stringify({
          event: "plan_generation_failed",
          symbol: normalized.symbol,
          error: errorMessage,
        })
      );
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
