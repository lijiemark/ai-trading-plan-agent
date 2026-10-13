import { describe, expect, it } from "vitest";
import {
  TradeIntentCreateSchema,
  TradeIntentUpdateSchema,
} from "./tradeIntent";

describe("TradeIntentCreateSchema", () => {
  it("accepts draft with levels", () => {
    const parsed = TradeIntentCreateSchema.parse({
      entry: 100,
      stop: 95,
      takeProfit: 110,
    });
    expect(parsed.status).toBe("draft");
  });

  it("rejects non-finite numbers", () => {
    expect(() =>
      TradeIntentCreateSchema.parse({
        entry: Number.NaN,
        stop: 1,
        takeProfit: 2,
      })
    ).toThrow();
  });
});

describe("TradeIntentUpdateSchema", () => {
  it("requires uuid id", () => {
    expect(() =>
      TradeIntentUpdateSchema.parse({ id: "not-a-uuid", status: "planted" })
    ).toThrow();

    const id = "550e8400-e29b-41d4-a716-446655440000";
    const parsed = TradeIntentUpdateSchema.parse({ id, status: "planted" });
    expect(parsed.id).toBe(id);
  });
});
