import type { DocumentFieldSchema } from "./document-schema";

export type ActiveDocumentFormTab = "build" | "fill";

export type TextValues = Record<string, string>;

export type ImageNaturalDimensions = {
  naturalHeight: number;
  naturalWidth: number;
};

export type ImageFileValue = {
  file: File;
  naturalHeight?: number;
  naturalWidth?: number;
};

export type ImageFiles = Record<string, ImageFileValue | undefined>;

export type FillValidation = {
  imageErrors: Record<string, string | undefined>;
  isValid: boolean;
  missingRequiredCount: number;
  textErrors: Record<string, string | undefined>;
};

export type DocumentFormSnapshot = {
  imageFiles: ImageFiles;
  missingRequiredCount: number;
  schema: DocumentFieldSchema;
  schemaIsValid: boolean;
  textValues: TextValues;
};
