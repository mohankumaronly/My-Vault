import { ShieldCheck } from "lucide-react";
import { cn } from "../../utils/cn";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const box = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9";
  const icon = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const text = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("grid place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm", box)}>
        <ShieldCheck className={icon} />
      </div>
      {showText && (
        <span className={cn("font-bold tracking-tight text-slate-900 dark:text-white", text)}>
          My<span className="text-brand-600">Vault</span>
        </span>
      )}
    </div>
  );
}
