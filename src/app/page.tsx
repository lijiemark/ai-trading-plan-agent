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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Trading Plan Agent
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Deterministic market snapshot + Gemini planning (decision support
            only)
          </p>
        </header>

        {/* Controls Card */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Controls</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="symbol"
                className="block text-sm font-medium text-gray-700"
              >
                Symbol
              </label>
              <input
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="MES"
              />
            </div>

            <div className="flex items-center">
              <input
                id="useCritic"
                type="checkbox"
                checked={useCritic}
                onChange={(e) => setUseCritic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor="useCritic"
                className="ml-2 block text-sm font-medium text-gray-700"
              >
                Use Critic
              </label>
            </div>

            <div>
              <label
                htmlFor="mode"
                className="block text-sm font-medium text-gray-700"
              >
                Mode
              </label>
              <select
                id="mode"
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as "normal" | "stress")
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="stress">Stress</option>
              </select>
            </div>

            {mode === "stress" && (
              <div>
                <label
                  htmlFor="scenario"
                  className="block text-sm font-medium text-gray-700"
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
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="fake_breakout">Fake Breakout</option>
                  <option value="vwap_reject">VWAP Reject</option>
                  <option value="atr_spike">ATR Spike</option>
                </select>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={fetchSnapshot}
              disabled={loadingSnapshot || loadingPlan}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingSnapshot ? "Loading..." : "Fetch Snapshot"}
            </button>
            <button
              onClick={generatePlan}
              disabled={loadingSnapshot || loadingPlan}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingPlan ? "Generating..." : "Generate Plan"}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Snapshot Card */}
        {snapshot && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Snapshot
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Plan Card */}
        {plan && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Plan</h2>
              <Badge
                variant={plan.decision === "trade" ? "success" : "danger"}
              >
                {plan.decision === "trade" ? "TRADE" : "NO TRADE"}
              </Badge>
            </div>

            {plan.mode && (
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-600">Mode: </span>
                <span className="text-sm text-gray-900">{plan.mode}</span>
              </div>
            )}

            {plan.scenario && (
              <div className="mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Scenario:{" "}
                </span>
                <span className="text-sm text-gray-900">{plan.scenario}</span>
              </div>
            )}

            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-semibold text-gray-700">
                Reasoning
              </h3>
              <p className="text-sm text-gray-900">{plan.reasoning}</p>
            </div>

            {plan.decision === "trade" && (
              <div className="space-y-4">
                {plan.entries && plan.entries.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Entries
                    </h3>
                    <ul className="space-y-1">
                      {plan.entries.map((entry, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-900"
                        >
                          {entry.price.toFixed(2)}
                          {entry.label && ` - ${entry.label}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.stops && plan.stops.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Stops
                    </h3>
                    <ul className="space-y-1">
                      {plan.stops.map((stop, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-900"
                        >
                          {stop.price.toFixed(2)}
                          {stop.label && ` - ${stop.label}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {plan.targets && plan.targets.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-700">
                      Targets
                    </h3>
                    <ul className="space-y-1">
                      {plan.targets.map((target, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-900"
                        >
                          {target.price.toFixed(2)}
                          {target.label && ` - ${target.label}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-700">
                    Sizing
                  </h3>
                  <div className="space-y-1 text-sm text-gray-900">
                    {plan.sizing.riskPerTrade && (
                      <div>
                        Risk per Trade: ${plan.sizing.riskPerTrade.toFixed(2)}
                      </div>
                    )}
                    {plan.sizing.positionSize && (
                      <div>Position Size: {plan.sizing.positionSize}</div>
                    )}
                    {plan.sizing.assumptions && (
                      <div>Assumptions: {plan.sizing.assumptions}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500">{plan.disclaimer}</p>
            </div>

            <JsonDetails data={plan} />
          </div>
        )}
      </div>
    </div>
  );
}
