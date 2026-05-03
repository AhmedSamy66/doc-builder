import { sortByOrder } from "./field-order";

export function replaceFieldAtOrder<T extends { id: string; order: number }>(
  fields: readonly T[],
  fieldId: string,
  updates: Partial<Omit<T, "id">>,
) {
  return fields.map((field) =>
    field.id === fieldId ? { ...field, ...updates } : field,
  );
}

export function removeFieldById<T extends { id: string }>(
  fields: readonly T[],
  fieldId: string,
) {
  return fields.filter((field) => field.id !== fieldId);
}

export function moveField<T extends { id: string; order: number }>(
  fields: readonly T[],
  fieldId: string,
  direction: "down" | "up",
) {
  const orderedFields = sortByOrder(fields);
  const currentIndex = orderedFields.findIndex((field) => field.id === fieldId);
  const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (
    currentIndex === -1 ||
    nextIndex < 0 ||
    nextIndex >= orderedFields.length
  ) {
    return orderedFields;
  }

  const [field] = orderedFields.splice(currentIndex, 1);

  orderedFields.splice(nextIndex, 0, field);

  return orderedFields.map((orderedField, index) => ({
    ...orderedField,
    order: index,
  }));
}

export function insertFieldAfter<T extends { id: string; order: number }>(
  fields: readonly T[],
  sourceFieldId: string,
  field: T,
) {
  const orderedFields = sortByOrder(fields);
  const sourceIndex = orderedFields.findIndex(
    (currentField) => currentField.id === sourceFieldId,
  );
  const insertIndex = sourceIndex === -1 ? orderedFields.length : sourceIndex + 1;

  orderedFields.splice(insertIndex, 0, field);

  return orderedFields.map((orderedField, index) => ({
    ...orderedField,
    order: index,
  }));
}
