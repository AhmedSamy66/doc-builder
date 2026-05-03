"use client";

import { AlertCircle, CheckCircle, Download, FileText } from "lucide-react";
import { Button } from "@/src/components/ui";
import { cn } from "@/src/components/ui/styles";
import { getGenerateButtonLabel } from "@/src/features/document-generator/utils/document-generation";

type GeneratePanelProps = {
  bottomBarMessage: string;
  canGenerate: boolean;
  disabledReason: string;
  formError: string;
  formSuccess: string;
  isSubmitting: boolean;
  selectedTemplateCount: number;
  selectedTemplateDisplay: string;
};

export function GeneratePanel({
  bottomBarMessage,
  canGenerate,
  disabledReason,
  formError,
  formSuccess,
  isSubmitting,
  selectedTemplateCount,
  selectedTemplateDisplay,
}: GeneratePanelProps) {
  return (
    <div
      className={cn(
        "sticky bottom-2 z-20 rounded-2xl border p-3 shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur sm:bottom-6 sm:rounded-3xl sm:p-5",
        formSuccess
          ? "border-emerald-200 bg-emerald-50/95"
          : formError
            ? "border-rose-200 bg-rose-50/95"
            : "border-slate-200/80 bg-white/90",
      )}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div
          aria-live="polite"
          className={cn(
            "flex min-h-10 min-w-0 flex-1 items-start gap-2.5 text-xs font-medium sm:min-h-12 sm:gap-3 sm:text-sm",
            formSuccess
              ? "text-emerald-800"
              : formError
                ? "text-rose-600"
                : "text-slate-600",
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm sm:h-10 sm:w-10 sm:rounded-2xl",
              formSuccess
                ? "border-emerald-200 bg-white text-emerald-700"
                : formError
                  ? "border-rose-200 bg-white text-rose-600"
                  : "border-blue-100 bg-blue-50 text-blue-700",
            )}
          >
            {formSuccess ? (
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : formError ? (
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="line-clamp-2 wrap-break-word text-sm font-semibold leading-5 text-slate-950">
              {selectedTemplateDisplay}
            </p>
            <p className="mt-1 wrap-break-word leading-5 sm:leading-6">
              {bottomBarMessage}
            </p>
            {!formError && !formSuccess ? (
              <p className="mt-1 wrap-break-word text-xs font-semibold leading-5 text-slate-500">
                {disabledReason}
              </p>
            ) : null}
          </div>
        </div>
        <Button
          className="h-11 w-full min-w-0 px-4 text-sm shadow-lg shadow-blue-600/20 sm:h-12 sm:w-auto sm:min-w-64 sm:px-6 sm:text-base"
          disabled={!canGenerate}
          isLoading={isSubmitting}
          leftIcon={<Download className="h-4 w-4 sm:h-5 sm:w-5" />}
          type="submit"
        >
          {isSubmitting
            ? "Generating"
            : getGenerateButtonLabel(selectedTemplateCount)}
        </Button>
      </div>
    </div>
  );
}
