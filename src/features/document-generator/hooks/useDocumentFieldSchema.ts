"use client";

import {
  useMemo,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  createEmptyDocumentFieldSchema,
  type DocumentFieldSchema,
} from "@/src/features/document-generator/types/document-schema";
import {
  getStoredDocumentFieldSchemaJson,
  parseDocumentFieldSchemaJson,
  saveDocumentFieldSchema,
} from "@/src/features/document-generator/utils/schema-storage";

export type SchemaStorageStatus =
  | "Schema auto-saved locally"
  | "Schema loaded from local storage"
  | "Stored schema could not be loaded"
  | "Ready to build a schema";

function subscribeToStoredSchema(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);

  return () => window.removeEventListener("storage", onStoreChange);
}

function getStoredSchemaSnapshot() {
  return getStoredDocumentFieldSchemaJson();
}

function getServerSchemaSnapshot() {
  return "";
}

export function useDocumentFieldSchema() {
  const storedSchemaJson = useSyncExternalStore(
    subscribeToStoredSchema,
    getStoredSchemaSnapshot,
    getServerSchemaSnapshot,
  );
  const storedSchemaResult = useMemo(() => {
    if (!storedSchemaJson) {
      return {
        schema: createEmptyDocumentFieldSchema(),
        status: "Ready to build a schema" as SchemaStorageStatus,
      };
    }

    const parsedSchema = parseDocumentFieldSchemaJson(storedSchemaJson);

    if (!parsedSchema.success) {
      return {
        schema: createEmptyDocumentFieldSchema(),
        status: "Stored schema could not be loaded" as SchemaStorageStatus,
      };
    }

    return {
      schema: parsedSchema.schema,
      status: "Schema loaded from local storage" as SchemaStorageStatus,
    };
  }, [storedSchemaJson]);
  const [schemaOverride, setSchemaOverride] = useState<DocumentFieldSchema>();
  const schema = schemaOverride ?? storedSchemaResult.schema;
  const storageStatus: SchemaStorageStatus = schemaOverride
    ? "Schema auto-saved locally"
    : storedSchemaResult.status;
  const setSchema: Dispatch<SetStateAction<DocumentFieldSchema>> = (action) => {
    setSchemaOverride((currentSchema) => {
      const baseSchema = currentSchema ?? schema;
      const nextSchema =
        typeof action === "function" ? action(baseSchema) : action;

      saveDocumentFieldSchema(nextSchema);

      return nextSchema;
    });
  };

  return {
    schema,
    setSchema,
    storageStatus,
  };
}
