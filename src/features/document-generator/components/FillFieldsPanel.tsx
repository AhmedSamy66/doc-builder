"use client";

import type {
  ImageFiles,
  TextValues,
} from "@/src/features/document-generator/types/document-form";
import type {
  ImageReplacementField,
  TextReplacementField,
} from "@/src/features/document-generator/types/document-schema";
import { sortByOrder } from "@/src/features/document-generator/utils/field-order";
import { EmptyFillState } from "./fill-fields/EmptyFillState";
import { FillFieldsHeader } from "./fill-fields/FillFieldsHeader";
import { ImageValueFieldsSection } from "./fill-fields/ImageValueFieldsSection";
import { TextValueFieldsSection } from "./fill-fields/TextValueFieldsSection";

type FillFieldsPanelProps = {
  imageErrors: Record<string, string | undefined>;
  imageFiles: ImageFiles;
  imageFields: readonly ImageReplacementField[];
  isSubmitting: boolean;
  onImageFileChange: (fieldId: string, file?: File) => void;
  onTextValueChange: (fieldId: string, value: string) => void;
  textErrors: Record<string, string | undefined>;
  textFields: readonly TextReplacementField[];
  textValues: TextValues;
};

export function FillFieldsPanel({
  imageErrors,
  imageFiles,
  imageFields,
  isSubmitting,
  onImageFileChange,
  onTextValueChange,
  textErrors,
  textFields,
  textValues,
}: FillFieldsPanelProps) {
  const orderedTextFields = sortByOrder(textFields);
  const orderedImageFields = sortByOrder(imageFields);
  const hasFields =
    orderedTextFields.length > 0 || orderedImageFields.length > 0;

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur sm:rounded-3xl sm:p-7 lg:p-8">
      <FillFieldsHeader
        imageFieldCount={orderedImageFields.length}
        textFieldCount={orderedTextFields.length}
      />

      <div className="mt-5 space-y-6 sm:mt-7 sm:space-y-8">
        {!hasFields ? <EmptyFillState /> : null}

        <TextValueFieldsSection
          fields={orderedTextFields}
          onTextValueChange={onTextValueChange}
          textErrors={textErrors}
          textValues={textValues}
        />

        <ImageValueFieldsSection
          fields={orderedImageFields}
          imageErrors={imageErrors}
          imageFiles={imageFiles}
          isSubmitting={isSubmitting}
          onImageFileChange={onImageFileChange}
        />
      </div>
    </section>
  );
}
