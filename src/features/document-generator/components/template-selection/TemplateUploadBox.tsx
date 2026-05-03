"use client";

import type { ChangeEvent, RefObject } from "react";
import { AlertCircle, CheckCircle, UploadCloud } from "lucide-react";
import { Button } from "@/src/components/ui";
import { cn } from "@/src/components/ui/styles";
import {
  DOCX_TEMPLATE_ACCEPT,
} from "@/src/features/document-generator/config/templates";

type UploadStatus = "idle" | "uploading" | "success" | "error";

type TemplateUploadBoxProps = {
  disabled: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  onUploadChange: (event: ChangeEvent<HTMLInputElement>) => void;
  uploadFeedbackId: string;
  uploadFeedbackMessage: string;
  uploadStatus: UploadStatus;
};

export function TemplateUploadBox({
  disabled,
  inputRef,
  isUploading,
  onUploadChange,
  uploadFeedbackId,
  uploadFeedbackMessage,
  uploadStatus,
}: TemplateUploadBoxProps) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/40 p-3.5 transition hover:border-blue-300 hover:bg-blue-50">
      <input
        accept={DOCX_TEMPLATE_ACCEPT}
        aria-describedby={uploadFeedbackMessage ? uploadFeedbackId : undefined}
        className="sr-only"
        disabled={disabled || isUploading}
        multiple
        onChange={onUploadChange}
        ref={inputRef}
        type="file"
      />
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-white text-blue-700 shadow-sm shadow-blue-950/10"
        >
          <UploadCloud className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-950">
            Upload DOCX template
          </p>
          <p className="mt-0.5 truncate text-xs font-medium text-slate-500">
            Add a DOCX template for this session
          </p>
        </div>
      </div>
      <div className="mt-3">
        <Button
          aria-describedby={uploadFeedbackMessage ? uploadFeedbackId : undefined}
          className="min-h-9 w-full px-3 py-1.5"
          disabled={disabled}
          isLoading={isUploading}
          onClick={() => inputRef.current?.click()}
          type="button"
          variant="secondary"
        >
          {isUploading ? "Uploading..." : "Upload template"}
        </Button>
      </div>
      <div className="mt-2 flex min-h-5 items-start gap-1.5">
        {uploadFeedbackMessage ? (
          <>
            {uploadStatus === "success" ? (
              <CheckCircle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
              />
            ) : uploadStatus === "error" ? (
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 h-4 w-4 shrink-0 text-rose-600"
              />
            ) : null}
            <p
              aria-live="polite"
              className={cn(
                "text-xs font-semibold",
                uploadStatus === "success" && "text-emerald-700",
                uploadStatus === "error" && "text-rose-600",
                uploadStatus === "uploading" && "text-slate-500",
              )}
              id={uploadFeedbackId}
            >
              {uploadFeedbackMessage}
            </p>
          </>
        ) : (
          <p className="text-xs font-medium text-slate-500">
            Accepted format: .docx
          </p>
        )}
      </div>
    </div>
  );
}

export type { UploadStatus };
