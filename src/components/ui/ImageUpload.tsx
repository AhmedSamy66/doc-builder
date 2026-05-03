"use client";

/* eslint-disable @next/next/no-img-element */
import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { CheckCircle, ImageIcon, UploadCloud, X } from "lucide-react";
import { Button } from "./Button";
import { FieldErrorMessage } from "./FieldErrorMessage";
import { cn, fieldHelperClassName, fieldLabelClassName } from "./styles";

const defaultImageAccept = ".png,.jpg,.jpeg,image/png,image/jpeg";
const defaultUploadHint = "PNG, JPG, or JPEG. Max 2 MB.";

type ImageUploadProps = {
  accept?: string;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  isLoading?: boolean;
  label: string;
  labelIcon?: ReactNode;
  name: string;
  onChange: (file: File | undefined) => void;
  previewAlt?: string;
  required?: boolean;
  uploadHint?: string;
  value?: File;
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageUpload({
  accept = defaultImageAccept,
  disabled = false,
  error,
  helperText,
  isLoading = false,
  label,
  labelIcon,
  name,
  onChange,
  previewAlt,
  required = false,
  uploadHint = defaultUploadHint,
  value,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | undefined>(undefined);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const inputId = `${name}-upload`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const hasError = Boolean(error);
  const isDisabled = disabled || isLoading;

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  function updatePreview(file: File | undefined) {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = undefined;
    }

    if (!file) {
      setPreviewUrl(undefined);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);

    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);
  }

  function handleSelectedFile(file: File | undefined) {
    updatePreview(file);
    onChange(file);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    handleSelectedFile(event.target.files?.[0]);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();

    if (!isDisabled) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (!isDisabled) {
      handleSelectedFile(event.dataTransfer.files?.[0]);
    }
  }

  function handleClear() {
    handleSelectedFile(undefined);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label
          className={cn(fieldLabelClassName, "inline-flex items-center gap-1.5")}
          htmlFor={inputId}
        >
          {labelIcon ? (
            <span aria-hidden="true" className="h-4 w-4 text-slate-500">
              {labelIcon}
            </span>
          ) : null}
          <span>
            {label}
            {required ? <span className="text-rose-500"> *</span> : null}
          </span>
        </label>
        {value ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <CheckCircle aria-hidden="true" className="h-4 w-4" />
            Ready
          </span>
        ) : null}
      </div>

      <label
        className={cn(
          "mt-2 flex min-h-52 cursor-pointer flex-col justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-4 text-center shadow-sm shadow-slate-950/5 transition-all duration-200 hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-md hover:shadow-slate-950/10",
          isDragging && "border-blue-400 bg-blue-50 shadow-md shadow-slate-950/10",
          hasError && "border-rose-300 bg-rose-50/50 hover:border-rose-300",
          isDisabled &&
            "cursor-not-allowed opacity-70 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm",
        )}
        htmlFor={inputId}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          accept={accept}
          aria-describedby={hasError ? errorId : helperText ? helperId : undefined}
          aria-invalid={hasError}
          className="sr-only"
          disabled={isDisabled}
          id={inputId}
          name={name}
          onChange={handleChange}
          ref={inputRef}
          required={required}
          type="file"
        />

        {previewUrl && value ? (
          <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-md shadow-slate-950/5 sm:flex-row sm:text-left">
            <img
              alt={previewAlt ?? `${label} preview`}
              className="h-24 w-24 shrink-0 rounded-xl border border-slate-200 bg-slate-50 object-contain p-2 shadow-sm shadow-slate-950/5"
              src={previewUrl}
            />
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                <ImageIcon aria-hidden="true" className="h-4 w-4" />
                Preview loaded
              </span>
              <p className="mt-3 truncate text-sm font-semibold text-slate-950">
                {value.name}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {formatFileSize(value.size)}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-700 shadow-sm shadow-blue-950/10">
              <UploadCloud
                aria-hidden="true"
                className="h-6 w-6"
                strokeWidth={2.25}
              />
            </span>
            <span className="mt-4 text-sm font-semibold text-slate-950">
              Click or drag to upload
            </span>
            <span className="mt-1 text-sm text-slate-500">
              {uploadHint}
            </span>
          </div>
        )}
      </label>

      <div className="mt-3 flex min-h-9 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {helperText && !hasError ? (
            <p className={fieldHelperClassName} id={helperId}>
              {helperText}
            </p>
          ) : null}
          {error ? <FieldErrorMessage id={errorId}>{error}</FieldErrorMessage> : null}
        </div>

        {value ? (
          <Button
            aria-label={`Remove ${label}`}
            className="min-h-9 shrink-0 px-3 py-1.5"
            disabled={isDisabled}
            leftIcon={<X className="h-4 w-4" />}
            onClick={handleClear}
            type="button"
            variant="secondary"
          >
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}
