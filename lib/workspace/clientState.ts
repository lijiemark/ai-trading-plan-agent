// Purpose: Pure workspace hydrate/cache helpers (sessionStorage keyed by user).

import type { Snapshot } from "@/lib/schemas/snapshot";
import type { PlanResponse } from "@/lib/schemas/plan";
import type { Report } from "@/lib/schemas/report";

export type PlanMode = "normal" | "stress";
export type Scenario = "fake_breakout" | "vwap_reject" | "atr_spike";

export type PlanWorkspace = {
  planId: string | null;
  symbol: string;
  useCritic: boolean;
  mode: PlanMode;
  scenario: Scenario;
  snapshot: Snapshot | null;
  plan: PlanResponse | null;
  report: Report | null;
  showSnapshot: boolean;
  showReport: boolean;
};

export type PlantedTrade = {
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
};

export type TradeWorkspace = {
  tradeIntentId: string | null;
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  planted: PlantedTrade | null;
};

export type PersistedState = {
  plan: PlanWorkspace;
  trade: TradeWorkspace;
};

export type WorkspaceApiResponse = {
  plan: {
    id: string;
    symbol: string;
    mode: string | null;
    scenario: string | null;
    plan: PlanResponse;
    report: Report | null;
    snapshot: Snapshot | null;
  } | null;
  tradeIntent: {
    id: string;
    entry: number;
    stop: number;
    takeProfit: number;
    status: string;
    sourcePlanId: string | null;
  } | null;
};

/** Legacy unscoped key — cleared on logout; never read for hydrate after M4. */
export const STORAGE_KEY = "traderpal-workspace-v1";

export const defaultPlan: PlanWorkspace = {
  planId: null,
  symbol: "MES",
  useCritic: false,
  mode: "normal",
  scenario: "fake_breakout",
  snapshot: null,
  plan: null,
  report: null,
  showSnapshot: true,
  showReport: true,
};

export const defaultTrade: TradeWorkspace = {
  tradeIntentId: null,
  entryPrice: "",
  stopLoss: "",
  takeProfit: "",
  planted: null,
};

export function storageKeyForUser(userId: string): string {
  return `${STORAGE_KEY}:${userId}`;
}

/** Map server workspace payload → UI state. Empty DB → null (caller resets defaults). */
export function applyServerWorkspace(
  data: WorkspaceApiResponse
): PersistedState | null {
  if (!data.plan && !data.tradeIntent) return null;

  const plan: PlanWorkspace = { ...defaultPlan };
  if (data.plan) {
    plan.planId = data.plan.id;
    plan.symbol = data.plan.symbol || defaultPlan.symbol;
    if (data.plan.mode === "stress" || data.plan.mode === "normal") {
      plan.mode = data.plan.mode;
    }
    if (
      data.plan.scenario === "fake_breakout" ||
      data.plan.scenario === "vwap_reject" ||
      data.plan.scenario === "atr_spike"
    ) {
      plan.scenario = data.plan.scenario;
    }
    plan.plan = data.plan.plan;
    plan.report = data.plan.report;
    plan.snapshot = data.plan.snapshot;
  }

  const trade: TradeWorkspace = { ...defaultTrade };
  if (data.tradeIntent) {
    const entry = data.tradeIntent.entry.toFixed(2);
    const stop = data.tradeIntent.stop.toFixed(2);
    const target = data.tradeIntent.takeProfit.toFixed(2);
    trade.tradeIntentId = data.tradeIntent.id;
    trade.entryPrice = entry;
    trade.stopLoss = stop;
    trade.takeProfit = target;
    if (data.tradeIntent.status === "planted") {
      trade.planted = {
        entryPrice: entry,
        stopLoss: stop,
        takeProfit: target,
      };
    }
  }

  return { plan, trade };
}

export function loadPersistedForUser(userId: string): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKeyForUser(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      plan: { ...defaultPlan, ...parsed.plan },
      trade: { ...defaultTrade, ...parsed.trade },
    };
  } catch {
    return null;
  }
}

export function savePersistedForUser(
  userId: string,
  state: PersistedState
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      storageKeyForUser(userId),
      JSON.stringify(state)
    );
  } catch {
    // ignore quota / private mode
  }
}

/** Remove legacy + all per-user workspace cache keys (logout / account switch). */
export function clearAllLocalWorkspaceStorage(): void {
  if (typeof window === "undefined") return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key === STORAGE_KEY || key?.startsWith(`${STORAGE_KEY}:`)) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}
