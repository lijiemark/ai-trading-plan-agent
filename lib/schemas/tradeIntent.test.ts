import { describe, expect, it } from "vitest";
import {
  TradeIntentCreateSchema,
  TradeIntentUpdateSchema,
  canTransitionStatus,
  inferTradeSide,
  validatePriceLevels,
} from "./tradeIntent";

describe("validatePriceLevels", () => {
  it("accepts long ordering", () => {
    expect(
      validatePriceLevels({
        entry: 100,
        stop: 95,
        takeProfit: 110,
        side: "long",
      }).ok
    ).toBe(true);
  });

  it("rejects long with stop above entry", () => {
    const result = validatePriceLevels({
      entry: 100,
      stop: 105,
      takeProfit: 110,
      side: "long",
    });
    expect(result.ok).toBe(false);
  });

  it("accepts short ordering", () => {
    expect(
      validatePriceLevels({
        entry: 100,
        stop: 105,
        takeProfit: 90,
        side: "short",
      }).ok
    ).toBe(true);
  });
});

describe("inferTradeSide", () => {
  it("infers long and short", () => {
    expect(
      inferTradeSide({ entry: 100, stop: 95, takeProfit: 110 })
    ).toBe("long");
    expect(
      inferTradeSide({ entry: 100, stop: 105, takeProfit: 90 })
    ).toBe("short");
  });

  it("returns null when ambiguous", () => {
    expect(
      inferTradeSide({ entry: 100, stop: 100, takeProfit: 100 })
    ).toBeNull();
  });
});

describe("canTransitionStatus", () => {
  it("allows draft → planted and planted → closed", () => {
    expect(canTransitionStatus("draft", "planted")).toBe(true);
    expect(canTransitionStatus("planted", "closed")).toBe(true);
  });

  it("rejects closed → planted and canceled → draft", () => {
    expect(canTransitionStatus("closed", "planted")).toBe(false);
    expect(canTransitionStatus("canceled", "draft")).toBe(false);
  });

  it("allows no-op same status", () => {
    expect(canTransitionStatus("planted", "planted")).toBe(true);
  });
});

describe("TradeIntentCreateSchema", () => {
  it("accepts draft with valid long levels", () => {
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

  it("rejects unordered levels without side", () => {
    expect(() =>
      TradeIntentCreateSchema.parse({
        entry: 100,
        stop: 100,
        takeProfit: 100,
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

  it("requires all three prices when any level changes", () => {
    expect(() =>
      TradeIntentUpdateSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        entry: 100,
      })
    ).toThrow();
  });
});
