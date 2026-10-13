/**
 * S1-08 — Cross-account isolation against Neon.
 * Requires DATABASE_URL in .env.local. Skips when unset (CI without secrets).
 *
 * Evidence: user B cannot read/update user A's plan or trade intent by id.
 * Cleanup: deletes temp users (cascade plans/trade_intents).
 */

import { config } from "dotenv";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

config({ path: ".env.local" });

const hasDb = Boolean(process.env.DATABASE_URL);
const describeDb = hasDb ? describe : describe.skip;

describeDb("workspace ownership isolation (Neon)", () => {
  let userA: string;
  let userB: string;
  let planAId: string;
  let intentAId: string;

  beforeAll(async () => {
    const { getDb } = await import("./index");
    const { users } = await import("./schema");
    const {
      insertPlanForUser,
      insertTradeIntentForUser,
    } = await import("./workspace");

    const db = getDb();
    const stamp = Date.now();
    userA = crypto.randomUUID();
    userB = crypto.randomUUID();

    await db.insert(users).values([
      {
        id: userA,
        email: `m4-isolation-a-${stamp}@test.local`,
        name: "M4 User A",
      },
      {
        id: userB,
        email: `m4-isolation-b-${stamp}@test.local`,
        name: "M4 User B",
      },
    ]);

    const plan = await insertPlanForUser({
      userId: userA,
      symbol: "MES",
      mode: "normal",
      decision: "trade",
      planJson: {
        decision: "trade",
        reasoning: "isolation fixture",
        stops: [{ price: 1 }],
        targets: [{ price: 2 }],
        sizing: {},
        disclaimer: "test",
      },
      reportJson: { bias: "neutral", confidence: 50 },
    });
    planAId = plan.id;

    const intent = await insertTradeIntentForUser({
      userId: userA,
      entry: 100,
      stop: 95,
      takeProfit: 110,
      status: "planted",
      sourcePlanId: planAId,
      plantedAt: new Date(),
    });
    intentAId = intent.id;
  }, 60_000);

  afterAll(async () => {
    if (!userA || !userB) return;
    const { getDb } = await import("./index");
    const { users } = await import("./schema");
    const db = getDb();
    await db.delete(users).where(inArray(users.id, [userA, userB]));
  }, 60_000);

  it("latest plan is scoped to owner", async () => {
    const {
      getLatestPlanForUser,
      getPlanOwnedByUser,
    } = await import("./workspace");

    const own = await getLatestPlanForUser(userA);
    expect(own?.id).toBe(planAId);

    const other = await getLatestPlanForUser(userB);
    expect(other).toBeNull();

    expect(await getPlanOwnedByUser(planAId, userA)).not.toBeNull();
    expect(await getPlanOwnedByUser(planAId, userB)).toBeNull();
  });

  it("latest trade intent is scoped to owner", async () => {
    const { getLatestTradeIntentForUser } = await import("./workspace");

    const own = await getLatestTradeIntentForUser(userA);
    expect(own?.id).toBe(intentAId);

    const other = await getLatestTradeIntentForUser(userB);
    expect(other).toBeNull();
  });

  it("update by other user is a no-op (404 path)", async () => {
    const { updateTradeIntentOwnedByUser, getLatestTradeIntentForUser } =
      await import("./workspace");

    const updated = await updateTradeIntentOwnedByUser({
      id: intentAId,
      userId: userB,
      status: "canceled",
      entry: 1,
    });
    expect(updated).toBeNull();

    const still = await getLatestTradeIntentForUser(userA);
    expect(still?.status).toBe("planted");
    expect(still?.entry).toBe(100);
  });

  it("user row exists only for fixtures during test", async () => {
    const { getDb } = await import("./index");
    const { users } = await import("./schema");
    const db = getDb();
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userA));
    expect(rows).toHaveLength(1);
  });
});
