import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type Tone = "brand" | "slate" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-red-200",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ className, tone = "slate", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
