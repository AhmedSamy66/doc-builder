import type { DocumentTemplate } from "@/src/features/document-generator/config/templates";

export function formatUploadedTemplateCount(count: number) {
  return count === 1
    ? "1 template uploaded successfully."
    : `${count} templates uploaded successfully.`;
}

export function formatRejectedFileMessages(errors: readonly string[]) {
  if (errors.length === 0) {
    return "";
  }

  if (errors.length === 1) {
    return errors[0];
  }

  const visibleErrors = errors.slice(0, 2).join(" ");
  const remainingCount = errors.length - 2;

  return remainingCount > 0
    ? `${errors.length} files skipped: ${visibleErrors} ${remainingCount} more skipped.`
    : `${errors.length} files skipped: ${visibleErrors}`;
}

export function formatUploadMessage(result: {
  errors: readonly string[];
  uploadedCount: number;
}) {
  const successMessage =
    result.uploadedCount > 0
      ? formatUploadedTemplateCount(result.uploadedCount)
      : "";
  const errorMessage = formatRejectedFileMessages(result.errors);

  return [successMessage, errorMessage].filter(Boolean).join(" ");
}

export function getTemplateRemovalFileName(
  template: DocumentTemplate | undefined,
) {
  if (!template) {
    return "";
  }

  return template.originalFilename ?? template.fileName ?? template.name;
}
