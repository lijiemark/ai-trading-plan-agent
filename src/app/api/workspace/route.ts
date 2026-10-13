// Purpose: Hydrate latest Plan + TradeIntent for the authenticated user.

import { NextResponse } from "next/server";

import { isUnauthorized, requireUser } from "@/lib/auth/requireUser";
import {
  getLatestPlanForUser,
  getLatestTradeIntentForUser,
} from "@/lib/db/workspace";
import type { PlanResponse } from "@/lib/schemas/plan";
import type { Report } from "@/lib/schemas/report";
import type { Snapshot } from "@/lib/schemas/snapshot";

export async function GET(): Promise<NextResponse> {
  const user = await requireUser();
  if (isUnauthorized(user)) return user;

  const [latestPlan, latestIntent] = await Promise.all([
    getLatestPlanForUser(user.id),
    getLatestTradeIntentForUser(user.id),
  ]);

  return NextResponse.json({
    plan: latestPlan
      ? {
          id: latestPlan.id,
          symbol: latestPlan.symbol,
          mode: latestPlan.mode,
          scenario: latestPlan.scenario,
          decision: latestPlan.decision,
          plan: latestPlan.planJson as PlanResponse,
          report: (latestPlan.reportJson as Report | null) ?? null,
          snapshot: (latestPlan.snapshotJson as Snapshot | null) ?? null,
          createdAt: latestPlan.createdAt.toISOString(),
        }
      : null,
    tradeIntent: latestIntent
      ? {
          id: latestIntent.id,
          entry: latestIntent.entry,
          stop: latestIntent.stop,
          takeProfit: latestIntent.takeProfit,
          status: latestIntent.status,
          sourcePlanId: latestIntent.sourcePlanId,
          plantedAt: latestIntent.plantedAt?.toISOString() ?? null,
          createdAt: latestIntent.createdAt.toISOString(),
        }
      : null,
  });
}
