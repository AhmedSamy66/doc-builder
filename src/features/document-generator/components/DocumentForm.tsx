"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ToastViewport } from "@/src/components/ui";
import { cn } from "@/src/components/ui/styles";
import {
  getTemplatesByIds,
} from "@/src/features/document-generator/config/templates";
import type { DocumentTemplate } from "@/src/features/document-generator/config/templates";
import { useDocumentFieldSchema } from "@/src/features/document-generator/hooks/useDocumentFieldSchema";
import type {
  ActiveDocumentFormTab,
  DocumentFormSnapshot,
  ImageFiles,
  TextValues,
} from "@/src/features/document-generator/types/document-form";
import type {
  DocumentFieldSchema,
  ImageReplacementField,
  TextReplacementField,
} from "@/src/features/document-generator/types/document-schema";
import {
  createEmptyDocumentFieldSchema,
  createImageReplacementField,
  createTextReplacementField,
  hasSchemaFields,
  normalizeDocumentFieldSchema,
  validateDocumentFieldSchema,
} from "@/src/features/document-generator/types/document-schema";
import {
  DocumentGenerationError,
  requestGeneratedDocumentDownload,
  readImageNaturalDimensions,
  resolveTextValues,
  validateFillValues,
  validateImageFile,
} from "@/src/features/document-generator/utils/document-generation";
import {
  downloadDocumentFieldSchema,
  readDocumentFieldSchemaFile,
} from "@/src/features/document-generator/utils/schema-storage";
import {
  insertFieldAfter,
  moveField,
  removeFieldById,
  replaceFieldAtOrder,
} from "@/src/features/document-generator/utils/schema-field-actions";
import { DocumentTabs } from "./document-form/DocumentTabs";
import { GeneratePanel } from "./document-form/GeneratePanel";
import { SchemaConfirmationDialogs } from "./document-form/SchemaConfirmationDialogs";
import { useToastQueue } from "./document-form/useToastQueue";
import { FieldBuilderPanel } from "./FieldBuilderPanel";
import { FillFieldsPanel } from "./FillFieldsPanel";

export type { DocumentFormSnapshot } from "@/src/features/document-generator/types/document-form";

type DocumentFormProps = {
  onTemplateSelectionError?: (error: string) => void;
  onWorkspaceStateChange?: (snapshot: DocumentFormSnapshot) => void;
  selectedTemplateIds: string[];
  templates: readonly DocumentTemplate[];
};

export function DocumentForm({
  onTemplateSelectionError,
  onWorkspaceStateChange,
  selectedTemplateIds,
  templates,
}: DocumentFormProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const imageMetadataRequestIdsRef = useRef<Record<string, number>>({});
  const { schema, setSchema, storageStatus } = useDocumentFieldSchema();
  const [activeTab, setActiveTab] =
    useState<ActiveDocumentFormTab>("build");
  const [textValues, setTextValues] = useState<TextValues>({});
  const [imageFiles, setImageFiles] = useState<ImageFiles>({});
  const [textErrors, setTextErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [imageErrors, setImageErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingImportedSchema, setPendingImportedSchema] =
    useState<DocumentFieldSchema>();
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const { dismissToast, showToast, toasts } = useToastQueue();
  const selectedTemplates = getTemplatesByIds(selectedTemplateIds, templates);
  const schemaValidation = useMemo(
    () => validateDocumentFieldSchema(schema),
    [schema],
  );
  const resolvedTextValues = useMemo(
    () => resolveTextValues(schema, textValues),
    [schema, textValues],
  );
  const fillValidation = useMemo(
    () => validateFillValues(schema, resolvedTextValues, imageFiles),
    [imageFiles, resolvedTextValues, schema],
  );
  const selectedTemplateDisplay =
    selectedTemplateIds.length === 0
      ? "No template selected"
      : selectedTemplates.length === 1
        ? selectedTemplates[0].name
        : `${selectedTemplateIds.length} templates selected`;
  const canGenerate =
    selectedTemplateIds.length > 0 &&
    schemaValidation.isValid &&
    fillValidation.isValid &&
    !isSubmitting;

  useEffect(() => {
    onWorkspaceStateChange?.({
      imageFiles,
      missingRequiredCount: fillValidation.missingRequiredCount,
      schema,
      schemaIsValid: schemaValidation.isValid,
      textValues: resolvedTextValues,
    });
  }, [
    fillValidation.missingRequiredCount,
    imageFiles,
    onWorkspaceStateChange,
    resolvedTextValues,
    schema,
    schemaValidation.isValid,
  ]);

  function updateSchema(
    updater: (currentSchema: DocumentFieldSchema) => DocumentFieldSchema,
  ) {
    setSchema((currentSchema) =>
      normalizeDocumentFieldSchema(updater(currentSchema)),
    );
    setFormSuccess("");
  }

  function handleAddTextField() {
    updateSchema((currentSchema) => ({
      ...currentSchema,
      textFields: [
        ...currentSchema.textFields,
        createTextReplacementField(currentSchema.textFields.length),
      ],
    }));
    setActiveTab("build");
  }

  function handleAddImageField() {
    updateSchema((currentSchema) => ({
      ...currentSchema,
      imageFields: [
        ...currentSchema.imageFields,
        createImageReplacementField(currentSchema.imageFields.length),
      ],
    }));
    setActiveTab("build");
  }

  function handleUpdateTextField(
    fieldId: string,
    updates: Partial<Omit<TextReplacementField, "id">>,
  ) {
    updateSchema((currentSchema) => ({
      ...currentSchema,
      textFields: replaceFieldAtOrder(
        currentSchema.textFields,
        fieldId,
        updates,
      ),
    }));
  }

  function handleUpdateImageField(
    fieldId: string,
    updates: Partial<Omit<ImageReplacementField, "id">>,
  ) {
    updateSchema((currentSchema) => ({
      ...currentSchema,
      imageFields: replaceFieldAtOrder(
        currentSchema.imageFields,
        fieldId,
        updates,
      ),
    }));
  }

  function handleDeleteTextField(fieldId: string) {
    updateSchema((currentSchema) => ({
      ...currentSchema,
      textFields: removeFieldById(currentSchema.textFields, fieldId),
    }));
  }

  function handleDeleteImageField(fieldId: string) {
    updateSchema((currentSchema) => ({
      ...currentSchema,
      imageFields: removeFieldById(currentSchema.imageFields, fieldId),
    }));
  }

  function handleDuplicateTextField(fieldId: string) {
    updateSchema((currentSchema) => {
      const sourceField = currentSchema.textFields.find(
        (field) => field.id === fieldId,
      );

      if (!sourceField) {
        return currentSchema;
      }

      return {
        ...currentSchema,
        textFields: insertFieldAfter(currentSchema.textFields, fieldId, {
          ...sourceField,
          id: createTextReplacementField(0).id,
          label: sourceField.label ? `${sourceField.label} Copy` : "",
          replacementTarget: "",
        }),
      };
    });
  }

  function handleDuplicateImageField(fieldId: string) {
    updateSchema((currentSchema) => {
      const sourceField = currentSchema.imageFields.find(
        (field) => field.id === fieldId,
      );

      if (!sourceField) {
        return currentSchema;
      }

      return {
        ...currentSchema,
        imageFields: insertFieldAfter(currentSchema.imageFields, fieldId, {
          ...sourceField,
          id: createImageReplacementField(0).id,
          label: sourceField.label ? `${sourceField.label} Copy` : "",
          replacementTarget: "",
        }),
      };
    });
  }

  function handleMoveTextField(fieldId: string, direction: "down" | "up") {
    updateSchema((currentSchema) => ({
      ...currentSchema,
      textFields: moveField(currentSchema.textFields, fieldId, direction),
    }));
  }

  function handleMoveImageField(fieldId: string, direction: "down" | "up") {
    updateSchema((currentSchema) => ({
      ...currentSchema,
      imageFields: moveField(currentSchema.imageFields, fieldId, direction),
    }));
  }

  function handleTextValueChange(fieldId: string, value: string) {
    setTextValues((currentValues) => ({
      ...currentValues,
      [fieldId]: value,
    }));
    setTextErrors((currentErrors) => ({
      ...currentErrors,
      [fieldId]: undefined,
    }));
    setFormSuccess("");
  }

  function handleImageFileChange(fieldId: string, file?: File) {
    const field = schema.imageFields.find(
      (imageField) => imageField.id === fieldId,
    );
    const requestId = (imageMetadataRequestIdsRef.current[fieldId] ?? 0) + 1;

    imageMetadataRequestIdsRef.current[fieldId] = requestId;

    setImageFiles((currentFiles) => ({
      ...currentFiles,
      [fieldId]: file ? { file } : undefined,
    }));

    setImageErrors((currentErrors) => ({
      ...currentErrors,
      [fieldId]: field
        ? validateImageFile(file ? { file } : undefined, field)
        : undefined,
    }));
    setFormSuccess("");

    if (!file) {
      return;
    }

    void readImageNaturalDimensions(file).then((dimensions) => {
      if (!dimensions) {
        return;
      }

      setImageFiles((currentFiles) => {
        const currentImageValue = currentFiles[fieldId];

        if (
          imageMetadataRequestIdsRef.current[fieldId] !== requestId ||
          currentImageValue?.file !== file
        ) {
          return currentFiles;
        }

        return {
          ...currentFiles,
          [fieldId]: {
            ...currentImageValue,
            naturalHeight: dimensions.naturalHeight,
            naturalWidth: dimensions.naturalWidth,
          },
        };
      });
    });
  }

  function handleExportSchema() {
    if (!schemaValidation.isValid) {
      showToast({
        title: "Schema export blocked",
        description: "Fix schema errors before exporting.",
        variant: "error",
      });
      setActiveTab("build");
      return;
    }

    try {
      downloadDocumentFieldSchema(schema);
      showToast({
        title: "Schema exported",
        description: "Your reusable field schema was downloaded as JSON.",
        variant: "success",
      });
    } catch {
      showToast({
        title: "Schema export failed",
        description: "The schema could not be exported. Please try again.",
        variant: "error",
      });
    }
  }

  async function handleImportChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const importResult = await readDocumentFieldSchemaFile(file);

    if (!importResult.success) {
      showToast({
        title: "Schema import failed",
        description: importResult.error,
        variant: "error",
      });
      setActiveTab("build");
      return;
    }

    if (hasSchemaFields(schema)) {
      setPendingImportedSchema(importResult.schema);
      return;
    }

    applyImportedSchema(importResult.schema);
  }

  function applyImportedSchema(importedSchema: DocumentFieldSchema) {
    setSchema(normalizeDocumentFieldSchema(importedSchema));
    setTextValues({});
    setImageFiles({});
    setTextErrors({});
    setImageErrors({});
    setPendingImportedSchema(undefined);
    setActiveTab("build");
    showToast({
      title: "Schema imported",
      description: "The field schema was replaced successfully.",
      variant: "success",
    });
  }

  function handleClearFields() {
    setSchema(createEmptyDocumentFieldSchema());
    setTextValues({});
    setImageFiles({});
    setTextErrors({});
    setImageErrors({});
    setFormError("");
    setFormSuccess("");
    setIsClearDialogOpen(false);
    showToast({
      title: "Schema cleared",
      description: "All text and image fields were removed.",
      variant: "success",
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setFormSuccess("");
    onTemplateSelectionError?.("");

    if (selectedTemplateIds.length === 0) {
      const templateError = "Upload and select at least one DOCX template.";

      setFormError(templateError);
      onTemplateSelectionError?.(templateError);
      return;
    }

    const selectedTemplateWithoutFile = selectedTemplates.find(
      (template) => !template.file,
    );

    if (selectedTemplateWithoutFile) {
      const templateError = `${selectedTemplateWithoutFile.name} is missing its DOCX file. Upload it again before generating.`;

      setFormError(templateError);
      onTemplateSelectionError?.(templateError);
      return;
    }

    if (!schemaValidation.isValid) {
      setFormError("Fix schema errors before generating.");
      setActiveTab("build");
      return;
    }

    const nextFillValidation = validateFillValues(
      schema,
      resolvedTextValues,
      imageFiles,
    );

    setTextErrors(nextFillValidation.textErrors);
    setImageErrors(nextFillValidation.imageErrors);

    if (!nextFillValidation.isValid) {
      setFormError("Please complete the required fields before generating.");
      setActiveTab("fill");
      return;
    }

    setIsSubmitting(true);

    try {
      const successMessage = await requestGeneratedDocumentDownload({
        imageFiles,
        schema,
        selectedTemplateIds,
        selectedTemplates,
        textValues: resolvedTextValues,
      });

      setFormSuccess(successMessage);
    } catch (error) {
      if (error instanceof DocumentGenerationError && error.fields) {
        if (error.fields.selectedTemplateIds) {
          onTemplateSelectionError?.(error.fields.selectedTemplateIds);
        }

        setTextErrors(error.fields);
        setImageErrors(error.fields);
      }

      setFormError(
        error instanceof Error
          ? error.message
          : "Document generation failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const bottomBarMessage =
    formError ||
    formSuccess ||
    `${selectedTemplateIds.length} selected templates, ${fillValidation.missingRequiredCount} missing required values.`;
  const disabledReason =
    selectedTemplateIds.length === 0
      ? "Upload and select at least one DOCX template."
      : !schemaValidation.isValid
        ? "Fix schema errors before generating."
        : !fillValidation.isValid
          ? "Complete required values before generating."
          : "Ready to generate.";

  return (
    <>
      <form
        className={cn(
          "space-y-4 sm:space-y-5 lg:space-y-6",
          activeTab === "fill" && "pb-28 sm:pb-32 lg:pb-36",
        )}
        noValidate
        onSubmit={handleSubmit}
      >
        <input
          accept="application/json,.json"
          className="sr-only"
          onChange={handleImportChange}
          ref={importInputRef}
          type="file"
        />

        <DocumentTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "build" ? (
          <FieldBuilderPanel
            onAddImageField={handleAddImageField}
            onAddTextField={handleAddTextField}
            onClearFields={() => setIsClearDialogOpen(true)}
            onDeleteImageField={handleDeleteImageField}
            onDeleteTextField={handleDeleteTextField}
            onDuplicateImageField={handleDuplicateImageField}
            onDuplicateTextField={handleDuplicateTextField}
            onExportSchema={handleExportSchema}
            onImportSchemaClick={() => importInputRef.current?.click()}
            onMoveImageField={handleMoveImageField}
            onMoveTextField={handleMoveTextField}
            onUpdateImageField={handleUpdateImageField}
            onUpdateTextField={handleUpdateTextField}
            schema={schema}
            storageStatus={storageStatus}
            validation={schemaValidation}
          />
        ) : (
          <>
            <FillFieldsPanel
              imageErrors={imageErrors}
              imageFields={schema.imageFields}
              imageFiles={imageFiles}
              isSubmitting={isSubmitting}
              onImageFileChange={handleImageFileChange}
              onTextValueChange={handleTextValueChange}
              textErrors={textErrors}
              textFields={schema.textFields}
              textValues={resolvedTextValues}
            />
            <GeneratePanel
              bottomBarMessage={bottomBarMessage}
              canGenerate={canGenerate}
              disabledReason={disabledReason}
              formError={formError}
              formSuccess={formSuccess}
              isSubmitting={isSubmitting}
              selectedTemplateCount={selectedTemplateIds.length}
              selectedTemplateDisplay={selectedTemplateDisplay}
            />
          </>
        )}
      </form>

      <SchemaConfirmationDialogs
        isClearDialogOpen={isClearDialogOpen}
        onApplyImportedSchema={applyImportedSchema}
        onCancelClear={() => setIsClearDialogOpen(false)}
        onCancelImport={() => setPendingImportedSchema(undefined)}
        onClearFields={handleClearFields}
        pendingImportedSchema={pendingImportedSchema}
      />

      <ToastViewport onDismiss={dismissToast} toasts={toasts} />
    </>
  );
}
