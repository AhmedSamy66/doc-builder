import type { DropdownOption } from "@/src/components/ui";
import type {
  AcceptedDocumentImageType,
  ImageReplacementField,
} from "@/src/features/document-generator/types/document-schema";
import {
  TEXT_REPLACEMENT_FIELD_TYPES,
} from "@/src/features/document-generator/types/document-schema";

export const textTypeOptions: DropdownOption[] =
  TEXT_REPLACEMENT_FIELD_TYPES.map((type) => ({
    label:
      type === "textarea"
        ? "Textarea"
        : `${type.charAt(0).toUpperCase()}${type.slice(1)}`,
    value: type,
  }));

export const imageTypeOptions: Array<{
  label: string;
  value: AcceptedDocumentImageType;
}> = [
  {
    label: "PNG",
    value: "image/png",
  },
  {
    label: "JPG/JPEG",
    value: "image/jpeg",
  },
];

export function isDuplicateLabel(
  label: string,
  duplicateLabels: readonly string[],
) {
  return duplicateLabels.includes(label.trim().toLowerCase());
}

export function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : undefined;
}

export function toggleAcceptedImageType(
  field: ImageReplacementField,
  type: AcceptedDocumentImageType,
  checked: boolean,
) {
  if (checked) {
    return [...new Set([...field.acceptedTypes, type])];
  }

  return field.acceptedTypes.filter((acceptedType) => acceptedType !== type);
}
