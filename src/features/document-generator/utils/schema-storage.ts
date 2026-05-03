import {
  createEmptyDocumentFieldSchema,
  normalizeDocumentFieldSchema,
  parseDocumentFieldSchema,
  type DocumentFieldSchema,
  type ImportSchemaResult,
} from "@/src/features/document-generator/types/document-schema";

export const FIELD_SCHEMA_STORAGE_KEY = "doc-builder.document-field-schema.v1";

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function parseDocumentFieldSchemaJson(json: string): ImportSchemaResult {
  let parsedSchema: unknown;

  try {
    parsedSchema = JSON.parse(json);
  } catch {
    return {
      error: "Schema file is not valid JSON.",
      success: false,
    };
  }

  return parseDocumentFieldSchema(parsedSchema);
}

export function readStoredDocumentFieldSchema(): ImportSchemaResult {
  if (!canUseBrowserStorage()) {
    return {
      schema: createEmptyDocumentFieldSchema(),
      success: true,
    };
  }

  const storedSchema = localStorage.getItem(FIELD_SCHEMA_STORAGE_KEY);

  if (!storedSchema) {
    return {
      schema: createEmptyDocumentFieldSchema(),
      success: true,
    };
  }

  return parseDocumentFieldSchemaJson(storedSchema);
}

export function getStoredDocumentFieldSchemaJson() {
  if (!canUseBrowserStorage()) {
    return "";
  }

  return localStorage.getItem(FIELD_SCHEMA_STORAGE_KEY) ?? "";
}

export function saveDocumentFieldSchema(schema: DocumentFieldSchema) {
  if (!canUseBrowserStorage()) {
    return;
  }

  localStorage.setItem(
    FIELD_SCHEMA_STORAGE_KEY,
    JSON.stringify(normalizeDocumentFieldSchema(schema)),
  );
}

export function clearStoredDocumentFieldSchema() {
  if (!canUseBrowserStorage()) {
    return;
  }

  localStorage.removeItem(FIELD_SCHEMA_STORAGE_KEY);
}

export function downloadDocumentFieldSchema(schema: DocumentFieldSchema) {
  const blob = new Blob(
    [JSON.stringify(normalizeDocumentFieldSchema(schema), null, 2)],
    {
      type: "application/json",
    },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 10);

  anchor.href = url;
  anchor.download = `document-field-schema-${timestamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export async function readDocumentFieldSchemaFile(
  file: File,
): Promise<ImportSchemaResult> {
  if (!file.name.toLowerCase().endsWith(".json")) {
    return {
      error: "Import a JSON schema file.",
      success: false,
    };
  }

  return parseDocumentFieldSchemaJson(await file.text());
}
