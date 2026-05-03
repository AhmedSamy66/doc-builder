"use client";

import { AlertCircle } from "lucide-react";

type TemplateSelectionErrorProps = {
  error?: string;
};

export function TemplateSelectionError({ error }: TemplateSelectionErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700">
      <AlertCircle
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0"
      />
      <span>{error}</span>
    </div>
  );
}
