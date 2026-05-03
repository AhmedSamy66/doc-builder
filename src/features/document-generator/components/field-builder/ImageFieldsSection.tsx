"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { Button, TextInput } from "@/src/components/ui";
import { cn, fieldHelperClassName } from "@/src/components/ui/styles";
import type {
  DocumentFieldSchemaValidation,
  ImageReplacementField,
} from "@/src/features/document-generator/types/document-schema";
import {
  ActionButton,
  EmptyFieldState,
  FieldCardShell,
  OptionCheckboxField,
  RequiredToggleField,
  SectionIcon,
} from "./FieldBuilderPrimitives";
import {
  imageTypeOptions,
  isDuplicateLabel,
  parseOptionalNumber,
  toggleAcceptedImageType,
} from "./field-builder-utils";
import type { FieldMoveDirection } from "./types";

type ImageFieldsSectionProps = {
  fields: readonly ImageReplacementField[];
  onAddImageField: () => void;
  onDeleteImageField: (fieldId: string) => void;
  onDuplicateImageField: (fieldId: string) => void;
  onMoveImageField: (fieldId: string, direction: FieldMoveDirection) => void;
  onUpdateImageField: (
    fieldId: string,
    updates: Partial<Omit<ImageReplacementField, "id">>,
  ) => void;
  validation: DocumentFieldSchemaValidation;
};

export function ImageFieldsSection({
  fields,
  onAddImageField,
  onDeleteImageField,
  onDuplicateImageField,
  onMoveImageField,
  onUpdateImageField,
  validation,
}: ImageFieldsSectionProps) {
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(
    () => fields[0]?.id ?? null,
  );
  const previousFieldIdsRef = useRef<readonly string[]>(
    fields.map((field) => field.id),
  );

  useEffect(() => {
    const previousFieldIds = previousFieldIdsRef.current;
    const nextFieldIds = fields.map((field) => field.id);
    const previousFieldIdSet = new Set(previousFieldIds);
    const addedField = fields.find((field) => !previousFieldIdSet.has(field.id));

    if (addedField) {
      setExpandedFieldId(addedField.id);
    } else {
      setExpandedFieldId((currentFieldId) =>
        currentFieldId && nextFieldIds.includes(currentFieldId)
          ? currentFieldId
          : null,
      );
    }

    previousFieldIdsRef.current = nextFieldIds;
  }, [fields]);

  function handleImageInputChange(
    fieldId: string,
    key: "label" | "replacementTarget",
  ) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      onUpdateImageField(fieldId, {
        [key]: event.target.value,
      });
    };
  }

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur sm:p-7 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <SectionIcon>
            <ImageIcon className="h-5 w-5" />
          </SectionIcon>
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Image Uploads
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {fields.length} configured
            </p>
          </div>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={onAddImageField}
          type="button"
        >
          Add Image Field
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {fields.length === 0 ? (
          <EmptyFieldState
            action={
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={onAddImageField}
                type="button"
                variant="secondary"
              >
                Add Image Field
              </Button>
            }
            icon={<ImageIcon className="h-5 w-5" />}
            title="No image uploads"
          >
            Add fields for signatures, stamps, logos, or other image targets.
          </EmptyFieldState>
        ) : (
          fields.map((field, index) => {
            const errors = validation.imageFieldErrors[field.id] ?? {};
            const duplicateLabel = isDuplicateLabel(
              field.label,
              validation.duplicateLabels,
            );

            return (
              <FieldCardShell
                actions={
                  <>
                    <ActionButton
                      disabled={index === 0}
                      icon={<ArrowUp className="h-4 w-4" />}
                      onClick={() => onMoveImageField(field.id, "up")}
                    >
                      Up
                    </ActionButton>
                    <ActionButton
                      disabled={index === fields.length - 1}
                      icon={<ArrowDown className="h-4 w-4" />}
                      onClick={() => onMoveImageField(field.id, "down")}
                    >
                      Down
                    </ActionButton>
                    <ActionButton
                      icon={<Copy className="h-4 w-4" />}
                      onClick={() => onDuplicateImageField(field.id)}
                    >
                      Duplicate
                    </ActionButton>
                    <ActionButton
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => onDeleteImageField(field.id)}
                      tone="danger"
                    >
                      Delete
                    </ActionButton>
                  </>
                }
                duplicateLabelWarning={duplicateLabel}
                fieldNumber={index + 1}
                isExpanded={expandedFieldId === field.id}
                key={field.id}
                onToggleExpanded={() =>
                  setExpandedFieldId((currentFieldId) =>
                    currentFieldId === field.id ? null : field.id,
                  )
                }
                title={field.label}
              >
                <div className="grid gap-5 lg:grid-cols-2">
                  <TextInput
                    error={errors.label}
                    label="Field Label"
                    name={`${field.id}-label`}
                    onChange={handleImageInputChange(field.id, "label")}
                    placeholder="Company Stamp"
                    required
                    value={field.label}
                  />
                  <TextInput
                    error={errors.replacementTarget}
                    helperText="Enter the exact text that exists in your DOCX and should be replaced."
                    label="Replacement Target"
                    name={`${field.id}-replacementTarget`}
                    onChange={handleImageInputChange(
                      field.id,
                      "replacementTarget",
                    )}
                    placeholder="{companyStamp}"
                    required
                    value={field.replacementTarget}
                  />
                  <RequiredToggleField
                    checked={field.required}
                    onChange={(checked) =>
                      onUpdateImageField(field.id, { required: checked })
                    }
                  />
                  <TextInput
                    error={errors.maxSizeMb}
                    label="Max Size"
                    min={0.1}
                    name={`${field.id}-maxSizeMb`}
                    onChange={(event) =>
                      onUpdateImageField(field.id, {
                        maxSizeMb: Number(event.target.value),
                      })
                    }
                    step={0.1}
                    type="number"
                    value={String(field.maxSizeMb)}
                  />
                  <TextInput
                    error={errors.widthCm}
                    label="Width (cm)"
                    min={0.1}
                    name={`${field.id}-widthCm`}
                    onChange={(event) =>
                      onUpdateImageField(field.id, {
                        widthCm: parseOptionalNumber(event.target.value),
                      })
                    }
                    placeholder="Optional"
                    step={0.1}
                    type="number"
                    value={
                      field.widthCm === undefined ? "" : String(field.widthCm)
                    }
                  />
                  <div className="lg:col-span-2">
                    <p className="text-sm font-semibold text-slate-800">
                      Accepted Types
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {imageTypeOptions.map((option) => (
                        <OptionCheckboxField
                          checked={field.acceptedTypes.includes(option.value)}
                          key={option.value}
                          label={option.label}
                          onChange={(checked) =>
                            onUpdateImageField(field.id, {
                              acceptedTypes: toggleAcceptedImageType(
                                field,
                                option.value,
                                checked,
                              ),
                            })
                          }
                        />
                      ))}
                    </div>
                    {errors.acceptedTypes ? (
                      <p className="mt-2 text-sm font-semibold text-rose-600">
                        {errors.acceptedTypes}
                      </p>
                    ) : (
                      <p className={cn(fieldHelperClassName, "mt-2")}>
                        PNG/JPG/JPEG
                      </p>
                    )}
                  </div>
                </div>
              </FieldCardShell>
            );
          })
        )}
      </div>
    </section>
  );
}
