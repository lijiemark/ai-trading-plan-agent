"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

export type {
  PlanMode,
  Scenario,
  PlanWorkspace,
  TradeWorkspace,
  PlantedTrade,
} from "@/lib/workspace/clientState";
export { STORAGE_KEY, clearAllLocalWorkspaceStorage };

/** @deprecated Use clearAllLocalWorkspaceStorage */
export const clearLocalWorkspaceStorage = clearAllLocalWorkspaceStorage;

type SendLevelsResult = {
  tradeIntentId: string | null;
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
    sourcePlanId?: string | null;
  }) => Promise<SendLevelsResult>;
  clearLocalWorkspace: () => void;
};

const TraderPalContext = createContext<TraderPalContextValue | null>(null);

export function TraderPalProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id ?? null;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const draftAbortRef = useRef<AbortController | null>(null);

  const [ready, setReady] = useState(false);
  const [plan, setPlanState] = useState<PlanWorkspace>(defaultPlan);
  const [trade, setTradeState] = useState<TradeWorkspace>(defaultTrade);

  // Abort in-flight draft creates on account switch / unmount.
  useEffect(() => {
    return () => {
      draftAbortRef.current?.abort();
    };
  }, [userId]);

  // Hydrate when auth user is known (and again on account switch).
  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;
    draftAbortRef.current?.abort();
    setReady(false);
    setPlanState(defaultPlan);
    setTradeState(defaultTrade);

    async function hydrate() {
      // Per-user cache only — never read legacy unscoped key (cross-account leak).
      if (userId) {
        const cached = loadPersistedForUser(userId);
        if (cached && !cancelled) {
          setPlanState(cached.plan);
          setTradeState({ ...cached.trade, draftPending: false });
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
    savePersistedForUser(userId, {
      plan,
      trade: { ...trade, draftPending: false },
    });
  }, [plan, trade, ready, userId]);

  const setPlan = useCallback((patch: Partial<PlanWorkspace>) => {
    setPlanState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setTrade = useCallback((patch: Partial<TradeWorkspace>) => {
    setTradeState((prev) => ({ ...prev, ...patch }));
  }, []);

  const clearLocalWorkspace = useCallback(() => {
    draftAbortRef.current?.abort();
    clearAllLocalWorkspaceStorage();
    setPlanState(defaultPlan);
    setTradeState(defaultTrade);
  }, []);

  const sendLevelsToTrade = useCallback(
    async (levels: {
      entry: number;
      stop: number;
      target: number;
      sourcePlanId?: string | null;
    }): Promise<SendLevelsResult> => {
      draftAbortRef.current?.abort();
      const controller = new AbortController();
      draftAbortRef.current = controller;
      const requestUserId = userIdRef.current;

      setTradeState({
        tradeIntentId: null,
        entryPrice: String(levels.entry),
        stopLoss: String(levels.stop),
        takeProfit: String(levels.target),
        planted: null,
        draftPending: true,
      });

      try {
        const res = await fetch("/api/trade-intents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            entry: levels.entry,
            stop: levels.stop,
            takeProfit: levels.target,
            status: "draft",
            sourcePlanId: levels.sourcePlanId ?? null,
          }),
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return { tradeIntentId: null };
        }
        // Account switched / signed out while request was in flight.
        if (userIdRef.current !== requestUserId) {
          return { tradeIntentId: null };
        }

        if (!res.ok) {
          setTradeState((prev) => ({ ...prev, draftPending: false }));
          return { tradeIntentId: null };
        }

        const data = (await res.json()) as { id: string };
        if (controller.signal.aborted || userIdRef.current !== requestUserId) {
          return { tradeIntentId: null };
        }

        setTradeState((prev) => ({
          ...prev,
          tradeIntentId: data.id,
          draftPending: false,
        }));
        return { tradeIntentId: data.id };
      } catch {
        if (!controller.signal.aborted && userIdRef.current === requestUserId) {
          setTradeState((prev) => ({ ...prev, draftPending: false }));
        }
        return { tradeIntentId: null };
      }
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
