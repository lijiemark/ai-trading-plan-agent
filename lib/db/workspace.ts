// Purpose: User-scoped Plan / TradeIntent queries (ownership enforced in WHERE).

import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./index";
import { plans, tradeIntents, type PlanRow, type TradeIntentRow } from "./schema";

export async function insertPlanForUser(input: {
  userId: string;
  symbol: string;
  mode?: string | null;
  scenario?: string | null;
  decision: string;
  planJson: unknown;
  reportJson?: unknown;
  snapshotJson?: unknown;
}): Promise<PlanRow> {
  const db = getDb();
  const [row] = await db
    .insert(plans)
    .values({
      userId: input.userId,
      symbol: input.symbol,
      mode: input.mode ?? null,
      scenario: input.scenario ?? null,
      decision: input.decision,
      planJson: input.planJson,
      reportJson: input.reportJson ?? null,
      snapshotJson: input.snapshotJson ?? null,
    })
    .returning();
  return row;
}

export async function getLatestPlanForUser(
  userId: string
): Promise<PlanRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(plans)
    .where(eq(plans.userId, userId))
    .orderBy(desc(plans.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

/** Returns the plan only if it belongs to userId (cross-account → null). */
export async function getPlanOwnedByUser(
  planId: string,
  userId: string
): Promise<PlanRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function insertTradeIntentForUser(input: {
  userId: string;
  entry: number;
  stop: number;
  takeProfit: number;
  status: string;
  sourcePlanId?: string | null;
  notes?: string | null;
  plantedAt?: Date | null;
}): Promise<TradeIntentRow> {
  const db = getDb();
  const [row] = await db
    .insert(tradeIntents)
    .values({
      userId: input.userId,
      entry: input.entry,
      stop: input.stop,
      takeProfit: input.takeProfit,
      status: input.status,
      sourcePlanId: input.sourcePlanId ?? null,
      notes: input.notes ?? null,
      plantedAt: input.plantedAt ?? null,
    })
    .returning();
  return row;
}

export async function getLatestTradeIntentForUser(
  userId: string
): Promise<TradeIntentRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(tradeIntents)
    .where(eq(tradeIntents.userId, userId))
    .orderBy(desc(tradeIntents.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

/** Returns the intent only if it belongs to userId (cross-account → null). */
export async function getTradeIntentOwnedByUser(
  intentId: string,
  userId: string
): Promise<TradeIntentRow | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(tradeIntents)
    .where(and(eq(tradeIntents.id, intentId), eq(tradeIntents.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Update only if the intent belongs to userId (cross-account → null). */
export async function updateTradeIntentOwnedByUser(input: {
  id: string;
  userId: string;
  entry?: number;
  stop?: number;
  takeProfit?: number;
  status?: string;
  sourcePlanId?: string | null;
  notes?: string | null;
  plantedAt?: Date | null;
}): Promise<TradeIntentRow | null> {
  const db = getDb();
  const patch: Partial<typeof tradeIntents.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.entry !== undefined) patch.entry = input.entry;
  if (input.stop !== undefined) patch.stop = input.stop;
  if (input.takeProfit !== undefined) patch.takeProfit = input.takeProfit;
  if (input.status !== undefined) patch.status = input.status;
  if (input.sourcePlanId !== undefined) patch.sourcePlanId = input.sourcePlanId;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.plantedAt !== undefined) patch.plantedAt = input.plantedAt;

  const rows = await db
    .update(tradeIntents)
    .set(patch)
    .where(
      and(eq(tradeIntents.id, input.id), eq(tradeIntents.userId, input.userId))
    )
    .returning();
  return rows[0] ?? null;
}
