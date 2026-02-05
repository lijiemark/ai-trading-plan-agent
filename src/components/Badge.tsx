// Purpose: Badge component for status indicators.

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "danger" | "warning" | "info";
}

export function Badge({ children, variant = "info" }: BadgeProps) {
  const variants = {
    success: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-500/30",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white border-red-400 shadow-lg shadow-red-500/30",
    warning: "bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-400 shadow-lg shadow-amber-500/30",
    info: "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-blue-400 shadow-lg shadow-blue-500/30",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-200 ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
