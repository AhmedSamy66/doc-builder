"use client";

import type { ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/src/components/ui";
import { cn, fieldLabelClassName } from "@/src/components/ui/styles";

export function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700"
    >
      {children}
    </span>
  );
}

export function OptionCheckboxField({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm shadow-slate-950/5 transition hover:border-slate-300 hover:bg-slate-50">
      <input
        checked={checked}
        className="peer sr-only"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span
        aria-hidden="true"
        className="flex h-5 w-5 items-center justify-center rounded-md border border-slate-300 bg-white text-transparent transition peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-blue-500/15"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
      {label}
    </label>
  );
}

export function RequiredToggleField({
  checked,
  className,
  onChange,
}: {
  checked: boolean;
  className?: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={cn("group block cursor-pointer", className)}>
      <input
        checked={checked}
        className="peer sr-only"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span className={fieldLabelClassName}>Required</span>
      <span className="mt-2 flex h-12 items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-sm shadow-sm shadow-slate-950/5 transition hover:border-slate-300 hover:bg-white">
        <span className="min-w-0 text-sm font-semibold leading-4 text-slate-800">
          {checked ? "Must be filled" : "Optional"}
        </span>
        <span
          aria-hidden="true"
          className="relative h-6 w-11 shrink-0 rounded-full border border-slate-300 bg-white shadow-inner transition group-focus-within:ring-4 group-focus-within:ring-blue-500/15 group-has-checked:border-blue-600 group-has-checked:bg-blue-600"
        >
          <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-slate-300 shadow-sm transition group-has-checked:translate-x-5 group-has-checked:bg-white" />
        </span>
      </span>
    </label>
  );
}

export function ActionButton({
  children,
  disabled,
  icon,
  onClick,
  tone = "neutral",
}: {
  children: string;
  disabled?: boolean;
  icon: ReactNode;
  onClick: () => void;
  tone?: "danger" | "neutral";
}) {
  return (
    <Button
      className="min-h-9 px-3 py-1.5"
      disabled={disabled}
      leftIcon={icon}
      onClick={onClick}
      type="button"
      variant={tone === "danger" ? "danger" : "secondary"}
    >
      {children}
    </Button>
  );
}

export function FieldCardShell({
  actions,
  children,
  duplicateLabelWarning,
  fieldNumber,
  isExpanded,
  onToggleExpanded,
  title,
}: {
  actions: ReactNode;
  children: ReactNode;
  duplicateLabelWarning?: boolean;
  fieldNumber: number;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  title: string;
}) {
  const displayTitle = title || `Field ${fieldNumber}`;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-950/5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <button
          aria-expanded={isExpanded}
          className="-m-2 flex min-w-0 flex-1 items-start gap-2 rounded-xl p-2 text-left outline-none transition hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-blue-500/15"
          onClick={onToggleExpanded}
          type="button"
        >
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200",
              isExpanded ? "rotate-0" : "-rotate-90",
            )}
          />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-950">
              {displayTitle}
            </span>
            <span className="sr-only">
              {isExpanded ? "Collapse field" : "Expand field"}
            </span>
            {isExpanded && duplicateLabelWarning ? (
              <span className="mt-1 block text-xs font-semibold text-amber-700">
                Duplicate label. This is allowed, but distinct labels scan
                better.
              </span>
            ) : null}
          </span>
        </button>
        <div
          className="flex flex-wrap gap-2"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {actions}
        </div>
      </div>
      {isExpanded ? <div className="mt-5">{children}</div> : null}
    </article>
  );
}

export function EmptyFieldState({
  action,
  children,
  icon,
  title,
}: {
  action: ReactNode;
  children: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-blue-700 shadow-sm shadow-slate-950/5">
        {icon}
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-950">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
        {children}
      </p>
      <div className="mt-4">{action}</div>
    </div>
  );
}
