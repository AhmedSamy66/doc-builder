"use client";

import { useCallback, useMemo, useState } from "react";
import type { DocumentTemplate } from "@/src/features/document-generator/config/templates";
import {
  createEmptyDocumentFieldSchema,
} from "@/src/features/document-generator/types/document-schema";
import type {
  DocumentFormSnapshot,
} from "@/src/features/document-generator/types/document-form";
import {
  createUploadedTemplate,
  getSelectedTemplateSummary,
  validateDocxTemplateFile,
} from "@/src/features/document-generator/utils/template-upload";
import { DocumentForm } from "./DocumentForm";
import {
  TemplateSelectionPanel,
  type TemplateUploadResult,
} from "./TemplateSelectionPanel";
import { DocumentGeneratorHero } from "./workspace/DocumentGeneratorHero";
import { FieldsSummaryPanel } from "./workspace/FieldsSummaryPanel";

const initialFormSnapshot: DocumentFormSnapshot = {
  imageFiles: {},
  missingRequiredCount: 0,
  schema: createEmptyDocumentFieldSchema(),
  schemaIsValid: true,
  textValues: {},
};

export function DocumentGeneratorWorkspace() {
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);
  const [uploadedTemplates, setUploadedTemplates] = useState<
    DocumentTemplate[]
  >([]);
  const [templateSelectionError, setTemplateSelectionError] = useState("");
  const [formSnapshot, setFormSnapshot] =
    useState<DocumentFormSnapshot>(initialFormSnapshot);
  const templates = useMemo(() => uploadedTemplates, [uploadedTemplates]);
  const selectedTemplateSummary = getSelectedTemplateSummary(
    selectedTemplateIds,
    templates,
  );

  const handleFormSnapshotChange = useCallback(
    (snapshot: DocumentFormSnapshot) => {
      setFormSnapshot(snapshot);
    },
    [],
  );

  function handleSelectionChange(templateIds: string[]) {
    setSelectedTemplateIds(templateIds);
    setTemplateSelectionError("");
  }

  const handleTemplateUpload = useCallback(
    async (files: readonly File[]): Promise<TemplateUploadResult> => {
      const acceptedTemplates: DocumentTemplate[] = [];
      const errors: string[] = [];
      const nextAvailableTemplates = [...templates];

      for (const file of files) {
        const validationError = await validateDocxTemplateFile(
          file,
          nextAvailableTemplates,
        );

        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
          continue;
        }

        const uploadedTemplate = createUploadedTemplate(
          file,
          nextAvailableTemplates,
        );

        acceptedTemplates.push(uploadedTemplate);
        nextAvailableTemplates.push(uploadedTemplate);
      }

      if (acceptedTemplates.length > 0) {
        const acceptedTemplateIds = acceptedTemplates.map(
          (template) => template.id,
        );

        setUploadedTemplates((currentTemplates) => [
          ...currentTemplates,
          ...acceptedTemplates,
        ]);
        setSelectedTemplateIds((currentTemplateIds) => [
          ...currentTemplateIds,
          ...acceptedTemplateIds.filter(
            (templateId) => !currentTemplateIds.includes(templateId),
          ),
        ]);
        setTemplateSelectionError("");
      }

      return {
        errors,
        uploadedCount: acceptedTemplates.length,
      };
    },
    [templates],
  );

  function handleTemplateRemove(templateId: string) {
    setUploadedTemplates((currentTemplates) =>
      currentTemplates.filter((template) => template.id !== templateId),
    );
    setSelectedTemplateIds((currentTemplateIds) =>
      currentTemplateIds.filter((id) => id !== templateId),
    );
    setTemplateSelectionError("");
  }

  return (
    <>
      <DocumentGeneratorHero
        selectedTemplateCount={selectedTemplateIds.length}
        snapshot={formSnapshot}
        uploadedTemplateCount={templates.length}
      />

      <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start xl:gap-8">
        <aside className="w-full min-w-0 max-w-full space-y-5 lg:sticky lg:top-8">
          <TemplateSelectionPanel
            error={templateSelectionError}
            onRemoveTemplate={handleTemplateRemove}
            onSelectionChange={handleSelectionChange}
            onTemplateUpload={handleTemplateUpload}
            selectedTemplateIds={selectedTemplateIds}
            templates={templates}
          />
          <FieldsSummaryPanel
            selectedTemplateCount={selectedTemplateIds.length}
            selectedTemplateSummary={selectedTemplateSummary}
            snapshot={formSnapshot}
            uploadedTemplateCount={templates.length}
          />
        </aside>

        <DocumentForm
          onTemplateSelectionError={setTemplateSelectionError}
          onWorkspaceStateChange={handleFormSnapshotChange}
          selectedTemplateIds={selectedTemplateIds}
          templates={templates}
        />
      </div>
    </>
  );
}
