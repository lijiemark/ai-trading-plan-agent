"use client";

import { useState } from "react";

// Purpose: Stat row component for displaying key-value pairs with optional descriptions.

interface StatRowProps {
  label: string;
  value: string | number | boolean | React.ReactNode;
  description?: string;
}

export function StatRow({ label, value, description }: StatRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayValue =
    typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);

  const isClickable = !!description;

  return (
    <div className="rounded-lg border border-gray-100 bg-white/50 transition-all duration-200 hover:border-gray-200 hover:bg-white hover:shadow-sm">
      <button
        onClick={() => isClickable && setIsExpanded(!isExpanded)}
        disabled={!isClickable}
        className={`w-full px-4 py-3 flex justify-between items-center transition-all ${
          isClickable ? "cursor-pointer hover:opacity-80" : "cursor-default"
        }`}
      >
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-bold text-gray-900">{displayValue}</span>
          {isClickable && (
            <span className="text-xs text-gray-400">
              {isExpanded ? "▼" : "▶"}
            </span>
          )}
        </div>
      </button>
      {isExpanded && description && (
        <div className="px-4 pb-3 pt-0 border-t border-gray-100 animate-in slide-in-from-top-2 fade-in">
          <p className="text-xs text-gray-600 leading-relaxed mt-2">{description}</p>
        </div>
      )}
    </div>
  );
}
