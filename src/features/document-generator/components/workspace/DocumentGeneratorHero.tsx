"use client";

import { CheckCircle, FileText, Gauge } from "lucide-react";
import { cn } from "@/src/components/ui/styles";
import type { DocumentFormSnapshot } from "@/src/features/document-generator/types/document-form";
import { StatusBadge } from "./StatusBadge";

type DocumentGeneratorHeroProps = {
  selectedTemplateCount: number;
  snapshot: DocumentFormSnapshot;
  uploadedTemplateCount: number;
};

export function DocumentGeneratorHero({
  selectedTemplateCount,
  snapshot,
  uploadedTemplateCount,
}: DocumentGeneratorHeroProps) {
  const fieldCount =
    snapshot.schema.textFields.length + snapshot.schema.imageFields.length;
  const isReady =
    selectedTemplateCount > 0 &&
    snapshot.schemaIsValid &&
    snapshot.missingRequiredCount === 0;

  return (
    <header className="w-full max-w-full overflow-hidden rounded-4xl border border-slate-200/70 bg-linear-to-br from-white via-blue-50/40 to-slate-50 p-5 shadow-sm sm:p-7 lg:p-8">
      <div className="flex min-w-0 flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 max-w-3xl items-start gap-3 sm:gap-4">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-b from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-600/25 sm:h-14 sm:w-14"
          >
            <FileText className="h-6 w-6" strokeWidth={2.25} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
                Dynamic Document Generator
              </h1>
              <StatusBadge tone="success">DOCX output</StatusBadge>
              <StatusBadge>Uploaded templates</StatusBadge>
            </div>
            <p className="mt-3 max-w-2xl wrap-break-word text-base leading-7 text-slate-600">
              Upload DOCX templates, build reusable text and image fields, then
              map each field to the exact replacement target in your Word file.
            </p>
          </div>
        </div>

        <div className="w-full max-w-full rounded-3xl border border-white/80 bg-white/80 p-3.5 shadow-sm shadow-slate-950/5 backdrop-blur sm:p-4 lg:max-w-sm">
          <div className="flex min-w-0 items-center justify-between gap-3 sm:gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border",
                  isReady
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border-blue-100 bg-blue-50 text-blue-700",
                )}
              >
                {isReady ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <Gauge className="h-5 w-5" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">
                  Generation readiness
                </p>
                <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
                  {uploadedTemplateCount} uploaded, {selectedTemplateCount}{" "}
                  selected, {fieldCount} fields
                </p>
              </div>
            </div>
            <StatusBadge tone={isReady ? "success" : "warning"}>
              {isReady ? "Ready" : "Draft"}
            </StatusBadge>
          </div>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-linear-to-r from-blue-600 to-indigo-600 transition-all duration-300"
              style={{
                width: isReady
                  ? "100%"
                  : uploadedTemplateCount > 0 || fieldCount > 0
                    ? "62%"
                    : "22%",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
