import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  STORAGE_KEY,
  applyServerWorkspace,
  clearAllLocalWorkspaceStorage,
  defaultPlan,
  loadPersistedForUser,
  savePersistedForUser,
  storageKeyForUser,
} from "./clientState";

function installMemorySessionStorage() {
  const store = new Map<string, string>();
  const memory = {
    get length() {
      return store.size;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
  vi.stubGlobal("sessionStorage", memory);
  vi.stubGlobal("window", { sessionStorage: memory });
}

describe("storageKeyForUser", () => {
  it("scopes cache by user id", () => {
    expect(storageKeyForUser("user-a")).toBe(`${STORAGE_KEY}:user-a`);
    expect(storageKeyForUser("user-a")).not.toBe(storageKeyForUser("user-b"));
  });
});

describe("applyServerWorkspace", () => {
  it("returns null for empty payload (second device with no data)", () => {
    expect(applyServerWorkspace({ plan: null, tradeIntent: null })).toBeNull();
  });

  it("maps owned plan + planted intent", () => {
    const state = applyServerWorkspace({
      plan: {
        id: "plan-1",
        symbol: "MNQ",
        mode: "normal",
        scenario: null,
        plan: {
          decision: "trade",
          reasoning: "test",
          stops: [{ price: 1 }],
          targets: [{ price: 3 }],
          sizing: {},
          disclaimer: "n/a",
        },
        report: { bias: "bullish", confidence: 70 },
        snapshot: null,
      },
      tradeIntent: {
        id: "ti-1",
        entry: 100.5,
        stop: 99,
        takeProfit: 102,
        status: "planted",
        sourcePlanId: "plan-1",
      },
    });

    expect(state?.plan.planId).toBe("plan-1");
    expect(state?.plan.symbol).toBe("MNQ");
    expect(state?.plan.plan?.decision).toBe("trade");
    expect(state?.trade.tradeIntentId).toBe("ti-1");
    expect(state?.trade.planted?.entryPrice).toBe("100.50");
    expect(state?.trade.entryPrice).toBe("100.50");
  });

  it("does not mark draft intents as planted UI", () => {
    const state = applyServerWorkspace({
      plan: null,
      tradeIntent: {
        id: "ti-draft",
        entry: 10,
        stop: 9,
        takeProfit: 11,
        status: "draft",
        sourcePlanId: null,
      },
    });
    expect(state?.trade.planted).toBeNull();
    expect(state?.trade.entryPrice).toBe("10.00");
  });
});

describe("per-user sessionStorage isolation", () => {
  beforeEach(() => {
    installMemorySessionStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not leak user A cache to user B", () => {
    savePersistedForUser("user-a", {
      plan: { ...defaultPlan, symbol: "MES", planId: "a-plan" },
      trade: {
        tradeIntentId: "a-ti",
        entryPrice: "1",
        stopLoss: "0",
        takeProfit: "2",
        planted: null,
      },
    });

    expect(loadPersistedForUser("user-b")).toBeNull();
    expect(loadPersistedForUser("user-a")?.plan.planId).toBe("a-plan");
  });

  it("clearAllLocalWorkspaceStorage removes legacy and scoped keys", () => {
    sessionStorage.setItem(STORAGE_KEY, "legacy");
    savePersistedForUser("user-a", {
      plan: defaultPlan,
      trade: {
        tradeIntentId: null,
        entryPrice: "",
        stopLoss: "",
        takeProfit: "",
        planted: null,
      },
    });

    clearAllLocalWorkspaceStorage();

    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(storageKeyForUser("user-a"))).toBeNull();
  });
});
