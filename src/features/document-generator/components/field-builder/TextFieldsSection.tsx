"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import {
  Button,
  DateInput,
  Dropdown,
  NumberInput,
  TextInput,
  Textarea,
} from "@/src/components/ui";
import type {
  DocumentFieldSchemaValidation,
  TextReplacementField,
  TextReplacementFieldType,
} from "@/src/features/document-generator/types/document-schema";
import {
  ActionButton,
  EmptyFieldState,
  FieldCardShell,
  RequiredToggleField,
  SectionIcon,
} from "./FieldBuilderPrimitives";
import {
  isDuplicateLabel,
  textTypeOptions,
} from "./field-builder-utils";
import type { FieldMoveDirection } from "./types";

type TextFieldsSectionProps = {
  fields: readonly TextReplacementField[];
  onAddTextField: () => void;
  onDeleteTextField: (fieldId: string) => void;
  onDuplicateTextField: (fieldId: string) => void;
  onMoveTextField: (fieldId: string, direction: FieldMoveDirection) => void;
  onUpdateTextField: (
    fieldId: string,
    updates: Partial<Omit<TextReplacementField, "id">>,
  ) => void;
  validation: DocumentFieldSchemaValidation;
};

export function TextFieldsSection({
  fields,
  onAddTextField,
  onDeleteTextField,
  onDuplicateTextField,
  onMoveTextField,
  onUpdateTextField,
  validation,
}: TextFieldsSectionProps) {
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

  function handleTextInputChange(
    fieldId: string,
    key: "defaultValue" | "helpText" | "label" | "replacementTarget",
  ) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onUpdateTextField(fieldId, {
        [key]: event.target.value,
      });
    };
  }

  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur sm:p-7 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <SectionIcon>
            <Type className="h-5 w-5" />
          </SectionIcon>
          <div>
            <h2 className="text-base font-semibold text-slate-950">
              Text Inputs
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {fields.length} configured
            </p>
          </div>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={onAddTextField}
          type="button"
        >
          Add Text Field
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {fields.length === 0 ? (
          <EmptyFieldState
            action={
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={onAddTextField}
                type="button"
                variant="secondary"
              >
                Add Text Field
              </Button>
            }
            icon={<Type className="h-5 w-5" />}
            title="No text inputs"
          >
            Add fields for text, dates, numbers, and longer notes.
          </EmptyFieldState>
        ) : (
          fields.map((field, index) => {
            const errors = validation.textFieldErrors[field.id] ?? {};
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
                      onClick={() => onMoveTextField(field.id, "up")}
                    >
                      Up
                    </ActionButton>
                    <ActionButton
                      disabled={index === fields.length - 1}
                      icon={<ArrowDown className="h-4 w-4" />}
                      onClick={() => onMoveTextField(field.id, "down")}
                    >
                      Down
                    </ActionButton>
                    <ActionButton
                      icon={<Copy className="h-4 w-4" />}
                      onClick={() => onDuplicateTextField(field.id)}
                    >
                      Duplicate
                    </ActionButton>
                    <ActionButton
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => onDeleteTextField(field.id)}
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
                    onChange={handleTextInputChange(field.id, "label")}
                    placeholder="Client Name"
                    required
                    value={field.label}
                  />
                  <TextInput
                    error={errors.replacementTarget}
                    helperText="Enter the exact text that exists in your DOCX and should be replaced."
                    label="Replacement Target"
                    name={`${field.id}-replacementTarget`}
                    onChange={handleTextInputChange(
                      field.id,
                      "replacementTarget",
                    )}
                    placeholder="{clientName}"
                    required
                    value={field.replacementTarget}
                  />
                  <Dropdown
                    error={errors.type}
                    label="Type"
                    name={`${field.id}-type`}
                    onChange={(event) =>
                      onUpdateTextField(field.id, {
                        type: event.target.value as TextReplacementFieldType,
                      })
                    }
                    options={textTypeOptions}
                    required
                    value={field.type}
                  />
                  <RequiredToggleField
                    checked={field.required}
                    onChange={(checked) =>
                      onUpdateTextField(field.id, { required: checked })
                    }
                  />
                  {field.type === "textarea" ? (
                    <Textarea
                      className="lg:col-span-2"
                      label="Default Value"
                      name={`${field.id}-defaultValue`}
                      onChange={handleTextInputChange(field.id, "defaultValue")}
                      placeholder="Optional"
                      rows={3}
                      value={field.defaultValue ?? ""}
                    />
                  ) : field.type === "date" ? (
                    <DateInput
                      label="Default Value"
                      name={`${field.id}-defaultValue`}
                      onChange={handleTextInputChange(field.id, "defaultValue")}
                      value={field.defaultValue ?? ""}
                    />
                  ) : field.type === "number" ? (
                    <NumberInput
                      label="Default Value"
                      name={`${field.id}-defaultValue`}
                      onChange={handleTextInputChange(field.id, "defaultValue")}
                      placeholder="Optional"
                      value={field.defaultValue ?? ""}
                    />
                  ) : (
                    <TextInput
                      label="Default Value"
                      name={`${field.id}-defaultValue`}
                      onChange={handleTextInputChange(field.id, "defaultValue")}
                      placeholder="Optional"
                      value={field.defaultValue ?? ""}
                    />
                  )}
                  <Textarea
                    className="lg:col-span-2"
                    label="Help Text"
                    name={`${field.id}-helpText`}
                    onChange={handleTextInputChange(field.id, "helpText")}
                    placeholder="Optional"
                    rows={3}
                    value={field.helpText ?? ""}
                  />
                </div>
              </FieldCardShell>
            );
          })
        )}
      </div>
    </section>
  );
}
