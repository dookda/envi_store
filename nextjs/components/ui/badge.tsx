import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "default";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  success: "bg-success text-white",
  warning: "bg-warning text-white",
  danger:  "bg-danger text-white",
  default: "bg-surface-sunken text-text-secondary",
};

export function Badge({ variant = "default", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
