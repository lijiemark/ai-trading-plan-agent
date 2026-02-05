"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { JsonDetails } from "@/components/JsonDetails";
import { StatRow } from "@/components/StatRow";
import type { Snapshot } from "@/lib/schemas/snapshot";
import type { PlanResponse } from "@/lib/schemas/plan";

export default function Home() {
  const [symbol, setSymbol] = useState("MES");
  const [useCritic, setUseCritic] = useState(false);
  const [mode, setMode] = useState<"normal" | "stress">("normal");
  const [scenario, setScenario] = useState<
    "fake_breakout" | "vwap_reject" | "atr_spike"
  >("fake_breakout");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSnapshot, setShowSnapshot] = useState(true);

  const fetchSnapshot = async () => {
    setLoadingSnapshot(true);
    setError(null);
    try {
      const response = await fetch(`/api/snapshot?symbol=${symbol}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch snapshot");
      }
      const data = await response.json();
      setSnapshot(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch snapshot"
      );
      setSnapshot(null);
    } finally {
      setLoadingSnapshot(false);
    }
  };

  const generatePlan = async () => {
    setLoadingPlan(true);
    setError(null);

    // Optionally fetch snapshot first if not available or symbol changed
    if (!snapshot || snapshot.symbol !== symbol) {
      try {
        await fetchSnapshot();
        // Wait a bit for snapshot to be set
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (err) {
        setLoadingPlan(false);
        return;
      }
    }

    try {
      const requestBody: {
        symbol: string;
        mode?: string;
        scenario?: string;
        useCritic?: boolean;
      } = {
        symbol,
        useCritic,
      };

      if (mode === "stress") {
        requestBody.mode = "stress";
        requestBody.scenario = scenario;
      } else {
        requestBody.mode = "normal";
      }

      const response = await fetch("/api/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate plan");
      }

      const data = await response.json();
      setPlan(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate plan"
      );
      setPlan(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    // Clear snapshot and plan when symbol changes
    setSnapshot(null);
    setPlan(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-1 w-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
              AI Trading Plan Agent
            </h1>
          </div>
          <p className="text-sm text-blue-200/80 font-medium ml-[60px]">
            Deterministic market snapshot + Gemini planning (decision support
            only)
          </p>
        </header>

        {/* Controls Card */}
        <div className="mb-6 rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl p-6 shadow-2xl shadow-blue-900/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/40">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-2 w-2 rounded-full bg-blue-600 shadow-lg shadow-blue-500/50"></div>
            <h2 className="text-lg font-semibold text-gray-900">Controls</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="symbol"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2"
              >
                Symbol
              </label>
              <input
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
                placeholder="MES"
              />
            </div>

            <div className="flex items-end">
              <div className="flex items-center h-10 px-4 rounded-lg border border-gray-300 bg-white shadow-sm hover:border-gray-400 transition-colors">
                <input
                  id="useCritic"
                  type="checkbox"
                  checked={useCritic}
                  onChange={(e) => setUseCritic(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <label
                  htmlFor="useCritic"
                  className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer"
                >
                  Use Critic
                </label>
              </div>
            </div>

            <div>
              <label
                htmlFor="mode"
                className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2"
              >
                Mode
              </label>
              <select
                id="mode"
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as "normal" | "stress")
                }
                className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
              >
                <option value="normal">Normal</option>
                <option value="stress">Stress</option>
              </select>
            </div>

            {mode === "stress" && (
              <div>
                <label
                  htmlFor="scenario"
                  className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2"
                >
                  Scenario
                </label>
                <select
                  id="scenario"
                  value={scenario}
                  onChange={(e) =>
                    setScenario(
                      e.target.value as
                        | "fake_breakout"
                        | "vwap_reject"
                        | "atr_spike"
                    )
                  }
                  className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400"
                >
                  <option value="fake_breakout">Fake Breakout</option>
                  <option value="vwap_reject">VWAP Reject</option>
                  <option value="atr_spike">ATR Spike</option>
                </select>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={fetchSnapshot}
              disabled={loadingSnapshot || loadingPlan}
              className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg disabled:hover:shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loadingSnapshot ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Loading...
                </span>
              ) : (
                "Fetch Snapshot"
              )}
            </button>
            <button
              onClick={generatePlan}
              disabled={loadingSnapshot || loadingPlan}
              className="flex-1 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg disabled:hover:shadow-emerald-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loadingPlan ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Generating...
                </span>
              ) : (
                "Generate Plan"
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 animate-in slide-in-from-top-2 rounded-xl border border-red-500/30 bg-gradient-to-r from-red-900/40 to-red-800/30 backdrop-blur-xl p-4 shadow-2xl shadow-red-900/30">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-400 shadow-lg shadow-red-400/50"></div>
              <p className="text-sm font-semibold text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Snapshot Card */}
        {snapshot && (
          <div className="mb-6 rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl p-6 shadow-2xl shadow-blue-900/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/40">
            <button
              onClick={() => setShowSnapshot(!showSnapshot)}
              className="flex items-center gap-2 mb-6 w-full text-left hover:opacity-80 transition-opacity"
            >
              <div className="h-2 w-2 rounded-full bg-indigo-600 shadow-lg shadow-indigo-500/50"></div>
              <h2 className="text-lg font-semibold text-gray-900">Market Snapshot</h2>
              <span className="ml-auto text-xs text-gray-500">
                {showSnapshot ? "▼" : "▶"}
              </span>
            </button>
            {showSnapshot && (
              <div className="animate-in slide-in-from-bottom-4 fade-in">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <StatRow label="Symbol" value={snapshot.symbol} />
              <StatRow label="Price" value={snapshot.price.toFixed(2)} />
              <StatRow
                label="As Of"
                value={new Date(snapshot.asOf).toLocaleString()}
              />
              <StatRow
                label="VWAP"
                value={snapshot.vwap.value.toFixed(2)}
              />
              <StatRow
                label="VWAP Band Low"
                value={snapshot.vwap.band.low.toFixed(2)}
              />
              <StatRow
                label="VWAP Band High"
                value={snapshot.vwap.band.high.toFixed(2)}
              />
              <StatRow
                label="EMA20 (15m)"
                value={snapshot.ema.ema20_15m.toFixed(2)}
              />
              <StatRow
                label="EMA50 (15m)"
                value={snapshot.ema.ema50_15m.toFixed(2)}
              />
              <StatRow
                label="ADX14 (15m)"
                value={snapshot.adx.adx14_15m.toFixed(2)}
              />
              <StatRow
                label="ATR14 (5m)"
                value={snapshot.atr.atr14_5m.toFixed(2)}
              />
              <StatRow
                label="Above VWAP"
                value={snapshot.regimeHints.aboveVWAP}
              />
              <StatRow
                label="EMA Stack"
                value={snapshot.regimeHints.emaStack}
              />
              <StatRow
                label="Provider"
                value={snapshot.dataSource.provider}
              />
                </div>
                <JsonDetails data={snapshot} />
              </div>
            )}
          </div>
        )}

        {/* Plan Card */}
        {plan && (
          <div className="mb-6 animate-in slide-in-from-bottom-4 fade-in rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl p-6 shadow-2xl shadow-blue-900/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/40">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-600 shadow-lg shadow-emerald-500/50"></div>
                <h2 className="text-lg font-semibold text-gray-900">Trading Plan</h2>
              </div>
              <Badge
                variant={plan.decision === "trade" ? "success" : "danger"}
              >
                {plan.decision === "trade" ? "TRADE" : "NO TRADE"}
              </Badge>
            </div>

            {(plan.mode || plan.scenario) && (
              <div className="mb-4 flex flex-wrap gap-3">
                {plan.mode && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Mode: </span>
                    <span className="text-xs font-medium text-blue-900">{plan.mode}</span>
                  </div>
                )}
                {plan.scenario && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5">
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                      Scenario:{" "}
                    </span>
                    <span className="text-xs font-medium text-amber-900">{plan.scenario}</span>
                  </div>
                )}
              </div>
            )}

            <div className="mb-6 rounded-xl bg-gradient-to-br from-gray-50 to-blue-50/30 p-5 border border-gray-200">
              <h3 className="mb-3 text-sm font-bold text-gray-800 uppercase tracking-wide">
                Reasoning
              </h3>
              <p className="text-sm leading-relaxed text-gray-700">{plan.reasoning}</p>
            </div>

            {plan.decision === "trade" && (
              <div className="space-y-5">
                {plan.entries && plan.entries.length > 0 && (
                  <div className="rounded-xl bg-emerald-50/50 border border-emerald-200/50 p-4">
                    <h3 className="mb-3 text-sm font-bold text-emerald-900 uppercase tracking-wide">
                      Entries
                    </h3>
                    <ul className="space-y-2">
                      {plan.entries.map((entry, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm font-medium text-emerald-900"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                          <span className="font-mono font-semibold">{entry.price.toFixed(2)}</span>
                          {entry.label && <span className="text-emerald-700">— {entry.label}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.stops && plan.stops.length > 0 && (
                  <div className="rounded-xl bg-red-50/50 border border-red-200/50 p-4">
                    <h3 className="mb-3 text-sm font-bold text-red-900 uppercase tracking-wide">
                      Stops
                    </h3>
                    <ul className="space-y-2">
                      {plan.stops.map((stop, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm font-medium text-red-900"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
                          <span className="font-mono font-semibold">{stop.price.toFixed(2)}</span>
                          {stop.label && <span className="text-red-700">— {stop.label}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.targets && plan.targets.length > 0 && (
                  <div className="rounded-xl bg-blue-50/50 border border-blue-200/50 p-4">
                    <h3 className="mb-3 text-sm font-bold text-blue-900 uppercase tracking-wide">
                      Targets
                    </h3>
                    <ul className="space-y-2">
                      {plan.targets.map((target, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-2 text-sm font-medium text-blue-900"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                          <span className="font-mono font-semibold">{target.price.toFixed(2)}</span>
                          {target.label && <span className="text-blue-700">— {target.label}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                  <h3 className="mb-3 text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Sizing
                  </h3>
                  <div className="space-y-2 text-sm text-slate-800">
                    {plan.sizing.riskPerTrade && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Risk per Trade:</span>
                        <span className="font-mono font-bold text-slate-900">${plan.sizing.riskPerTrade.toFixed(2)}</span>
                      </div>
                    )}
                    {plan.sizing.positionSize && (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Position Size:</span>
                        <span className="font-mono font-bold text-slate-900">{plan.sizing.positionSize}</span>
                      </div>
                    )}
                    {plan.sizing.assumptions && (
                      <div>
                        <span className="font-semibold">Assumptions: </span>
                        <span className="text-slate-700">{plan.sizing.assumptions}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 leading-relaxed">{plan.disclaimer}</p>
            </div>

            <JsonDetails data={plan} />
          </div>
        )}
        </div>
    </div>
  );
}
