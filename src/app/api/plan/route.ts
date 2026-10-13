// Purpose: Trading plan API — auth required; persists plan under session user.

import { NextResponse } from "next/server";

import { isUnauthorized, requireUser } from "@/lib/auth/requireUser";
import { insertPlanForUser } from "@/lib/db/workspace";
import { createProvider } from "@/lib/providers";
import { buildPlan } from "@/lib/plan/buildPlan";
import { PlanRequestSchema } from "@/lib/schemas/plan";
import { normalizeSymbol } from "@/lib/symbols/normalize";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await requireUser();
  if (isUnauthorized(user)) return user;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

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
    const provider = createProvider();

    const { plan, report } = await buildPlan({
      provider,
      symbol: normalized.symbol,
      mode: validatedRequest.mode,
      scenario: validatedRequest.scenario,
      useCritic: validatedRequest.useCritic ?? false,
    });

    const saved = await insertPlanForUser({
      userId: user.id,
      symbol: normalized.symbol,
      mode: validatedRequest.mode ?? plan.mode ?? null,
      scenario: validatedRequest.scenario ?? plan.scenario ?? null,
      decision: plan.decision,
      planJson: plan,
      reportJson: report,
    });

    if (process.env.NODE_ENV === "development") {
      console.info(
        JSON.stringify({
          event: "plan_generated",
          planId: saved.id,
          userId: user.id,
          symbol: normalized.symbol,
          mode: validatedRequest.mode,
          scenario: validatedRequest.scenario,
          useCritic: validatedRequest.useCritic ?? false,
          decision: plan.decision,
          bias: report.bias,
          confidence: report.confidence,
        })
      );
    }

    return NextResponse.json({ plan, report, planId: saved.id });
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

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
