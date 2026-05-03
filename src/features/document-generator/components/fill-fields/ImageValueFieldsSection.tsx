"use client";

import { ImageIcon } from "lucide-react";
import { ImageUpload } from "@/src/components/ui";
import type {
  ImageFiles,
} from "@/src/features/document-generator/types/document-form";
import type {
  ImageReplacementField,
} from "@/src/features/document-generator/types/document-schema";

type ImageValueFieldsSectionProps = {
  fields: readonly ImageReplacementField[];
  imageErrors: Record<string, string | undefined>;
  imageFiles: ImageFiles;
  isSubmitting: boolean;
  onImageFileChange: (fieldId: string, file?: File) => void;
};

function formatImageHelper(field: ImageReplacementField) {
  const maxSize = `${field.maxSizeMb} MB`;
  const dimensions = field.widthCm ? `, ${field.widthCm} cm wide` : "";

  return `PNG/JPG/JPEG, max ${maxSize}${dimensions}`;
}

export function ImageValueFieldsSection({
  fields,
  imageErrors,
  imageFiles,
  isSubmitting,
  onImageFileChange,
}: ImageValueFieldsSectionProps) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-slate-400" />
        <h3 className="text-sm font-semibold text-slate-950">
          Image Uploads
        </h3>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((field) => (
          <ImageUpload
            accept={field.acceptedTypes.join(",")}
            error={imageErrors[field.id]}
            helperText={formatImageHelper(field)}
            isLoading={isSubmitting}
            key={field.id}
            label={field.label}
            labelIcon={<ImageIcon className="h-4 w-4" />}
            name={field.id}
            onChange={(file) => onImageFileChange(field.id, file)}
            previewAlt={`${field.label} preview`}
            required={field.required}
            uploadHint={`PNG, JPG, or JPEG. Max ${field.maxSizeMb} MB.`}
            value={imageFiles[field.id]?.file}
          />
        ))}
      </div>
    </div>
  );
}
