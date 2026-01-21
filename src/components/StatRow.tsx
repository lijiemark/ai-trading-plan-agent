// Purpose: Stat row component for displaying key-value pairs.

interface StatRowProps {
  label: string;
  value: string | number | boolean | React.ReactNode;
}

export function StatRow({ label, value }: StatRowProps) {
  const displayValue =
    typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);

  return (
    <div className="flex justify-between border-b border-gray-100 py-2">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className="text-sm font-mono text-gray-900">{displayValue}</span>
    </div>
  );
}
