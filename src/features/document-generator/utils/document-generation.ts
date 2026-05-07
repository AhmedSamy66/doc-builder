import {
  UPLOADED_TEMPLATE_METADATA_FIELD,
  getUploadedTemplateFileFieldName,
} from "@/src/features/document-generator/config/templates";
import type { DocumentTemplate } from "@/src/features/document-generator/config/templates";
import type {
  AcceptedDocumentImageType,
  DocumentFieldSchema,
  ImageReplacementField,
  ImageReplacementPayload,
  TextReplacementPayload,
} from "@/src/features/document-generator/types/document-schema";
import type {
  FillValidation,
  ImageFileValue,
  ImageFiles,
  ImageNaturalDimensions,
  TextValues,
} from "@/src/features/document-generator/types/document-form";
import { sortByOrder } from "./field-order";

type ApiErrorResponse = {
  details?: string[];
  error?: string;
  fields?: Record<string, string>;
};

export class DocumentGenerationError extends Error {
  fields?: Record<string, string>;

  constructor(message: string, fields?: Record<string, string>) {
    super(message);
    this.fields = fields;
    this.name = "DocumentGenerationError";
  }
}

const DOCX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ZIP_CONTENT_TYPE = "application/zip";
const ZIP_FALLBACK_CONTENT_TYPE = "application/x-zip-compressed";
const DOWNLOAD_DEBUG =
  process.env.NEXT_PUBLIC_DOCX_DOWNLOAD_DEBUG === "true";

export function buildApiErrorMessage(errorResponse: ApiErrorResponse) {
  const details = errorResponse.details?.filter(Boolean).join(" ");

  return [errorResponse.error, details].filter(Boolean).join(" ");
}

export function getFileNameFromDisposition(disposition: string) {
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const normalMatch = disposition.match(/filename="?([^";]+)"?/i);

  if (normalMatch?.[1]) {
    return normalMatch[1];
  }

  return null;
}

export function downloadGeneratedDocument(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function readGenerationErrorResponse(
  response: Response,
  contentType: string,
): Promise<ApiErrorResponse> {
  if (contentType.toLowerCase().includes("application/json")) {
    try {
      return (await response.json()) as ApiErrorResponse;
    } catch {
      return { error: "Document generation failed." };
    }
  }

  const errorMessage = await response.text();

  return {
    error: errorMessage || "Document generation failed.",
  };
}

export function isExpectedDocumentContentType(contentType: string) {
  const normalizedContentType = contentType.toLowerCase();

  return {
    isDocx: normalizedContentType.includes(DOCX_CONTENT_TYPE),
    isZip:
      normalizedContentType.includes(ZIP_CONTENT_TYPE) ||
      normalizedContentType.includes(ZIP_FALLBACK_CONTENT_TYPE),
  };
}

export function debugDownloadResponse(response: Response) {
  if (!DOWNLOAD_DEBUG) {
    return;
  }

  console.log("response status:", response.status);
  console.log("response ok:", response.ok);
  console.log("response headers:", Array.from(response.headers.entries()));
  console.log("content-type:", response.headers.get("content-type"));
  console.log(
    "content-disposition:",
    response.headers.get("content-disposition"),
  );
}

export function debugDownloadBlob(blob: Blob, fileName: string) {
  if (!DOWNLOAD_DEBUG) {
    return;
  }

  console.log("download blob type:", blob.type);
  console.log("download blob size:", blob.size);
  console.log("download filename:", fileName);
}

export async function buildUnexpectedResponseTypeError(
  responsePreview: Response,
  contentType: string,
) {
  const preview = await responsePreview.text().catch(() => "");
  const message = `Unexpected response type: ${contentType || "(missing content-type)"}. Status: ${responsePreview.status}.`;
  const trimmedPreview = preview.trim();

  if (!trimmedPreview) {
    return new Error(message);
  }

  return new Error(`${message} Body preview: ${trimmedPreview.slice(0, 200)}`);
}

export function getGenerateButtonLabel(selectedTemplateCount: number) {
  if (selectedTemplateCount === 0) {
    return "Select a Template";
  }

  if (selectedTemplateCount === 1) {
    return "Generate Document";
  }

  return `Generate ${selectedTemplateCount} Documents`;
}

function getStoredImageFile(imageValue: ImageFileValue | undefined) {
  return imageValue?.file;
}

function hasTextReplacementValue(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateImageFile(
  imageValue: ImageFileValue | undefined,
  field: ImageReplacementField,
) {
  const file = getStoredImageFile(imageValue);

  if (!file) {
    return field.required ? `${field.label} is required.` : undefined;
  }

  if (!field.acceptedTypes.includes(file.type as AcceptedDocumentImageType)) {
    return `${field.label} must be a PNG or JPEG image.`;
  }

  if (file.size > field.maxSizeMb * 1024 * 1024) {
    return `${field.label} must be smaller than ${field.maxSizeMb} MB.`;
  }

  if (file.size === 0) {
    return `${field.label} cannot be empty.`;
  }

  return undefined;
}

function hasValidNaturalDimensions(
  dimensions: ImageNaturalDimensions,
): dimensions is ImageNaturalDimensions {
  return (
    Number.isFinite(dimensions.naturalWidth) &&
    dimensions.naturalWidth > 0 &&
    Number.isFinite(dimensions.naturalHeight) &&
    dimensions.naturalHeight > 0
  );
}

export async function readImageNaturalDimensions(
  file: File,
): Promise<ImageNaturalDimensions | undefined> {
  if (typeof Image === "undefined" || typeof URL === "undefined") {
    return undefined;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise<ImageNaturalDimensions | undefined>((resolve) => {
      const image = new Image();

      image.onload = () => {
        const dimensions = {
          naturalHeight: image.naturalHeight,
          naturalWidth: image.naturalWidth,
        };

        resolve(
          hasValidNaturalDimensions(dimensions) ? dimensions : undefined,
        );
      };
      image.onerror = () => resolve(undefined);
      image.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function validateFillValues(
  schema: DocumentFieldSchema,
  textValues: TextValues,
  imageFiles: ImageFiles,
): FillValidation {
  const textErrors: Record<string, string | undefined> = {};
  const imageErrors: Record<string, string | undefined> = {};
  let missingRequiredCount = 0;

  for (const field of schema.textFields) {
    if (field.required && !(textValues[field.id] ?? "").trim()) {
      textErrors[field.id] = `${field.label} is required.`;
      missingRequiredCount += 1;
    }
  }

  for (const field of schema.imageFields) {
    const fileError = validateImageFile(imageFiles[field.id], field);

    if (fileError) {
      imageErrors[field.id] = fileError;

      if (field.required && !imageFiles[field.id]) {
        missingRequiredCount += 1;
      }
    }
  }

  return {
    imageErrors,
    isValid:
      Object.keys(textErrors).length === 0 &&
      Object.keys(imageErrors).length === 0,
    missingRequiredCount,
    textErrors,
  };
}

export function resolveTextValues(
  schema: DocumentFieldSchema,
  textValues: TextValues,
) {
  const resolvedValues: TextValues = {};

  for (const field of schema.textFields) {
    resolvedValues[field.id] = textValues[field.id] ?? field.defaultValue ?? "";
  }

  return resolvedValues;
}

export function buildMultipartPayload({
  imageFiles,
  schema,
  selectedTemplateIds,
  selectedTemplates,
  textValues,
}: {
  imageFiles: ImageFiles;
  schema: DocumentFieldSchema;
  selectedTemplateIds: readonly string[];
  selectedTemplates: readonly DocumentTemplate[];
  textValues: TextValues;
}) {
  const payload = new FormData();
  const selectedUploadedTemplates = selectedTemplates.filter(
    (template) => template.file,
  );
  const textReplacements = sortByOrder(schema.textFields)
    .map((field): TextReplacementPayload | undefined => {
      const value = textValues[field.id];

      if (!hasTextReplacementValue(value)) {
        return undefined;
      }

      return {
        fieldId: field.id,
        label: field.label.trim(),
        replacementTarget: field.replacementTarget.trim(),
        type: field.type,
        value,
      };
    })
    .filter(
      (replacement): replacement is TextReplacementPayload =>
        replacement !== undefined,
    );
  const imageReplacementsMeta = sortByOrder(schema.imageFields)
    .map((field): ImageReplacementPayload | undefined => {
      const imageValue = imageFiles[field.id];
      const file = imageValue?.file;

      if (!file) {
        return undefined;
      }

      const fileKey = `imageReplacement:${field.id}`;

      payload.append(fileKey, file);

      return {
        acceptedTypes: field.acceptedTypes,
        fieldId: field.id,
        fileKey,
        label: field.label.trim(),
        maxSizeMb: field.maxSizeMb,
        naturalHeight: imageValue.naturalHeight,
        naturalWidth: imageValue.naturalWidth,
        replacementTarget: field.replacementTarget.trim(),
        widthCm: field.widthCm,
      };
    })
    .filter((field): field is ImageReplacementPayload => field !== undefined);

  payload.append("selectedTemplateIds", JSON.stringify(selectedTemplateIds));
  payload.append("textReplacements", JSON.stringify(textReplacements));
  payload.append(
    "imageReplacementsMeta",
    JSON.stringify(imageReplacementsMeta),
  );

  if (selectedUploadedTemplates.length > 0) {
    payload.append(
      UPLOADED_TEMPLATE_METADATA_FIELD,
      JSON.stringify(
        selectedUploadedTemplates.map((template) => ({
          createdAt: template.createdAt,
          id: template.id,
          name: template.name,
          originalFilename: template.originalFilename ?? template.fileName,
          outputFileName: template.outputFileName,
        })),
      ),
    );

    for (const template of selectedUploadedTemplates) {
      if (template.file) {
        payload.append(
          getUploadedTemplateFileFieldName(template.id),
          template.file,
          template.originalFilename ?? template.fileName,
        );
      }
    }
  }

  return payload;
}

export async function requestGeneratedDocumentDownload({
  imageFiles,
  schema,
  selectedTemplateIds,
  selectedTemplates,
  textValues,
}: {
  imageFiles: ImageFiles;
  schema: DocumentFieldSchema;
  selectedTemplateIds: readonly string[];
  selectedTemplates: readonly DocumentTemplate[];
  textValues: TextValues;
}) {
  const response = await fetch("/api/generate-document", {
    body: buildMultipartPayload({
      imageFiles,
      schema,
      selectedTemplateIds,
      selectedTemplates,
      textValues,
    }),
    method: "POST",
  });
  const contentType = response.headers.get("content-type") || "";
  const disposition = response.headers.get("content-disposition") || "";

  debugDownloadResponse(response);

  if (!response.ok) {
    const errorResponse = await readGenerationErrorResponse(
      response,
      contentType,
    );

    throw new DocumentGenerationError(
      buildApiErrorMessage(errorResponse) || "Document generation failed.",
      errorResponse.fields,
    );
  }

  const contentTypeDetection = isExpectedDocumentContentType(contentType);
  const dispositionLower = disposition.toLowerCase();
  const headerIsDocx = contentTypeDetection.isDocx;
  const headerIsZip =
    contentTypeDetection.isZip || dispositionLower.includes(".zip");
  const responsePreview = response.clone();
  const blob = await response.blob();
  const blobType = blob.type.toLowerCase();
  const dispositionFileName = getFileNameFromDisposition(disposition);
  const dispositionFileNameLower = dispositionFileName?.toLowerCase() ?? "";
  const finalIsZip =
    headerIsZip ||
    blobType.includes("zip") ||
    dispositionFileNameLower.endsWith(".zip");
  const finalIsDocx =
    headerIsDocx ||
    blobType.includes("wordprocessingml.document") ||
    dispositionFileNameLower.endsWith(".docx");

  if (!finalIsZip && !finalIsDocx) {
    throw await buildUnexpectedResponseTypeError(
      responsePreview,
      contentType || blob.type,
    );
  }

  const fileName =
    dispositionFileName ??
    (finalIsZip ? "generated-documents.zip" : "generated-document.docx");

  debugDownloadBlob(blob, fileName);
  downloadGeneratedDocument(blob, fileName);

  return selectedTemplateIds.length === 1
    ? "Document generated. Your download has started."
    : `${selectedTemplateIds.length} documents generated. Your ZIP download has started.`;
}
