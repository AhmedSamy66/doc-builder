export function sortByOrder<T extends { order: number }>(fields: readonly T[]) {
  return fields.slice().sort((first, second) => first.order - second.order);
}
