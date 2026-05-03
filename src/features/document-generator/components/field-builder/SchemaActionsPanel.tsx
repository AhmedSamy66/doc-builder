"use client";

import { Download, Trash2, Type, Upload } from "lucide-react";
import { Button } from "@/src/components/ui";
import { SectionIcon } from "./FieldBuilderPrimitives";

type SchemaActionsPanelProps = {
  canExport: boolean;
  hasFields: boolean;
  onClearFields: () => void;
  onExportSchema: () => void;
  onImportSchemaClick: () => void;
  storageStatus: string;
};

export function SchemaActionsPanel({
  canExport,
  hasFields,
  onClearFields,
  onExportSchema,
  onImportSchemaClick,
  storageStatus,
}: SchemaActionsPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur sm:p-7 lg:p-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <SectionIcon>
            <Type className="h-5 w-5" />
          </SectionIcon>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-950">
              Template Fields
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {storageStatus}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            leftIcon={<Upload className="h-4 w-4" />}
            onClick={onImportSchemaClick}
            type="button"
            variant="secondary"
          >
            Import Schema
          </Button>
          <Button
            disabled={!canExport}
            leftIcon={<Download className="h-4 w-4" />}
            onClick={onExportSchema}
            type="button"
            variant="secondary"
          >
            Export Schema
          </Button>
          <Button
            disabled={!hasFields}
            leftIcon={<Trash2 className="h-4 w-4" />}
            onClick={onClearFields}
            type="button"
            variant="danger"
          >
            Clear Fields
          </Button>
        </div>
      </div>
    </section>
  );
}
