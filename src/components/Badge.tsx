// Purpose: Badge component for status indicators.

interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "danger" | "warning" | "info";
}

export function Badge({ children, variant = "info" }: BadgeProps) {
  const variants = {
    success: "bg-green-100 text-green-800 border-green-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
