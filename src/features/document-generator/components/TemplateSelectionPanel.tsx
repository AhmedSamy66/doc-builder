"use client";

import { type ChangeEvent, useRef, useState } from "react";
import type { DocumentTemplate } from "@/src/features/document-generator/config/templates";
import { TemplateList } from "./template-selection/TemplateList";
import { TemplateRemovalDialog } from "./template-selection/TemplateRemovalDialog";
import { TemplateSelectionControls } from "./template-selection/TemplateSelectionControls";
import { TemplateSelectionError } from "./template-selection/TemplateSelectionError";
import { TemplateSelectionHeader } from "./template-selection/TemplateSelectionHeader";
import {
  TemplateUploadBox,
  type UploadStatus,
} from "./template-selection/TemplateUploadBox";
import {
  formatUploadMessage,
  getTemplateRemovalFileName,
} from "./template-selection/template-selection-utils";

export type TemplateUploadResult = {
  errors: string[];
  uploadedCount: number;
};

type TemplateSelectionPanelProps = {
  disabled?: boolean;
  error?: string;
  onRemoveTemplate?: (templateId: string) => void;
  onSelectionChange: (templateIds: string[]) => void;
  onTemplateUpload?: (
    files: readonly File[],
  ) => Promise<TemplateUploadResult> | TemplateUploadResult;
  selectedTemplateIds: string[];
  templates: readonly DocumentTemplate[];
};

export function TemplateSelectionPanel({
  disabled = false,
  error,
  onRemoveTemplate,
  onSelectionChange,
  onTemplateUpload,
  selectedTemplateIds,
  templates,
}: TemplateSelectionPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [templatePendingRemoval, setTemplatePendingRemoval] =
    useState<DocumentTemplate>();
  const selectedTemplateIdSet = new Set(selectedTemplateIds);
  const selectedCount = selectedTemplateIds.length;
  const allTemplatesSelected =
    templates.length > 0 && selectedCount === templates.length;
  const isUploading = uploadStatus === "uploading";
  const uploadFeedbackId = "template-upload-feedback";
  const uploadFeedbackMessage =
    uploadStatus === "uploading" ? "Uploading..." : uploadMessage;
  const removalFileName = getTemplateRemovalFileName(templatePendingRemoval);

  function handleToggle(templateId: string) {
    if (selectedTemplateIdSet.has(templateId)) {
      onSelectionChange(selectedTemplateIds.filter((id) => id !== templateId));
      return;
    }

    onSelectionChange([...selectedTemplateIds, templateId]);
  }

  function handleSelectAll() {
    onSelectionChange(templates.map((template) => template.id));
  }

  function handleClear() {
    onSelectionChange([]);
  }

  async function handleUploadChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (files.length === 0) {
      return;
    }

    if (!onTemplateUpload) {
      setUploadStatus("error");
      setUploadMessage("Template uploads are not available.");
      return;
    }

    setUploadStatus("uploading");
    setUploadMessage("");

    let result: TemplateUploadResult;

    try {
      result = await onTemplateUpload(files);
    } catch {
      setUploadStatus("error");
      setUploadMessage("Template upload failed. Please try again.");
      return;
    }

    if (result.uploadedCount > 0 && result.errors.length === 0) {
      setUploadStatus("success");
      setUploadMessage(formatUploadMessage(result));
      return;
    }

    setUploadStatus("error");
    setUploadMessage(formatUploadMessage(result));
  }

  function handleConfirmRemoveTemplate() {
    if (templatePendingRemoval) {
      onRemoveTemplate?.(templatePendingRemoval.id);
    }

    setTemplatePendingRemoval(undefined);
  }

  return (
    <>
      <section className="w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur sm:p-6">
        <TemplateSelectionHeader />

        <TemplateSelectionControls
          allTemplatesSelected={allTemplatesSelected}
          disabled={disabled}
          onClear={handleClear}
          onSelectAll={handleSelectAll}
          selectedCount={selectedCount}
          templateCount={templates.length}
        />

        <TemplateUploadBox
          disabled={disabled}
          inputRef={inputRef}
          isUploading={isUploading}
          onUploadChange={handleUploadChange}
          uploadFeedbackId={uploadFeedbackId}
          uploadFeedbackMessage={uploadFeedbackMessage}
          uploadStatus={uploadStatus}
        />

        <TemplateSelectionError error={error} />

        <TemplateList
          disabled={disabled}
          onRequestRemove={
            onRemoveTemplate ? setTemplatePendingRemoval : undefined
          }
          onToggle={handleToggle}
          selectedTemplateIdSet={selectedTemplateIdSet}
          templates={templates}
        />
      </section>

      <TemplateRemovalDialog
        isOpen={Boolean(templatePendingRemoval)}
        onCancel={() => setTemplatePendingRemoval(undefined)}
        onConfirm={handleConfirmRemoveTemplate}
        removalFileName={removalFileName}
      />
    </>
  );
}
