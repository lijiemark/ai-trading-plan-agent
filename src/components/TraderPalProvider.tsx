"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Snapshot } from "@/lib/schemas/snapshot";
import type { PlanResponse } from "@/lib/schemas/plan";
import type { Report } from "@/lib/schemas/report";

export type PlanMode = "normal" | "stress";
export type Scenario = "fake_breakout" | "vwap_reject" | "atr_spike";

export type PlanWorkspace = {
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
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  planted: PlantedTrade | null;
};

type PersistedState = {
  plan: PlanWorkspace;
  trade: TradeWorkspace;
};

type TraderPalContextValue = {
  ready: boolean;
  plan: PlanWorkspace;
  trade: TradeWorkspace;
  setPlan: (patch: Partial<PlanWorkspace>) => void;
  setTrade: (patch: Partial<TradeWorkspace>) => void;
  sendLevelsToTrade: (levels: {
    entry: number;
    stop: number;
    target: number;
  }) => void;
};

const STORAGE_KEY = "traderpal-workspace-v1";

const defaultPlan: PlanWorkspace = {
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

const defaultTrade: TradeWorkspace = {
  entryPrice: "",
  stopLoss: "",
  takeProfit: "",
  planted: null,
};

const TraderPalContext = createContext<TraderPalContextValue | null>(null);

function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
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

export function TraderPalProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [plan, setPlanState] = useState<PlanWorkspace>(defaultPlan);
  const [trade, setTradeState] = useState<TradeWorkspace>(defaultTrade);

  useEffect(() => {
    const saved = loadPersisted();
    if (saved) {
      setPlanState(saved.plan);
      setTradeState(saved.trade);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ plan, trade } satisfies PersistedState)
      );
    } catch {
      // ignore quota / private mode failures
    }
  }, [plan, trade, ready]);

  const setPlan = useCallback((patch: Partial<PlanWorkspace>) => {
    setPlanState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setTrade = useCallback((patch: Partial<TradeWorkspace>) => {
    setTradeState((prev) => ({ ...prev, ...patch }));
  }, []);

  const sendLevelsToTrade = useCallback(
    (levels: { entry: number; stop: number; target: number }) => {
      setTradeState({
        entryPrice: String(levels.entry),
        stopLoss: String(levels.stop),
        takeProfit: String(levels.target),
        planted: null,
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      ready,
      plan,
      trade,
      setPlan,
      setTrade,
      sendLevelsToTrade,
    }),
    [ready, plan, trade, setPlan, setTrade, sendLevelsToTrade]
  );

  return (
    <TraderPalContext.Provider value={value}>
      {children}
    </TraderPalContext.Provider>
  );
}

export function useTraderPal() {
  const ctx = useContext(TraderPalContext);
  if (!ctx) {
    throw new Error("useTraderPal must be used within TraderPalProvider");
  }
  return ctx;
}
