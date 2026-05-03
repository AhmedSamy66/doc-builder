"use client";

import { Files } from "lucide-react";
import { Button } from "@/src/components/ui";

type TemplateSelectionControlsProps = {
  allTemplatesSelected: boolean;
  disabled: boolean;
  onClear: () => void;
  onSelectAll: () => void;
  selectedCount: number;
  templateCount: number;
};

export function TemplateSelectionControls({
  allTemplatesSelected,
  disabled,
  onClear,
  onSelectAll,
  selectedCount,
  templateCount,
}: TemplateSelectionControlsProps) {
  return (
    <div className="mt-6 flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-inner shadow-slate-950/5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm shadow-slate-950/5 ring-1 ring-slate-200">
            <Files aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="text-base text-slate-950">{selectedCount}</span>{" "}
            selected
          </span>
        </span>
        <span className="shrink-0 truncate rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
          {templateCount} available
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="min-h-9 px-3 py-1.5"
          disabled={disabled || allTemplatesSelected}
          onClick={onSelectAll}
          type="button"
          variant="secondary"
        >
          Select all
        </Button>
        <Button
          className="min-h-9 px-3 py-1.5"
          disabled={disabled || selectedCount === 0}
          onClick={onClear}
          type="button"
          variant="secondary"
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
