"use client";

import { CheckCircle, FileText, Trash2 } from "lucide-react";
import type { DocumentTemplate } from "@/src/features/document-generator/config/templates";
import { cn } from "@/src/components/ui/styles";

type TemplateCardProps = {
  disabled?: boolean;
  isSelected: boolean;
  onRemove?: (templateId: string) => void;
  onToggle: (templateId: string) => void;
  template: DocumentTemplate;
};

export function TemplateCard({
  disabled = false,
  isSelected,
  onRemove,
  onToggle,
  template,
}: TemplateCardProps) {
  const fileNameLabel = template.originalFilename;
  const actionButtonClassName =
    "flex h-8 w-8 items-center justify-center rounded-full border shadow-sm shadow-slate-950/5 outline-none transition-all duration-200 focus:ring-4 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div
      className={cn(
        "group relative w-full max-w-full overflow-hidden rounded-2xl border text-left transition-all duration-200 hover:border-blue-300 hover:bg-slate-50 hover:shadow-sm",
        isSelected
          ? "border-blue-500 bg-blue-50/60 shadow-[0_14px_35px_rgba(37,99,235,0.14)] ring-4 ring-blue-500/10 hover:bg-blue-50/70"
          : "border-slate-200 bg-white shadow-sm shadow-slate-950/5",
        disabled &&
          "cursor-not-allowed opacity-60 hover:border-slate-200 hover:bg-white hover:shadow-none",
      )}
    >
      <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
        <button
          aria-label={
            isSelected
              ? `Deselect template ${template.name}`
              : `Select template ${template.name}`
          }
          aria-pressed={isSelected}
          className={cn(
            actionButtonClassName,
            isSelected
              ? "border-blue-600 bg-blue-600 text-white focus:ring-blue-500/15"
              : "border-slate-200 bg-white text-slate-400 enabled:hover:border-blue-200 enabled:hover:bg-blue-50 enabled:hover:text-blue-700 focus:ring-blue-500/10",
          )}
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onToggle(template.id);
          }}
          type="button"
        >
          <CheckCircle aria-hidden="true" className="h-4 w-4" />
        </button>

        {onRemove ? (
          <button
            aria-label={`Remove uploaded template ${fileNameLabel}`}
            className={cn(
              actionButtonClassName,
              "border-slate-200 bg-white text-slate-400 enabled:hover:border-rose-200 enabled:hover:bg-rose-50 enabled:hover:text-rose-600 focus:ring-rose-500/10",
            )}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onRemove(template.id);
            }}
            type="button"
          >
            <Trash2 aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <button
        aria-pressed={isSelected}
        className={cn(
          "w-full p-4 text-left outline-none transition-all duration-200 focus:ring-4 focus:ring-blue-500/10 enabled:cursor-pointer enabled:active:scale-[0.99] disabled:cursor-not-allowed",
          onRemove ? "pr-24" : "pr-16",
        )}
        disabled={disabled}
        onClick={() => onToggle(template.id)}
        type="button"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span
            aria-hidden="true"
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-colors",
              isSelected
                ? "border-blue-200 bg-white text-blue-700 shadow-sm shadow-blue-950/5"
                : cn(
                    "border-slate-200 bg-slate-50 text-slate-500",
                    !disabled && "group-hover:border-blue-200 group-hover:text-blue-700",
                  ),
            )}
          >
            <FileText className="h-5 w-5" strokeWidth={2.25} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start">
              <h3 className="min-w-0 text-sm font-semibold text-slate-950">
                {template.name}
              </h3>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-normal",
                  isSelected
                    ? "border-blue-200 bg-white text-blue-700"
                    : "border-slate-200 bg-white text-slate-600",
                )}
              >
                .DOCX
              </span>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}
