import type {
  DocumentFieldSchema,
  DocumentFieldSchemaValidation,
  ImageReplacementField,
  TextReplacementField,
} from "@/src/features/document-generator/types/document-schema";

export type FieldMoveDirection = "down" | "up";

export type FieldBuilderPanelProps = {
  onAddImageField: () => void;
  onAddTextField: () => void;
  onClearFields: () => void;
  onDeleteImageField: (fieldId: string) => void;
  onDeleteTextField: (fieldId: string) => void;
  onDuplicateImageField: (fieldId: string) => void;
  onDuplicateTextField: (fieldId: string) => void;
  onExportSchema: () => void;
  onImportSchemaClick: () => void;
  onMoveImageField: (fieldId: string, direction: FieldMoveDirection) => void;
  onMoveTextField: (fieldId: string, direction: FieldMoveDirection) => void;
  onUpdateImageField: (
    fieldId: string,
    updates: Partial<Omit<ImageReplacementField, "id">>,
  ) => void;
  onUpdateTextField: (
    fieldId: string,
    updates: Partial<Omit<TextReplacementField, "id">>,
  ) => void;
  schema: DocumentFieldSchema;
  storageStatus: string;
  validation: DocumentFieldSchemaValidation;
};
