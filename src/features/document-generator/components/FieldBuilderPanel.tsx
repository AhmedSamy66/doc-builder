"use client";

import { sortByOrder } from "@/src/features/document-generator/utils/field-order";
import { ImageFieldsSection } from "./field-builder/ImageFieldsSection";
import { SchemaActionsPanel } from "./field-builder/SchemaActionsPanel";
import { TextFieldsSection } from "./field-builder/TextFieldsSection";
import type { FieldBuilderPanelProps } from "./field-builder/types";

export function FieldBuilderPanel({
  onAddImageField,
  onAddTextField,
  onClearFields,
  onDeleteImageField,
  onDeleteTextField,
  onDuplicateImageField,
  onDuplicateTextField,
  onExportSchema,
  onImportSchemaClick,
  onMoveImageField,
  onMoveTextField,
  onUpdateImageField,
  onUpdateTextField,
  schema,
  storageStatus,
  validation,
}: FieldBuilderPanelProps) {
  const textFields = sortByOrder(schema.textFields);
  const imageFields = sortByOrder(schema.imageFields);
  const hasFields = textFields.length > 0 || imageFields.length > 0;
  const canExport = hasFields && validation.isValid;

  return (
    <div className="space-y-6">
      <SchemaActionsPanel
        canExport={canExport}
        hasFields={hasFields}
        onClearFields={onClearFields}
        onExportSchema={onExportSchema}
        onImportSchemaClick={onImportSchemaClick}
        storageStatus={storageStatus}
      />

      <TextFieldsSection
        fields={textFields}
        onAddTextField={onAddTextField}
        onDeleteTextField={onDeleteTextField}
        onDuplicateTextField={onDuplicateTextField}
        onMoveTextField={onMoveTextField}
        onUpdateTextField={onUpdateTextField}
        validation={validation}
      />

      <ImageFieldsSection
        fields={imageFields}
        onAddImageField={onAddImageField}
        onDeleteImageField={onDeleteImageField}
        onDuplicateImageField={onDuplicateImageField}
        onMoveImageField={onMoveImageField}
        onUpdateImageField={onUpdateImageField}
        validation={validation}
      />
    </div>
  );
}
