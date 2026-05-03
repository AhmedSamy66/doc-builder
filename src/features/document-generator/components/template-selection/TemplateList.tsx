"use client";

import { UploadCloud } from "lucide-react";
import type { DocumentTemplate } from "@/src/features/document-generator/config/templates";
import { TemplateCard } from "./TemplateCard";

type TemplateListProps = {
  disabled: boolean;
  onRequestRemove?: (template: DocumentTemplate) => void;
  onToggle: (templateId: string) => void;
  selectedTemplateIdSet: ReadonlySet<string>;
  templates: readonly DocumentTemplate[];
};

export function TemplateList({
  disabled,
  onRequestRemove,
  onToggle,
  selectedTemplateIdSet,
  templates,
}: TemplateListProps) {
  return (
    <div className="mt-5 space-y-3">
      {templates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-5 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-700 shadow-sm shadow-blue-950/10">
            <UploadCloud className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <p className="mt-3 text-sm font-semibold text-slate-950">
            Upload DOCX templates to get started.
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Your uploaded templates will appear here.
          </p>
        </div>
      ) : (
        templates.map((template) => (
          <TemplateCard
            disabled={disabled}
            isSelected={selectedTemplateIdSet.has(template.id)}
            key={template.id}
            onRemove={
              onRequestRemove ? () => onRequestRemove(template) : undefined
            }
            onToggle={onToggle}
            template={template}
          />
        ))
      )}
    </div>
  );
}
