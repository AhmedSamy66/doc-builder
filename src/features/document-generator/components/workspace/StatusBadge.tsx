"use client";

import { cn } from "@/src/components/ui/styles";

type StatusBadgeProps = {
  children: string;
  tone?: "neutral" | "success" | "warning";
};

export function StatusBadge({
  children,
  tone = "neutral",
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "success" &&
          "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
        tone === "warning" &&
          "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
        tone === "neutral" && "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
      )}
    >
      {children}
    </span>
  );
}
