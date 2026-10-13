"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useTraderPal } from "@/components/TraderPalProvider";

export default function TradePage() {
  const { plan: planWorkspace, trade, setTrade } = useTraderPal();
  const { tradeIntentId, entryPrice, stopLoss, takeProfit, planted } = trade;
  const [error, setError] = useState<string | null>(null);
  const [planting, setPlanting] = useState(false);

  const plantTrade = async () => {
    setError(null);

    if (!entryPrice || !stopLoss || !takeProfit) {
      setError("Enter entry price, stop loss, and take profit.");
      return;
    }

    const entry = Number(entryPrice);
    const stop = Number(stopLoss);
    const target = Number(takeProfit);

    if ([entry, stop, target].some((n) => Number.isNaN(n))) {
      setError("All fields must be valid numbers.");
      return;
    }

    setPlanting(true);
    try {
      const body = {
        entry,
        stop,
        takeProfit: target,
        status: "planted" as const,
        sourcePlanId: planWorkspace.planId,
      };

      const response = tradeIntentId
        ? await fetch("/api/trade-intents", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: tradeIntentId, ...body }),
          })
        : await fetch("/api/trade-intents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          (errorData as { error?: string }).error || "Failed to plant trade"
        );
      }

      const data = (await response.json()) as { id: string };
      setTrade({
        tradeIntentId: data.id,
        planted: {
          entryPrice: entry.toFixed(2),
          stopLoss: stop.toFixed(2),
          takeProfit: target.toFixed(2),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to plant trade");
    } finally {
      setPlanting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AppHeader subtitle="Trade — define entry, stop, and target, then plant your commitment" />

        <div className="mb-6 rounded-2xl border border-white/20 bg-white/95 p-8 shadow-2xl shadow-blue-900/30 backdrop-blur-xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/50"></div>
            <h2 className="text-xl font-bold text-gray-900">Plant a Trade</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-2">
              <label
                htmlFor="entryPrice"
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700"
              >
                <span className="text-emerald-600">●</span>
                Entry Price
              </label>
              <input
                id="entryPrice"
                type="number"
                inputMode="decimal"
                step="any"
                value={entryPrice}
                onChange={(e) =>
                  setTrade({ entryPrice: e.target.value, planted: null })
                }
                className="block w-full rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 hover:shadow-md focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="6995"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="stopLoss"
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700"
              >
                <span className="text-red-600">●</span>
                Stop Loss
              </label>
              <input
                id="stopLoss"
                type="number"
                inputMode="decimal"
                step="any"
                value={stopLoss}
                onChange={(e) =>
                  setTrade({ stopLoss: e.target.value, planted: null })
                }
                className="block w-full rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 hover:shadow-md focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                placeholder="6985"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="takeProfit"
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700"
              >
                <span className="text-blue-600">●</span>
                Take Profit
              </label>
              <input
                id="takeProfit"
                type="number"
                inputMode="decimal"
                step="any"
                value={takeProfit}
                onChange={(e) =>
                  setTrade({ takeProfit: e.target.value, planted: null })
                }
                className="block w-full rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-200 placeholder:text-gray-400 hover:border-gray-300 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="7015"
              />
            </div>
          </div>

          <div className="my-6 border-t border-gray-200"></div>

          <button
            onClick={() => void plantTrade()}
            disabled={planting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:scale-[1.02] hover:from-emerald-700 hover:via-emerald-700 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {planting ? "Planting…" : "Plant the Trade"}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-900/40 to-red-800/30 p-4 shadow-2xl shadow-red-900/30 backdrop-blur-xl">
            <p className="text-sm font-semibold text-red-200">{error}</p>
          </div>
        )}

        {planted && (
          <div className="rounded-2xl border border-white/20 bg-white/95 p-6 shadow-2xl shadow-blue-900/30 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-600 shadow-lg shadow-emerald-500/50"></div>
              <h2 className="text-lg font-semibold text-gray-900">
                Trade Planted
              </h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-200/50 bg-emerald-50/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                  Entry
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-emerald-900">
                  {planted.entryPrice}
                </p>
              </div>
              <div className="rounded-xl border border-red-200/50 bg-red-50/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-red-800">
                  Stop Loss
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-red-900">
                  {planted.stopLoss}
                </p>
              </div>
              <div className="rounded-xl border border-blue-200/50 bg-blue-50/50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-800">
                  Take Profit
                </p>
                <p className="mt-1 font-mono text-lg font-bold text-blue-900">
                  {planted.takeProfit}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
