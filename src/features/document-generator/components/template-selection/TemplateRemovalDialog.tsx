"use client";

import { FileText } from "lucide-react";
import { ConfirmationDialog } from "@/src/components/ui";

type TemplateRemovalDialogProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  removalFileName: string;
};

export function TemplateRemovalDialog({
  isOpen,
  onCancel,
  onConfirm,
  removalFileName,
}: TemplateRemovalDialogProps) {
  return (
    <ConfirmationDialog
      confirmLabel="Remove template"
      description="You are about to remove this uploaded template from the current session:"
      isOpen={isOpen}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Remove template?"
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-slate-800">
          <FileText
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-blue-700"
          />
          <span className="min-w-0 truncate">
            {removalFileName || "Uploaded template"}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-slate-500">
        This action cannot be undone.
      </p>
    </ConfirmationDialog>
  );
}
