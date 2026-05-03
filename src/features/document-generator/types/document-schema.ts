export const DOCUMENT_FIELD_SCHEMA_VERSION = 1;

export const TEXT_REPLACEMENT_FIELD_TYPES = [
  "text",
  "textarea",
  "date",
  "number",
] as const;

export const ACCEPTED_DOCUMENT_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
] as const;

export const DEFAULT_IMAGE_MAX_SIZE_MB = 2;
export const DEFAULT_IMAGE_WIDTH_CM = 3.2;

export type TextReplacementFieldType =
  (typeof TEXT_REPLACEMENT_FIELD_TYPES)[number];

export type AcceptedDocumentImageType =
  (typeof ACCEPTED_DOCUMENT_IMAGE_TYPES)[number];

export type TextReplacementField = {
  defaultValue?: string;
  helpText?: string;
  id: string;
  label: string;
  order: number;
  replacementTarget: string;
  required: boolean;
  type: TextReplacementFieldType;
};

export type ImageReplacementField = {
  acceptedTypes: AcceptedDocumentImageType[];
  id: string;
  label: string;
  maxSizeMb: number;
  order: number;
  replacementTarget: string;
  required: boolean;
  widthCm?: number;
};

export type DocumentFieldSchema = {
  imageFields: ImageReplacementField[];
  name?: string;
  textFields: TextReplacementField[];
  version: typeof DOCUMENT_FIELD_SCHEMA_VERSION;
};

export type TextReplacementPayload = {
  fieldId: string;
  label: string;
  replacementTarget: string;
  type?: TextReplacementFieldType;
  value: string;
};

export type ImageReplacementPayload = {
  acceptedTypes?: AcceptedDocumentImageType[];
  fieldId: string;
  fileKey: string;
  label: string;
  maxSizeMb?: number;
  naturalHeight?: number;
  naturalWidth?: number;
  replacementTarget: string;
  widthCm?: number;
};

export type SchemaFieldErrors = Partial<
  Record<
    | "acceptedTypes"
    | "defaultValue"
    | "helpText"
    | "label"
    | "maxSizeMb"
    | "replacementTarget"
    | "type"
    | "widthCm",
    string
  >
>;

export type DocumentFieldSchemaValidation = {
  duplicateLabels: string[];
  imageFieldErrors: Record<string, SchemaFieldErrors>;
  isValid: boolean;
  textFieldErrors: Record<string, SchemaFieldErrors>;
};

export type ImportSchemaResult =
  | {
      schema: DocumentFieldSchema;
      success: true;
    }
  | {
      error: string;
      success: false;
    };

const DEFAULT_IMAGE_ACCEPTED_TYPES = [...ACCEPTED_DOCUMENT_IMAGE_TYPES];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTextReplacementFieldType(
  value: unknown,
): value is TextReplacementFieldType {
  return (
    typeof value === "string" &&
    TEXT_REPLACEMENT_FIELD_TYPES.includes(value as TextReplacementFieldType)
  );
}

function isAcceptedDocumentImageType(
  value: unknown,
): value is AcceptedDocumentImageType {
  return (
    typeof value === "string" &&
    ACCEPTED_DOCUMENT_IMAGE_TYPES.includes(value as AcceptedDocumentImageType)
  );
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
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

function createFieldId(prefix: "image" | "text") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function makeUniqueFieldId(
  id: string | undefined,
  prefix: "image" | "text",
  usedIds: Set<string>,
) {
  const baseId = id && id.trim().length > 0 ? id.trim() : createFieldId(prefix);
  let nextId = baseId;
  let suffix = 2;

  while (usedIds.has(nextId)) {
    nextId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(nextId);

  return nextId;
}

function normalizeOrder<T extends { order: number }>(fields: readonly T[]) {
  return fields
    .slice()
    .sort((first, second) => first.order - second.order)
    .map((field, index) => ({
      ...field,
      order: index,
    }));
}

function countByNormalizedValue(values: readonly string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    const normalizedValue = value.trim().toLowerCase();

    if (!normalizedValue) {
      continue;
    }

    counts.set(normalizedValue, (counts.get(normalizedValue) ?? 0) + 1);
  }

  return counts;
}

export function createEmptyDocumentFieldSchema(): DocumentFieldSchema {
  return {
    imageFields: [],
    textFields: [],
    version: DOCUMENT_FIELD_SCHEMA_VERSION,
  };
}

export function createTextReplacementField(
  order: number,
): TextReplacementField {
  return {
    defaultValue: "",
    helpText: "",
    id: createFieldId("text"),
    label: "",
    order,
    replacementTarget: "",
    required: false,
    type: "text",
  };
}

export function createImageReplacementField(
  order: number,
): ImageReplacementField {
  return {
    acceptedTypes: [...DEFAULT_IMAGE_ACCEPTED_TYPES],
    id: createFieldId("image"),
    label: "",
    maxSizeMb: DEFAULT_IMAGE_MAX_SIZE_MB,
    order,
    replacementTarget: "",
    required: false,
  };
}

export function normalizeDocumentFieldSchema(
  schema: DocumentFieldSchema,
): DocumentFieldSchema {
  return {
    imageFields: normalizeOrder(schema.imageFields),
    name: schema.name,
    textFields: normalizeOrder(schema.textFields),
    version: DOCUMENT_FIELD_SCHEMA_VERSION,
  };
}

export function hasSchemaFields(schema: DocumentFieldSchema) {
  return schema.textFields.length > 0 || schema.imageFields.length > 0;
}

export function validateDocumentFieldSchema(
  schema: DocumentFieldSchema,
): DocumentFieldSchemaValidation {
  const textFieldErrors: Record<string, SchemaFieldErrors> = {};
  const imageFieldErrors: Record<string, SchemaFieldErrors> = {};
  const replacementTargetCounts = countByNormalizedValue([
    ...schema.textFields.map((field) => field.replacementTarget),
    ...schema.imageFields.map((field) => field.replacementTarget),
  ]);
  const labelCounts = countByNormalizedValue([
    ...schema.textFields.map((field) => field.label),
    ...schema.imageFields.map((field) => field.label),
  ]);

  for (const field of schema.textFields) {
    const errors: SchemaFieldErrors = {};
    const replacementTargetKey = field.replacementTarget.trim().toLowerCase();

    if (!field.label.trim()) {
      errors.label = "Field Label is required.";
    }

    if (!field.replacementTarget.trim()) {
      errors.replacementTarget = "Replacement Target is required.";
    } else if ((replacementTargetCounts.get(replacementTargetKey) ?? 0) > 1) {
      errors.replacementTarget =
        "Replacement Target must be unique across all fields.";
    }

    if (!isTextReplacementFieldType(field.type)) {
      errors.type = "Select a supported text input type.";
    }

    if (Object.keys(errors).length > 0) {
      textFieldErrors[field.id] = errors;
    }
  }

  for (const field of schema.imageFields) {
    const errors: SchemaFieldErrors = {};
    const replacementTargetKey = field.replacementTarget.trim().toLowerCase();

    if (!field.label.trim()) {
      errors.label = "Field Label is required.";
    }

    if (!field.replacementTarget.trim()) {
      errors.replacementTarget = "Replacement Target is required.";
    } else if ((replacementTargetCounts.get(replacementTargetKey) ?? 0) > 1) {
      errors.replacementTarget =
        "Replacement Target must be unique across all fields.";
    }

    if (!Number.isFinite(field.maxSizeMb) || field.maxSizeMb <= 0) {
      errors.maxSizeMb = "Max size must be greater than 0 MB.";
    }

    if (
      field.widthCm !== undefined &&
      (!Number.isFinite(field.widthCm) || field.widthCm <= 0)
    ) {
      errors.widthCm = "Width must be greater than 0 cm.";
    }

    if (
      field.acceptedTypes.length === 0 ||
      field.acceptedTypes.some((type) => !isAcceptedDocumentImageType(type))
    ) {
      errors.acceptedTypes = "Images must accept PNG/JPG/JPEG.";
    }

    if (Object.keys(errors).length > 0) {
      imageFieldErrors[field.id] = errors;
    }
  }

  return {
    duplicateLabels: [...labelCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([label]) => label),
    imageFieldErrors,
    isValid:
      Object.keys(textFieldErrors).length === 0 &&
      Object.keys(imageFieldErrors).length === 0,
    textFieldErrors,
  };
}

function parseTextReplacementField(
  value: unknown,
  index: number,
  usedIds: Set<string>,
): TextReplacementField | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const label = readOptionalString(value, "label");
  const replacementTarget = readOptionalString(value, "replacementTarget");
  const type = value.type;

  if (!label || !replacementTarget || !isTextReplacementFieldType(type)) {
    return undefined;
  }

  const order =
    typeof value.order === "number" && Number.isFinite(value.order)
      ? value.order
      : index;

  return {
    defaultValue:
      typeof value.defaultValue === "string" ? value.defaultValue : "",
    helpText: typeof value.helpText === "string" ? value.helpText : "",
    id: makeUniqueFieldId(readOptionalString(value, "id"), "text", usedIds),
    label,
    order,
    replacementTarget,
    required: value.required === true,
    type,
  };
}

function parseImageReplacementField(
  value: unknown,
  index: number,
  usedIds: Set<string>,
): ImageReplacementField | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const label = readOptionalString(value, "label");
  const replacementTarget = readOptionalString(value, "replacementTarget");

  if (!label || !replacementTarget) {
    return undefined;
  }

  const order =
    typeof value.order === "number" && Number.isFinite(value.order)
      ? value.order
      : index;
  const acceptedTypes = Array.isArray(value.acceptedTypes)
    ? value.acceptedTypes.filter(isAcceptedDocumentImageType)
    : DEFAULT_IMAGE_ACCEPTED_TYPES;

  return {
    acceptedTypes:
      acceptedTypes.length > 0
        ? [...new Set(acceptedTypes)]
        : [...DEFAULT_IMAGE_ACCEPTED_TYPES],
    id: makeUniqueFieldId(readOptionalString(value, "id"), "image", usedIds),
    label,
    maxSizeMb:
      readOptionalPositiveNumber(value, "maxSizeMb") ??
      DEFAULT_IMAGE_MAX_SIZE_MB,
    order,
    replacementTarget,
    required: value.required === true,
    widthCm: readOptionalPositiveNumber(value, "widthCm"),
  };
}

export function parseDocumentFieldSchema(value: unknown): ImportSchemaResult {
  if (!isRecord(value)) {
    return {
      error: "Schema file must contain a JSON object.",
      success: false,
    };
  }

  if (value.version !== DOCUMENT_FIELD_SCHEMA_VERSION) {
    return {
      error: `Schema version must be ${DOCUMENT_FIELD_SCHEMA_VERSION}.`,
      success: false,
    };
  }

  if (!Array.isArray(value.textFields) || !Array.isArray(value.imageFields)) {
    return {
      error: "Schema must include textFields and imageFields arrays.",
      success: false,
    };
  }

  const usedIds = new Set<string>();
  const textFields = value.textFields.map((field, index) =>
    parseTextReplacementField(field, index, usedIds),
  );
  const imageFields = value.imageFields.map((field, index) =>
    parseImageReplacementField(field, index, usedIds),
  );

  if (textFields.some((field) => !field) || imageFields.some((field) => !field)) {
    return {
      error:
        "Every field must include Field Label, Replacement Target, and supported settings.",
      success: false,
    };
  }

  const schema = normalizeDocumentFieldSchema({
    imageFields: imageFields as ImageReplacementField[],
    name: readOptionalString(value, "name"),
    textFields: textFields as TextReplacementField[],
    version: DOCUMENT_FIELD_SCHEMA_VERSION,
  });
  const validation = validateDocumentFieldSchema(schema);

  if (!validation.isValid) {
    return {
      error:
        "Schema has invalid fields. Check required labels and duplicate replacement targets.",
      success: false,
    };
  }

  return {
    schema,
    success: true,
  };
}
