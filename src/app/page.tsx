"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { JsonDetails } from "@/components/JsonDetails";
import { StatRow } from "@/components/StatRow";
import type { Snapshot } from "@/lib/schemas/snapshot";
import type { PlanResponse } from "@/lib/schemas/plan";
import type { Report } from "@/lib/schemas/report";

export default function Home() {
  const [symbol, setSymbol] = useState("MES");
  const [useCritic, setUseCritic] = useState(false);
  const [mode, setMode] = useState<"normal" | "stress">("normal");
  const [scenario, setScenario] = useState<
    "fake_breakout" | "vwap_reject" | "atr_spike"
  >("fake_breakout");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSnapshot, setShowSnapshot] = useState(true);
  const [showReport, setShowReport] = useState(true);

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
      setPlan(data.plan);
      setReport(data.report);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate plan"
      );
      setPlan(null);
      setReport(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    // Clear snapshot, plan, and report when symbol changes
    setSnapshot(null);
    setPlan(null);
    setReport(null);
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
        <div className="mb-6 rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl p-8 shadow-2xl shadow-blue-900/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/40">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/50"></div>
            <h2 className="text-xl font-bold text-gray-900">Controls</h2>
          </div>

          {/* Main Controls Grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label
                htmlFor="symbol"
                className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider"
              >
                <span className="text-blue-600">●</span>
                Symbol
              </label>
              <input
                id="symbol"
                type="text"
                value={symbol}
                onChange={(e) => handleSymbolChange(e.target.value)}
                className="block w-full rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 placeholder:text-gray-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300 hover:shadow-md"
                placeholder="MES"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="mode"
                className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider"
              >
                <span className="text-indigo-600">●</span>
                Mode
              </label>
              <select
                id="mode"
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as "normal" | "stress")
                }
                className="block w-full rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-300 hover:shadow-md"
              >
                <option value="normal">Normal</option>
                <option value="stress">Stress</option>
              </select>
              <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-2.5 mt-2">
                <p className="text-xs text-gray-600 leading-relaxed">
                  {mode === "normal"
                    ? "Standard analysis based on current market conditions. Generates a baseline trading plan."
                    : "Stress testing mode. Tests how the plan would perform under adverse market conditions."}
                </p>
              </div>
            </div>

            {mode === "stress" && (
              <div className="space-y-2">
                <label
                  htmlFor="scenario"
                  className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider"
                >
                  <span className="text-amber-600">●</span>
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
                  className="block w-full rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50/50 px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm transition-all duration-200 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 hover:border-gray-300 hover:shadow-md"
                >
                  <option value="fake_breakout">Fake Breakout</option>
                  <option value="vwap_reject">VWAP Reject</option>
                  <option value="atr_spike">ATR Spike</option>
                </select>
                <div className="rounded-lg bg-amber-50/50 border border-amber-100 p-2.5 mt-2">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {scenario === "fake_breakout"
                      ? "Simulates a breakout that quickly reverses, testing how the plan handles false signals."
                      : scenario === "vwap_reject"
                        ? "Tests price rejection at VWAP level, simulating a failed support/resistance test."
                        : "Simulates sudden volatility expansion with wider price ranges, testing risk management."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200"></div>

          {/* Use Critic - Separate Line */}
          <div className="rounded-xl bg-gradient-to-br from-purple-50/50 to-indigo-50/30 border-2 border-purple-100/50 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center px-4 py-2.5 rounded-lg border-2 border-purple-200 bg-white shadow-sm hover:border-purple-300 transition-all duration-200 hover:shadow-md">
                <input
                  id="useCritic"
                  type="checkbox"
                  checked={useCritic}
                  onChange={(e) => setUseCritic(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <label
                  htmlFor="useCritic"
                  className="ml-2.5 block text-sm font-bold text-gray-800 cursor-pointer"
                >
                  Use Critic
                </label>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed pl-1">
              Enables a second pass with Critic Agent to review and improve the initial plan for logic, risk management, and coherence. Takes longer but produces more refined results.
            </p>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-gray-200"></div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={fetchSnapshot}
              disabled={loadingSnapshot || loadingPlan}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-200 hover:from-blue-700 hover:via-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg disabled:hover:shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loadingSnapshot ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>📊</span>
                  <span>Fetch Snapshot</span>
                </>
              )}
            </button>
            <button
              onClick={generatePlan}
              disabled={loadingSnapshot || loadingPlan}
              className="flex-1 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:from-emerald-700 hover:via-emerald-700 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-lg disabled:hover:shadow-emerald-500/30 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loadingPlan ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Generate Plan</span>
                </>
              )}
            </button>
          </div>
          {loadingPlan && (
            <div className="mt-4 rounded-lg bg-amber-50/50 border border-amber-200/50 p-3">
              <p className="text-xs text-amber-800 text-center font-medium">
                ⏱️ Plan generation may take up to a minute. Please be patient...
              </p>
            </div>
          )}
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
                  <StatRow
                    label="Price"
                    value={snapshot.price.toFixed(2)}
                    description="Current market price of the instrument. This is the last traded price and represents the most recent market consensus on value."
                  />
                  <StatRow
                    label="As Of"
                    value={new Date(snapshot.asOf).toLocaleString()}
                    description="Timestamp indicating when this snapshot was generated. Market data is time-sensitive, so this helps you understand the recency of the analysis."
                  />
                  <StatRow
                    label="VWAP"
                    value={snapshot.vwap.value.toFixed(2)}
                    description="Volume Weighted Average Price - the average price a security has traded at throughout the day, based on both volume and price. Prices above VWAP suggest bullish sentiment, while prices below indicate bearish sentiment. VWAP is often used as a support/resistance level."
                  />
                  <StatRow
                    label="VWAP Band Low"
                    value={snapshot.vwap.band.low.toFixed(2)}
                    description="Lower boundary of the VWAP band, typically calculated as VWAP minus a standard deviation. Prices near this level may find support in bullish markets or indicate oversold conditions."
                  />
                  <StatRow
                    label="VWAP Band High"
                    value={snapshot.vwap.band.high.toFixed(2)}
                    description="Upper boundary of the VWAP band, typically calculated as VWAP plus a standard deviation. Prices near this level may find resistance in bearish markets or indicate overbought conditions."
                  />
                  <StatRow
                    label="EMA20 (15m)"
                    value={snapshot.ema.ema20_15m.toFixed(2)}
                    description="20-period Exponential Moving Average on the 15-minute timeframe. EMAs give more weight to recent prices, making them more responsive than Simple Moving Averages. EMA20 is a short-term trend indicator - price above EMA20 suggests short-term bullish momentum."
                  />
                  <StatRow
                    label="EMA50 (15m)"
                    value={snapshot.ema.ema50_15m.toFixed(2)}
                    description="50-period Exponential Moving Average on the 15-minute timeframe. A medium-term trend indicator that smooths out price action. When EMA20 is above EMA50, it suggests an uptrend (bullish stack). When EMA20 is below EMA50, it suggests a downtrend (bearish stack)."
                  />
                  <StatRow
                    label="ADX14 (15m)"
                    value={snapshot.adx.adx14_15m.toFixed(2)}
                    description="Average Directional Index (14-period) on the 15-minute timeframe. ADX measures trend strength, not direction. Values above 25 indicate a strong trend, while values below 20 suggest a weak or ranging market. Higher ADX means more reliable trend signals."
                  />
                  <StatRow
                    label="ATR14 (5m)"
                    value={snapshot.atr.atr14_5m.toFixed(2)}
                    description="Average True Range (14-period) on the 5-minute timeframe. ATR measures market volatility by calculating the average of true ranges over a period. Higher ATR values indicate higher volatility and wider price swings. Traders use ATR to set stop-losses and position sizes based on volatility."
                  />
                  <StatRow
                    label="Above VWAP"
                    value={snapshot.regimeHints.aboveVWAP}
                    description="Indicates whether the current price is above or below the VWAP. 'true' means price is above VWAP, suggesting bullish intraday sentiment. 'false' means price is below VWAP, suggesting bearish intraday sentiment. This is a key regime indicator for day trading."
                  />
                  <StatRow
                    label="EMA Stack"
                    value={snapshot.regimeHints.emaStack}
                    description="Describes the relationship between EMA20 and EMA50. 'bullish' means EMA20 is above EMA50 (short-term trend is stronger than medium-term), indicating upward momentum. 'bearish' means EMA20 is below EMA50, indicating downward momentum. 'neutral' suggests mixed or ranging conditions."
                  />
                  <StatRow
                    label="Provider"
                    value={snapshot.dataSource.provider}
                    description="The data source used to fetch market data. 'demo' uses static sample data, 'live' or 'yahoo' uses Yahoo Finance, and 'polygon' uses Polygon.io. Different providers may have slight variations in data quality and latency."
                  />
                </div>
                <JsonDetails data={snapshot} />
              </div>
            )}
          </div>
        )}

        {/* Zoo Report Card */}
        {report && (
          <div className="mb-6 rounded-2xl border border-white/20 bg-white/95 backdrop-blur-xl p-6 shadow-2xl shadow-blue-900/30 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/40">
            <button
              onClick={() => setShowReport(!showReport)}
              className="flex items-center gap-2 mb-4 w-full text-left hover:opacity-80 transition-opacity"
            >
              <div className="h-2 w-2 rounded-full bg-purple-600 shadow-lg shadow-purple-500/50"></div>
              <h2 className="text-lg font-semibold text-gray-900">Zoo Report</h2>
              <span className="ml-auto text-xs text-gray-500">
                {showReport ? "▼" : "▶"}
              </span>
            </button>
            {showReport && (
              <div className="animate-in slide-in-from-bottom-4 fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Icon */}
                    <div className="text-6xl">
                      {report.bias === "bullish" && (
                        <span className="text-6xl" role="img" aria-label="Bull">
                          🐂
                        </span>
                      )}
                      {report.bias === "bearish" && (
                        <span className="text-6xl" role="img" aria-label="Bear">
                          🐻
                        </span>
                      )}
                      {report.bias === "neutral" && (
                        <span className="text-6xl" role="img" aria-label="Crab">
                          🦀
                        </span>
                      )}
                    </div>
                    {/* Bias and Confidence */}
                    <div className="flex-1">
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide mr-2">
                          Bias:
                        </span>
                        <span
                          className={`text-sm font-bold uppercase ${report.bias === "bullish"
                            ? "text-emerald-600"
                            : report.bias === "bearish"
                              ? "text-red-600"
                              : "text-gray-600"
                            }`}
                        >
                          {report.bias}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Confidence:
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {report.confidence}%
                          </span>
                        </div>
                        {/* Confidence Bar */}
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${report.bias === "bullish"
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                              : report.bias === "bearish"
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : "bg-gradient-to-r from-gray-400 to-gray-500"
                              }`}
                            style={{ width: `${report.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                      {report.summary && (
                        <p className="mt-3 text-sm text-gray-700 italic">
                          {report.summary}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
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
