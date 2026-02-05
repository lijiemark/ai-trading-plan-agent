// Purpose: Stat row component for displaying key-value pairs.

interface StatRowProps {
  label: string;
  value: string | number | boolean | React.ReactNode;
}

export function StatRow({ label, value }: StatRowProps) {
  const displayValue =
    typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);

  return (
    <div className="group flex justify-between rounded-lg border border-gray-100 bg-white/50 px-4 py-3 transition-all duration-200 hover:border-gray-200 hover:bg-white hover:shadow-sm">
      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
      <span className="text-sm font-mono font-bold text-gray-900">{displayValue}</span>
    </div>
  );
}
