import JSZip from "jszip";
import { NextResponse } from "next/server";
import {
  DocumentRenderError,
  type GenerateDocxImageReplacement,
  InvalidTemplateArchiveError,
  generateDocx,
} from "@/src/server/document-generator/generate-docx";
import { validateImageUpload } from "@/src/server/document-generator/image-utils";
import {
  DOCX_TEMPLATE_CONTENT_TYPE,
  MAX_UPLOADED_TEMPLATE_BYTES,
  UPLOADED_TEMPLATE_ID_PREFIX,
  UPLOADED_TEMPLATE_METADATA_FIELD,
  getUploadedTemplateFileFieldName,
} from "@/src/features/document-generator/config/templates";
import type { DocumentTemplate } from "@/src/features/document-generator/config/templates";
import {
  ACCEPTED_DOCUMENT_IMAGE_TYPES,
  TEXT_REPLACEMENT_FIELD_TYPES,
  type AcceptedDocumentImageType,
  type TextReplacementPayload,
  type TextReplacementFieldType,
} from "@/src/features/document-generator/types/document-schema";

export const runtime = "nodejs";

const DOCX_CONTENT_TYPE = DOCX_TEMPLATE_CONTENT_TYPE;
const ZIP_CONTENT_TYPE = "application/zip";
const ZIP_LOCAL_FILE_MAGIC = "504b0304";
const UPLOADED_TEMPLATE_ID_PATTERN = /^uploaded-template-[a-zA-Z0-9-]+$/;
const GENERIC_FILE_CONTENT_TYPE = "application/octet-stream";

type ErrorResponse = {
  error: string;
  details?: string[];
  fields?: Record<string, string>;
};

type ResolvedDocumentTemplate = {
  template: DocumentTemplate;
  templateBuffer: Buffer;
};

type TemplateSelectionResult =
  | {
      success: true;
      templates: ResolvedDocumentTemplate[];
    }
  | {
      error: string;
      success: false;
    };

type ReplacementPayloadResult =
  | {
      imageReplacements: GenerateDocxImageReplacement[];
      success: true;
      textReplacements: TextReplacementPayload[];
    }
  | {
      error: string;
      fields: Record<string, string>;
      success: false;
    };

class GeneratedDocumentArchiveError extends Error {
  constructor(readonly details: string[]) {
    super("Generated document archive validation failed.");
    this.name = "GeneratedDocumentArchiveError";
  }
}

function jsonError(body: ErrorResponse, status: number) {
  return Response.json(body, { status });
}

function isSafeOutputFileName(fileName: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9._ -]*\.docx$/.test(fileName);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringValue(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "string" ? value.trim() : undefined;
}

function readOptionalStringValue(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "string" ? value : undefined;
}

function readOptionalPositiveNumber(
  record: Record<string, unknown>,
  key: string,
) {
  const value = record[key];

  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
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
    normalizedContentType === DOCX_CONTENT_TYPE ||
    normalizedContentType === GENERIC_FILE_CONTENT_TYPE
  );
}

function isFileEntry(value: FormDataEntryValue | null): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function formatTemplateSizeLimit() {
  return `${MAX_UPLOADED_TEMPLATE_BYTES / (1024 * 1024)} MB`;
}

function getDuplicateOutputFileNames(templates: readonly ResolvedDocumentTemplate[]) {
  const seenFileNames = new Set<string>();
  const duplicates = new Set<string>();

  for (const { template } of templates) {
    const normalizedFileName = template.outputFileName.toLowerCase();

    if (seenFileNames.has(normalizedFileName)) {
      duplicates.add(template.outputFileName);
      continue;
    }

    seenFileNames.add(normalizedFileName);
  }

  return [...duplicates];
}

function readSelectedTemplateIds(formData: FormData) {
  const selectedTemplateEntries = formData.getAll("selectedTemplateIds");

  if (selectedTemplateEntries.length === 0) {
    return [];
  }

  if (
    selectedTemplateEntries.length === 1 &&
    typeof selectedTemplateEntries[0] === "string"
  ) {
    try {
      const parsedValue = JSON.parse(selectedTemplateEntries[0]);

      if (
        Array.isArray(parsedValue) &&
        parsedValue.every((value) => typeof value === "string")
      ) {
        return parsedValue;
      }
    } catch {
      return [selectedTemplateEntries[0]];
    }
  }

  if (selectedTemplateEntries.every((entry) => typeof entry === "string")) {
    return selectedTemplateEntries as string[];
  }

  return undefined;
}

function getZipMagic(buffer: Buffer) {
  return buffer.subarray(0, 4).toString("hex");
}

function debugGeneration(message: string, context?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "development" && process.env.DOCX_DEBUG !== "true") {
    return;
  }

  console.log(`[document-generator] ${message}`, context ?? "");
}

async function validateUploadedTemplateFile(
  file: File,
  templateName: string,
): Promise<
  | {
      buffer: Buffer;
      success: true;
    }
  | {
      error: string;
      success: false;
    }
> {
  if (!hasDocxExtension(file.name)) {
    return {
      error: `${templateName} must be a .docx Word template.`,
      success: false,
    };
  }

  if (!isAcceptedDocxMimeType(file.type)) {
    return {
      error: `${templateName} must use the DOCX MIME type.`,
      success: false,
    };
  }

  if (file.size === 0) {
    return {
      error: `${templateName} cannot be empty.`,
      success: false,
    };
  }

  if (file.size > MAX_UPLOADED_TEMPLATE_BYTES) {
    return {
      error: `${templateName} must be smaller than ${formatTemplateSizeLimit()}.`,
      success: false,
    };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.length < 4 || getZipMagic(buffer) !== ZIP_LOCAL_FILE_MAGIC) {
    return {
      error: `${templateName} is not a valid DOCX archive.`,
      success: false,
    };
  }

  return {
    buffer,
    success: true,
  };
}

function assertZipBuffer(buffer: Buffer, label: string) {
  if (!Buffer.isBuffer(buffer)) {
    throw new GeneratedDocumentArchiveError([`${label} is not a Buffer.`]);
  }

  if (buffer.length < 4) {
    throw new GeneratedDocumentArchiveError([`${label} is empty or truncated.`]);
  }

  const magic = getZipMagic(buffer);

  if (magic !== ZIP_LOCAL_FILE_MAGIC) {
    throw new GeneratedDocumentArchiveError([
      `${label} has invalid ZIP magic ${magic}; expected ${ZIP_LOCAL_FILE_MAGIC}.`,
    ]);
  }
}

async function assertGeneratedDocxBuffer(
  buffer: Buffer,
  template: DocumentTemplate,
) {
  assertZipBuffer(buffer, template.outputFileName);

  try {
    await JSZip.loadAsync(buffer);
  } catch (error) {
    throw new GeneratedDocumentArchiveError([
      `${template.outputFileName} is not a valid DOCX ZIP archive.`,
      error instanceof Error ? error.message : "Unknown ZIP validation error.",
    ]);
  }
}

async function assertGeneratedZipBuffer(buffer: Buffer) {
  assertZipBuffer(buffer, "generated-documents.zip");

  try {
    await JSZip.loadAsync(buffer);
  } catch (error) {
    throw new GeneratedDocumentArchiveError([
      "Generated ZIP could not be read after creation.",
      error instanceof Error ? error.message : "Unknown ZIP validation error.",
    ]);
  }
}

async function readUploadedTemplates(
  formData: FormData,
): Promise<
  | {
      success: true;
      templates: Map<string, ResolvedDocumentTemplate>;
    }
  | {
      error: string;
      success: false;
    }
> {
  const metadataEntry = formData.get(UPLOADED_TEMPLATE_METADATA_FIELD);
  const templates = new Map<string, ResolvedDocumentTemplate>();

  if (!metadataEntry) {
    return {
      success: true,
      templates,
    };
  }

  if (typeof metadataEntry !== "string") {
    return {
      error: "Uploaded template metadata must be submitted as JSON.",
      success: false,
    };
  }

  let parsedMetadata: unknown;

  try {
    parsedMetadata = JSON.parse(metadataEntry);
  } catch {
    return {
      error: "Uploaded template metadata is not valid JSON.",
      success: false,
    };
  }

  if (!Array.isArray(parsedMetadata)) {
    return {
      error: "Uploaded template metadata must be a list.",
      success: false,
    };
  }

  for (const item of parsedMetadata) {
    if (!isRecord(item)) {
      return {
        error: "Uploaded template metadata contains an invalid entry.",
        success: false,
      };
    }

    const id = readStringValue(item, "id");
    const name = readStringValue(item, "name");
    const originalFilename = readStringValue(item, "originalFilename");
    const outputFileName = readStringValue(item, "outputFileName");
    const createdAt = readStringValue(item, "createdAt");

    if (!id || !UPLOADED_TEMPLATE_ID_PATTERN.test(id)) {
      return {
        error: "Uploaded template metadata contains an invalid template ID.",
        success: false,
      };
    }

    if (!name || name.length > 80) {
      return {
        error: "Uploaded template metadata contains an invalid template name.",
        success: false,
      };
    }

    if (!createdAt || createdAt.length > 80) {
      return {
        error: "Uploaded template metadata contains an invalid upload timestamp.",
        success: false,
      };
    }

    if (
      !originalFilename ||
      hasUnsafeFileNameCharacters(originalFilename) ||
      !hasDocxExtension(originalFilename)
    ) {
      return {
        error: `${name} has an invalid DOCX filename.`,
        success: false,
      };
    }

    if (!outputFileName || !isSafeOutputFileName(outputFileName)) {
      return {
        error: `${name} has an invalid output filename.`,
        success: false,
      };
    }

    const fileEntry = formData.get(getUploadedTemplateFileFieldName(id));

    if (!isFileEntry(fileEntry)) {
      return {
        error: `${name} is missing its uploaded DOCX file. Upload it again before generating.`,
        success: false,
      };
    }

    const fileValidation = await validateUploadedTemplateFile(fileEntry, name);

    if (!fileValidation.success) {
      return fileValidation;
    }

    templates.set(id, {
      template: {
        createdAt,
        extension: "docx",
        fileName: originalFilename,
        id,
        name,
        originalFilename,
        outputFileName,
        size: fileEntry.size,
      },
      templateBuffer: fileValidation.buffer,
    });
  }

  return {
    success: true,
    templates,
  };
}

async function validateSelectedTemplates(
  formData: FormData,
): Promise<TemplateSelectionResult> {
  const selectedTemplateIds = readSelectedTemplateIds(formData);

  if (!selectedTemplateIds) {
    return {
      error: "Selected templates must be submitted as template IDs.",
      success: false,
    };
  }

  const uniqueTemplateIds = [...new Set(selectedTemplateIds)];

  if (uniqueTemplateIds.length === 0) {
    return {
      error: "Select at least one template before generating.",
      success: false,
    };
  }

  const uploadedTemplateResult = await readUploadedTemplates(formData);

  if (!uploadedTemplateResult.success) {
    return uploadedTemplateResult;
  }

  const templates: ResolvedDocumentTemplate[] = [];
  const invalidTemplateIds: string[] = [];
  const missingUploadedTemplateIds: string[] = [];

  for (const templateId of uniqueTemplateIds) {
    const uploadedTemplate = uploadedTemplateResult.templates.get(templateId);

    if (uploadedTemplate) {
      templates.push(uploadedTemplate);
      continue;
    }

    if (templateId.startsWith(UPLOADED_TEMPLATE_ID_PREFIX)) {
      missingUploadedTemplateIds.push(templateId);
      continue;
    }

    invalidTemplateIds.push(templateId);
  }

  if (missingUploadedTemplateIds.length > 0) {
    return {
      error: "Upload the selected DOCX template again before generating.",
      success: false,
    };
  }

  if (invalidTemplateIds.length > 0) {
    return {
      error: `Unknown uploaded template selection: ${invalidTemplateIds.join(", ")}.`,
      success: false,
    };
  }

  const duplicateOutputFileNames = getDuplicateOutputFileNames(templates);

  if (duplicateOutputFileNames.length > 0) {
    return {
      error: `Selected templates must have unique output filenames: ${duplicateOutputFileNames.join(", ")}.`,
      success: false,
    };
  }

  return {
    success: true,
    templates,
  };
}

function isAcceptedDocumentImageType(
  value: unknown,
): value is AcceptedDocumentImageType {
  return (
    typeof value === "string" &&
    ACCEPTED_DOCUMENT_IMAGE_TYPES.includes(value as AcceptedDocumentImageType)
  );
}

function isTextReplacementFieldType(
  value: unknown,
): value is TextReplacementFieldType {
  return (
    typeof value === "string" &&
    TEXT_REPLACEMENT_FIELD_TYPES.includes(value as TextReplacementFieldType)
  );
}

function parseJsonArrayField(formData: FormData, fieldName: string) {
  const entry = formData.get(fieldName);

  if (!entry) {
    return {
      data: [],
      success: true,
    } as const;
  }

  if (typeof entry !== "string") {
    return {
      error: `${fieldName} must be submitted as JSON.`,
      success: false,
    } as const;
  }

  try {
    const parsedValue: unknown = JSON.parse(entry);

    if (!Array.isArray(parsedValue)) {
      return {
        error: `${fieldName} must be a JSON array.`,
        success: false,
      } as const;
    }

    return {
      data: parsedValue,
      success: true,
    } as const;
  } catch {
    return {
      error: `${fieldName} is not valid JSON.`,
      success: false,
    } as const;
  }
}

function parseTextReplacements(
  formData: FormData,
): ReplacementPayloadResult | { success: true; textReplacements: TextReplacementPayload[] } {
  const parsedTextReplacements = parseJsonArrayField(formData, "textReplacements");

  if (!parsedTextReplacements.success) {
    return {
      error: parsedTextReplacements.error,
      fields: {
        textReplacements: parsedTextReplacements.error,
      },
      success: false,
    };
  }

  const textReplacements: TextReplacementPayload[] = [];
  const fieldErrors: Record<string, string> = {};

  parsedTextReplacements.data.forEach((item, index) => {
    if (!isRecord(item)) {
      fieldErrors[`textReplacements.${index}`] =
        "Text replacement entries must be objects.";
      return;
    }

    const fieldId = readStringValue(item, "fieldId");
    const label = readStringValue(item, "label");
    const replacementTarget = readStringValue(item, "replacementTarget");
    const type = readStringValue(item, "type");
    const value = readOptionalStringValue(item, "value") ?? "";
    let textFieldType: TextReplacementFieldType | undefined;

    if (!fieldId || !label || !replacementTarget) {
      fieldErrors[`textReplacements.${index}`] =
        "Text replacements require fieldId, label, and replacementTarget.";
      return;
    }

    if (type) {
      if (!isTextReplacementFieldType(type)) {
        fieldErrors[`textReplacements.${index}`] =
          "Text replacement entries must include a supported field type.";
        return;
      }

      textFieldType = type;
    }

    textReplacements.push({
      fieldId,
      label,
      replacementTarget,
      type: textFieldType,
      value,
    });
  });

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "Text replacement data is invalid.",
      fields: fieldErrors,
      success: false,
    };
  }

  return {
    success: true,
    textReplacements,
  };
}

async function parseImageReplacements(
  formData: FormData,
): Promise<
  ReplacementPayloadResult | { imageReplacements: GenerateDocxImageReplacement[]; success: true }
> {
  const parsedImageReplacements = parseJsonArrayField(
    formData,
    "imageReplacementsMeta",
  );

  if (!parsedImageReplacements.success) {
    return {
      error: parsedImageReplacements.error,
      fields: {
        imageReplacementsMeta: parsedImageReplacements.error,
      },
      success: false,
    };
  }

  const imageReplacements: GenerateDocxImageReplacement[] = [];
  const fieldErrors: Record<string, string> = {};

  for (let index = 0; index < parsedImageReplacements.data.length; index += 1) {
    const item = parsedImageReplacements.data[index];

    if (!isRecord(item)) {
      fieldErrors[`imageReplacements.${index}`] =
        "Image replacement entries must be objects.";
      continue;
    }

    const fieldId = readStringValue(item, "fieldId");
    const label = readStringValue(item, "label");
    const replacementTarget = readStringValue(item, "replacementTarget");
    const fileKey = readStringValue(item, "fileKey");
    const acceptedTypes = Array.isArray(item.acceptedTypes)
      ? item.acceptedTypes.filter(isAcceptedDocumentImageType)
      : [...ACCEPTED_DOCUMENT_IMAGE_TYPES];

    if (!fieldId || !label || !replacementTarget || !fileKey) {
      fieldErrors[`imageReplacements.${index}`] =
        "Image replacements require fieldId, label, replacementTarget, and fileKey.";
      continue;
    }

    const imageValidation = await validateImageUpload(formData.get(fileKey), {
      acceptedTypes:
        acceptedTypes.length > 0
          ? acceptedTypes
          : [...ACCEPTED_DOCUMENT_IMAGE_TYPES],
      label,
      maxSizeMb: readOptionalPositiveNumber(item, "maxSizeMb"),
      required: true,
    });

    if (!imageValidation.success) {
      fieldErrors[fieldId] = imageValidation.error;
      continue;
    }

    if (!imageValidation.image) {
      fieldErrors[fieldId] = `${label} is required.`;
      continue;
    }

    imageReplacements.push({
      buffer: imageValidation.image.buffer,
      fieldId,
      label,
      naturalHeight:
        readOptionalPositiveNumber(item, "naturalHeight") ??
        imageValidation.image.naturalHeight,
      naturalWidth:
        readOptionalPositiveNumber(item, "naturalWidth") ??
        imageValidation.image.naturalWidth,
      replacementTarget,
      widthCm: readOptionalPositiveNumber(item, "widthCm"),
    });
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "Image replacement data is invalid.",
      fields: fieldErrors,
      success: false,
    };
  }

  return {
    imageReplacements,
    success: true,
  };
}

async function readReplacementPayload(
  formData: FormData,
): Promise<ReplacementPayloadResult> {
  const textReplacementResult = parseTextReplacements(formData);

  if (!textReplacementResult.success) {
    return textReplacementResult;
  }

  const imageReplacementResult = await parseImageReplacements(formData);

  if (!imageReplacementResult.success) {
    return imageReplacementResult;
  }

  const replacementTargetCounts = new Map<string, number>();

  for (const replacement of [
    ...textReplacementResult.textReplacements,
    ...imageReplacementResult.imageReplacements,
  ]) {
    const key = replacement.replacementTarget.trim().toLowerCase();

    replacementTargetCounts.set(key, (replacementTargetCounts.get(key) ?? 0) + 1);
  }

  const duplicateReplacementTargets = [...replacementTargetCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([target]) => target);

  if (duplicateReplacementTargets.length > 0) {
    return {
      error: "Replacement Target values must be unique.",
      fields: {
        replacementTargets: `Duplicate Replacement Target values: ${duplicateReplacementTargets.join(", ")}.`,
      },
      success: false,
    };
  }

  return {
    imageReplacements: imageReplacementResult.imageReplacements,
    success: true,
    textReplacements: textReplacementResult.textReplacements,
  };
}

export async function POST(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return jsonError(
      { error: "Request body must be multipart/form-data." },
      400,
    );
  }

  const templateValidation = await validateSelectedTemplates(formData);
  const replacementValidation = await readReplacementPayload(formData);
  const fieldErrors: Record<string, string> = {};

  if (!replacementValidation.success) {
    Object.assign(fieldErrors, replacementValidation.fields);
  }

  if (!templateValidation.success) {
    fieldErrors.selectedTemplateIds = templateValidation.error;
  }

  if (
    !replacementValidation.success ||
    !templateValidation.success
  ) {
    return jsonError(
      {
        error: "Please complete the form with valid replacement data.",
        fields: fieldErrors,
      },
      400,
    );
  }

  try {
    const documentData = {
      imageReplacements: replacementValidation.imageReplacements,
      textReplacements: replacementValidation.textReplacements,
    };
    const selectedTemplates = templateValidation.templates;

    const generatedDocuments = await Promise.all(
      selectedTemplates.map(async ({ template, templateBuffer }) => {
        const docxBuffer = await generateDocx(documentData, {
          templateBuffer,
        });

        await assertGeneratedDocxBuffer(docxBuffer, template);
        debugGeneration(`DOCX generated: ${template.outputFileName}`, {
          magic: getZipMagic(docxBuffer),
          size: docxBuffer.length,
        });

        return {
          buffer: docxBuffer,
          template,
        };
      }),
    );

    if (generatedDocuments.length === 1) {
      const [generatedDocument] = generatedDocuments;

      return new NextResponse(new Uint8Array(generatedDocument.buffer), {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "Content-Disposition": `attachment; filename="${generatedDocument.template.outputFileName}"`,
          "Content-Length": String(generatedDocument.buffer.length),
          "Content-Type": DOCX_CONTENT_TYPE,
        },
      });
    }

    const archive = new JSZip();

    for (const generatedDocument of generatedDocuments) {
      archive.file(
        generatedDocument.template.outputFileName,
        generatedDocument.buffer,
      );
    }

    const archiveBuffer = await archive.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    await assertGeneratedZipBuffer(archiveBuffer);

    debugGeneration("ZIP generated", {
      magic: getZipMagic(archiveBuffer),
      size: archiveBuffer.length,
    });

    return new NextResponse(new Uint8Array(archiveBuffer), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": 'attachment; filename="generated-documents.zip"',
        "Content-Length": String(archiveBuffer.length),
        "Content-Type": ZIP_CONTENT_TYPE,
      },
    });
  } catch (error) {
    if (error instanceof InvalidTemplateArchiveError) {
      return jsonError(
        {
          error: "The Word template file is not a valid .docx archive.",
          details: error.details,
        },
        500,
      );
    }

    if (error instanceof DocumentRenderError) {
      return jsonError(
        {
          error: "The Word template could not be rendered.",
          details: error.details,
        },
        422,
      );
    }

    if (error instanceof GeneratedDocumentArchiveError) {
      return jsonError(
        {
          error: "The generated document archive is invalid.",
          details: error.details,
        },
        500,
      );
    }

    return jsonError({ error: "Unable to generate the document." }, 500);
  }
}
