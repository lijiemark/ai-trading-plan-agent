// Purpose: Create/update trade intents — always scoped to session user.

import { NextResponse } from "next/server";

import { isUnauthorized, requireUser } from "@/lib/auth/requireUser";
import {
  getPlanOwnedByUser,
  insertTradeIntentForUser,
  updateTradeIntentOwnedByUser,
} from "@/lib/db/workspace";
import {
  TradeIntentCreateSchema,
  TradeIntentUpdateSchema,
} from "@/lib/schemas/tradeIntent";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await requireUser();
  if (isUnauthorized(user)) return user;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = TradeIntentCreateSchema.parse(body);
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

  if (parsed.sourcePlanId) {
    const owned = await getPlanOwnedByUser(parsed.sourcePlanId, user.id);
    if (!owned) {
      return NextResponse.json(
        { error: "sourcePlanId not found" },
        { status: 404 }
      );
    }
  }

  const plantedAt = parsed.status === "planted" ? new Date() : null;
  const row = await insertTradeIntentForUser({
    userId: user.id,
    entry: parsed.entry,
    stop: parsed.stop,
    takeProfit: parsed.takeProfit,
    status: parsed.status,
    sourcePlanId: parsed.sourcePlanId ?? null,
    notes: parsed.notes ?? null,
    plantedAt,
  });

  return NextResponse.json(
    {
      id: row.id,
      entry: row.entry,
      stop: row.stop,
      takeProfit: row.takeProfit,
      status: row.status,
      sourcePlanId: row.sourcePlanId,
      plantedAt: row.plantedAt?.toISOString() ?? null,
    },
    { status: 201 }
  );
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const user = await requireUser();
  if (isUnauthorized(user)) return user;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = TradeIntentUpdateSchema.parse(body);
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

  if (parsed.sourcePlanId) {
    const owned = await getPlanOwnedByUser(parsed.sourcePlanId, user.id);
    if (!owned) {
      return NextResponse.json(
        { error: "sourcePlanId not found" },
        { status: 404 }
      );
    }
  }

  const plantedAt =
    parsed.status === "planted" ? new Date() : undefined;

  const row = await updateTradeIntentOwnedByUser({
    id: parsed.id,
    userId: user.id,
    entry: parsed.entry,
    stop: parsed.stop,
    takeProfit: parsed.takeProfit,
    status: parsed.status,
    sourcePlanId: parsed.sourcePlanId,
    notes: parsed.notes,
    plantedAt,
  });

  // Missing or other-user id → same 404 (no existence leak).
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: row.id,
    entry: row.entry,
    stop: row.stop,
    takeProfit: row.takeProfit,
    status: row.status,
    sourcePlanId: row.sourcePlanId,
    plantedAt: row.plantedAt?.toISOString() ?? null,
  });
}
