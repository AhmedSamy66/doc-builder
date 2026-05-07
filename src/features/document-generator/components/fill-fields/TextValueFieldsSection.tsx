"use client";

import type { ChangeEvent } from "react";
import { AlignLeft, CalendarDays, Hash, Type } from "lucide-react";
import { DateInput, NumberInput, TextInput, Textarea } from "@/src/components/ui";
import type {
  TextReplacementField,
} from "@/src/features/document-generator/types/document-schema";

type TextValueFieldsSectionProps = {
  fields: readonly TextReplacementField[];
  onTextValueChange: (fieldId: string, value: string) => void;
  textErrors: Record<string, string | undefined>;
  textValues: Record<string, string>;
};

function getTextFieldIcon(type: TextReplacementField["type"]) {
  const className = "h-5 w-5";

  if (type === "textarea") {
    return <AlignLeft className={className} />;
  }

  if (type === "date") {
    return <CalendarDays className={className} />;
  }

  if (type === "number") {
    return <Hash className={className} />;
  }

  return <Type className={className} />;
}

export function TextValueFieldsSection({
  fields,
  onTextValueChange,
  textErrors,
  textValues,
}: TextValueFieldsSectionProps) {
  function handleTextChange(fieldId: string) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      onTextValueChange(fieldId, event.target.value);
    };
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-blue-600" />
        <h3 className="text-sm font-semibold text-slate-950">Text Inputs</h3>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((field) => {
          const inputProps = {
            error: textErrors[field.id],
            helperText: field.helpText,
            label: field.label,
            leadingIcon: getTextFieldIcon(field.type),
            name: field.id,
            onChange: handleTextChange(field.id),
            required: field.required,
            value: textValues[field.id] ?? "",
          };

          switch (field.type) {
            case "textarea":
              return (
                <Textarea
                  {...inputProps}
                  className="md:col-span-2"
                  key={field.id}
                />
              );
            case "date":
              return <DateInput {...inputProps} key={field.id} />;
            case "number":
              return <NumberInput {...inputProps} key={field.id} />;
            case "text":
              return <TextInput {...inputProps} key={field.id} />;
          }
        })}
      </div>
    </div>
  );
}
