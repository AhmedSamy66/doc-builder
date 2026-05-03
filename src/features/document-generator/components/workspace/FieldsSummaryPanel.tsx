"use client";

import { Sparkles } from "lucide-react";
import type { DocumentFormSnapshot } from "@/src/features/document-generator/types/document-form";
import type { SelectedTemplateSummary } from "@/src/features/document-generator/utils/template-upload";
import { StatusBadge } from "./StatusBadge";

type FieldsSummaryPanelProps = {
  selectedTemplateCount: number;
  selectedTemplateSummary: SelectedTemplateSummary;
  snapshot: DocumentFormSnapshot;
  uploadedTemplateCount: number;
};

export function FieldsSummaryPanel({
  selectedTemplateCount,
  selectedTemplateSummary,
  snapshot,
  uploadedTemplateCount,
}: FieldsSummaryPanelProps) {
  const schemaStatus =
    snapshot.schema.textFields.length > 0 ||
    snapshot.schema.imageFields.length > 0
      ? "Custom"
      : "Empty";
  const rows = [
    {
      label: "Uploaded",
      value: String(uploadedTemplateCount),
    },
    {
      label: "Selected",
      value: String(selectedTemplateCount),
    },
    {
      label: "Text Fields",
      value: String(snapshot.schema.textFields.length),
    },
    {
      label: "Image Fields",
      value: String(snapshot.schema.imageFields.length),
    },
    {
      label: "Missing",
      tone: snapshot.missingRequiredCount > 0 ? "warning" : "success",
      value: String(snapshot.missingRequiredCount),
    },
    {
      label: "Schema",
      tone: schemaStatus === "Custom" ? "success" : "neutral",
      value: schemaStatus,
    },
  ] as const;

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 shadow-sm shadow-blue-950/10"
        >
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-950">
            Fields Summary
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Uploads, selections, and schema status
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-3">
        <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
          Selected template
        </p>
        <p className="mt-1 min-w-0 truncate text-sm font-semibold text-slate-800">
          {selectedTemplateSummary.label}
        </p>
      </div>

      <dl className="mt-5 space-y-3">
        {rows.map((row) => (
          <div
            className="flex min-w-0 items-center justify-between gap-4 rounded-2xl bg-slate-50/80 px-3.5 py-3"
            key={row.label}
          >
            <dt className="shrink-0 text-xs font-semibold uppercase tracking-normal text-slate-500">
              {row.label}
            </dt>
            <dd className="min-w-0 truncate text-right text-sm font-semibold text-slate-800">
              {"tone" in row ? (
                <StatusBadge tone={row.tone}>{row.value}</StatusBadge>
              ) : (
                row.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
