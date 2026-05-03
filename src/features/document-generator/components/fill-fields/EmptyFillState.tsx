"use client";

import { FileText } from "lucide-react";

export function EmptyFillState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-blue-700 shadow-sm shadow-slate-950/5">
        <FileText className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-semibold text-slate-950">
        No fields to fill
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">
        Build text inputs or image uploads, then return here to enter document
        values.
      </p>
    </div>
  );
}
