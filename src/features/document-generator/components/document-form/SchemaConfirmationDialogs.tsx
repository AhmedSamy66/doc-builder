"use client";

import { ConfirmationDialog } from "@/src/components/ui";
import type { DocumentFieldSchema } from "@/src/features/document-generator/types/document-schema";

type SchemaConfirmationDialogsProps = {
  isClearDialogOpen: boolean;
  onApplyImportedSchema: (schema: DocumentFieldSchema) => void;
  onCancelClear: () => void;
  onCancelImport: () => void;
  onClearFields: () => void;
  pendingImportedSchema?: DocumentFieldSchema;
};

export function SchemaConfirmationDialogs({
  isClearDialogOpen,
  onApplyImportedSchema,
  onCancelClear,
  onCancelImport,
  onClearFields,
  pendingImportedSchema,
}: SchemaConfirmationDialogsProps) {
  return (
    <>
      <ConfirmationDialog
        confirmLabel="Import schema"
        description="Importing this schema will replace your current field schema. Filled values and uploaded images are not imported."
        isOpen={Boolean(pendingImportedSchema)}
        onCancel={onCancelImport}
        onConfirm={() => {
          if (pendingImportedSchema) {
            onApplyImportedSchema(pendingImportedSchema);
          }
        }}
        title="Replace current schema?"
      />

      <ConfirmationDialog
        confirmLabel="Clear fields"
        description="This will remove all text inputs and image uploads from the current schema. Filled values and uploaded images will also be cleared."
        isOpen={isClearDialogOpen}
        onCancel={onCancelClear}
        onConfirm={onClearFields}
        title="Clear field schema?"
      />
    </>
  );
}
