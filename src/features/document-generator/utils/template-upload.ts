import {
  DOCX_TEMPLATE_CONTENT_TYPE,
  MAX_UPLOADED_TEMPLATE_BYTES,
  UPLOADED_TEMPLATE_ID_PREFIX,
  getTemplatesByIds,
} from "@/src/features/document-generator/config/templates";
import type { DocumentTemplate } from "@/src/features/document-generator/config/templates";

export type SelectedTemplateSummary = {
  label: string;
};

const GENERIC_FILE_CONTENT_TYPE = "application/octet-stream";
const DOCX_LOCAL_FILE_MAGIC = [0x50, 0x4b, 0x03, 0x04] as const;

export function getSelectedTemplateSummary(
  selectedTemplateIds: readonly string[],
  templates: readonly DocumentTemplate[],
): SelectedTemplateSummary {
  const selectedTemplates = getTemplatesByIds(selectedTemplateIds, templates);

  if (templates.length === 0) {
    return {
      label: "No templates uploaded",
    };
  }

  if (selectedTemplateIds.length === 0) {
    return {
      label: "No templates selected",
    };
  }

  if (selectedTemplates.length === 1) {
    return {
      label: selectedTemplates[0].name,
    };
  }

  return {
    label: `${selectedTemplates.length} templates selected`,
  };
}

function formatTemplateSizeLimit() {
  return `${MAX_UPLOADED_TEMPLATE_BYTES / (1024 * 1024)} MB`;
}

function hasDocxExtension(fileName: string) {
  return fileName.toLowerCase().endsWith(".docx");
}

function hasUnsafeFileNameCharacters(fileName: string) {
  return fileName.includes("/") || fileName.includes("\\");
}

function isAcceptedDocxMimeType(contentType: string) {
  const normalizedContentType = contentType.trim().toLowerCase();

  return (
    normalizedContentType === "" ||
    normalizedContentType === DOCX_TEMPLATE_CONTENT_TYPE ||
    normalizedContentType === GENERIC_FILE_CONTENT_TYPE
  );
}

function hasDuplicateTemplateFileName(
  fileName: string,
  templates: readonly DocumentTemplate[],
) {
  const normalizedFileName = fileName.trim().toLowerCase();

  return templates.some(
    (template) =>
      template.originalFilename.trim().toLowerCase() === normalizedFileName,
  );
}

function stripDocxExtension(fileName: string) {
  return fileName.replace(/\.docx$/i, "");
}

function deriveTemplateDisplayName(fileName: string) {
  const baseName = stripDocxExtension(fileName)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!baseName) {
    return "Uploaded Template";
  }

  return baseName
    .split(" ")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function makeUniqueTemplateName(
  preferredName: string,
  templates: readonly DocumentTemplate[],
) {
  const existingNames = new Set(
    templates.map((template) => template.name.toLowerCase()),
  );
  let nextName = preferredName;
  let suffix = 2;

  while (existingNames.has(nextName.toLowerCase())) {
    nextName = `${preferredName} ${suffix}`;
    suffix += 1;
  }

  return nextName;
}

function sanitizeOutputBaseName(fileName: string) {
  const sanitizedBaseName = stripDocxExtension(fileName)
    .replace(/[^a-zA-Z0-9._ -]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[^a-zA-Z0-9]+/, "")
    .replace(/[^a-zA-Z0-9]+$/, "");

  return sanitizedBaseName || "uploaded-template";
}

function makeUniqueOutputFileName(
  fileName: string,
  templates: readonly DocumentTemplate[],
) {
  const existingOutputFileNames = new Set(
    templates.map((template) => template.outputFileName.toLowerCase()),
  );
  const outputBaseName = sanitizeOutputBaseName(fileName);
  let nextOutputFileName = `${outputBaseName}.docx`;
  let suffix = 2;

  while (existingOutputFileNames.has(nextOutputFileName.toLowerCase())) {
    nextOutputFileName = `${outputBaseName}-${suffix}.docx`;
    suffix += 1;
  }

  return nextOutputFileName;
}

function createUploadedTemplateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${UPLOADED_TEMPLATE_ID_PREFIX}${crypto.randomUUID()}`;
  }

  return `${UPLOADED_TEMPLATE_ID_PREFIX}${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export async function validateDocxTemplateFile(
  file: File,
  templates: readonly DocumentTemplate[],
) {
  if (!hasDocxExtension(file.name)) {
    return "Upload a .docx Word template.";
  }

  if (hasUnsafeFileNameCharacters(file.name)) {
    return "Template filename cannot contain folder paths.";
  }

  if (!isAcceptedDocxMimeType(file.type)) {
    return "The selected file does not use the DOCX MIME type.";
  }

  if (file.size === 0) {
    return "Template file cannot be empty.";
  }

  if (file.size > MAX_UPLOADED_TEMPLATE_BYTES) {
    return `Template must be smaller than ${formatTemplateSizeLimit()}.`;
  }

  if (hasDuplicateTemplateFileName(file.name, templates)) {
    return `A template named "${file.name}" is already available.`;
  }

  try {
    const zipHeaderBytes = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const isZipArchive = DOCX_LOCAL_FILE_MAGIC.every(
      (byte, index) => zipHeaderBytes[index] === byte,
    );

    if (!isZipArchive) {
      return "The selected file is not a valid DOCX archive.";
    }
  } catch {
    return "The selected file could not be read.";
  }

  return undefined;
}

export function createUploadedTemplate(
  file: File,
  templates: readonly DocumentTemplate[],
): DocumentTemplate {
  return {
    createdAt: new Date().toISOString(),
    extension: "docx",
    file,
    fileName: file.name,
    id: createUploadedTemplateId(),
    name: makeUniqueTemplateName(deriveTemplateDisplayName(file.name), templates),
    originalFilename: file.name,
    outputFileName: makeUniqueOutputFileName(file.name, templates),
    size: file.size,
  };
}
