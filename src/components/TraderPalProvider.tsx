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
import { useSession } from "next-auth/react";
import {
  applyServerWorkspace,
  clearAllLocalWorkspaceStorage,
  defaultPlan,
  defaultTrade,
  loadPersistedForUser,
  savePersistedForUser,
  STORAGE_KEY,
  type PlanWorkspace,
  type TradeWorkspace,
  type WorkspaceApiResponse,
} from "@/lib/workspace/clientState";

export type { PlanMode, Scenario, PlanWorkspace, TradeWorkspace, PlantedTrade } from "@/lib/workspace/clientState";
export { STORAGE_KEY, clearAllLocalWorkspaceStorage };

/** @deprecated Use clearAllLocalWorkspaceStorage */
export const clearLocalWorkspaceStorage = clearAllLocalWorkspaceStorage;

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
    sourcePlanId?: string | null;
  }) => void;
  clearLocalWorkspace: () => void;
};

const TraderPalContext = createContext<TraderPalContextValue | null>(null);

export function TraderPalProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? null;

  const [ready, setReady] = useState(false);
  const [plan, setPlanState] = useState<PlanWorkspace>(defaultPlan);
  const [trade, setTradeState] = useState<TradeWorkspace>(defaultTrade);

  // Hydrate when auth user is known (and again on account switch).
  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;
    setReady(false);
    setPlanState(defaultPlan);
    setTradeState(defaultTrade);

    async function hydrate() {
      // Per-user cache only — never read legacy unscoped key (cross-account leak).
      if (userId) {
        const cached = loadPersistedForUser(userId);
        if (cached && !cancelled) {
          setPlanState(cached.plan);
          setTradeState(cached.trade);
        }
      }

      try {
        const res = await fetch("/api/workspace");
        if (res.ok) {
          const data = (await res.json()) as WorkspaceApiResponse;
          const fromServer = applyServerWorkspace(data);
          if (!cancelled) {
            if (fromServer) {
              setPlanState(fromServer.plan);
              setTradeState(fromServer.trade);
            } else {
              // Empty server workspace wins over any stale local cache.
              setPlanState(defaultPlan);
              setTradeState(defaultTrade);
            }
          }
        } else if (res.status === 401 && !cancelled) {
          setPlanState(defaultPlan);
          setTradeState(defaultTrade);
        }
      } catch {
        // Keep per-user cache / defaults if offline
      }

      if (!cancelled) setReady(true);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [userId, status]);

  useEffect(() => {
    if (!ready || !userId) return;
    savePersistedForUser(userId, { plan, trade });
  }, [plan, trade, ready, userId]);

  const setPlan = useCallback((patch: Partial<PlanWorkspace>) => {
    setPlanState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setTrade = useCallback((patch: Partial<TradeWorkspace>) => {
    setTradeState((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearLocalWorkspace = useCallback(() => {
    clearAllLocalWorkspaceStorage();
    setPlanState(defaultPlan);
    setTradeState(defaultTrade);
  }, []);

  const sendLevelsToTrade = useCallback(
    (levels: {
      entry: number;
      stop: number;
      target: number;
      sourcePlanId?: string | null;
    }) => {
      setTradeState({
        tradeIntentId: null,
        entryPrice: String(levels.entry),
        stopLoss: String(levels.stop),
        takeProfit: String(levels.target),
        planted: null,
      });
      void fetch("/api/trade-intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry: levels.entry,
          stop: levels.stop,
          takeProfit: levels.target,
          status: "draft",
          sourcePlanId: levels.sourcePlanId ?? null,
        }),
      })
        .then(async (res) => {
          if (!res.ok) return;
          const data = (await res.json()) as { id: string };
          setTradeState((prev) => ({ ...prev, tradeIntentId: data.id }));
        })
        .catch(() => {
          // Local UI still works if persist fails
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
      clearLocalWorkspace,
    }),
    [
      ready,
      plan,
      trade,
      setPlan,
      setTrade,
      sendLevelsToTrade,
      clearLocalWorkspace,
    ]
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
