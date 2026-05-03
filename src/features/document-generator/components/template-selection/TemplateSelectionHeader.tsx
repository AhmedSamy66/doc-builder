"use client";

import { Layers } from "lucide-react";

export function TemplateSelectionHeader() {
  return (
    <div className="flex items-start gap-4">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 shadow-sm shadow-blue-950/10"
      >
        <Layers className="h-6 w-6" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-950">
          Template Selection
        </p>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          Upload and select one or more DOCX templates.
        </p>
      </div>
    </div>
  );
}
