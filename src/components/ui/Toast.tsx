"use client";

import { AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "./styles";

export type ToastVariant = "error" | "success";

export type ToastMessage = {
  description?: string;
  id: string;
  title: string;
  variant: ToastVariant;
};

type ToastViewportProps = {
  onDismiss: (toastId: string) => void;
  toasts: readonly ToastMessage[];
};

const variantClassNames: Record<ToastVariant, string> = {
  error: "border-rose-200 bg-rose-50 text-rose-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const iconClassNames: Record<ToastVariant, string> = {
  error: "border-rose-200 bg-white text-rose-600",
  success: "border-emerald-200 bg-white text-emerald-700",
};

export function ToastViewport({ onDismiss, toasts }: ToastViewportProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-relevant="additions removals"
      className="fixed right-4 top-4 z-[10000] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6"
      role="status"
    >
      {toasts.map((toast) => (
        <div
          className={cn(
            "flex min-w-0 items-start gap-3 rounded-2xl border p-3.5 shadow-[0_18px_50px_rgba(15,23,42,0.16)] backdrop-blur",
            variantClassNames[toast.variant],
          )}
          key={toast.id}
        >
          <span
            aria-hidden="true"
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm",
              iconClassNames[toast.variant],
            )}
          >
            {toast.variant === "success" ? (
              <CheckCircle className="h-4.5 w-4.5" />
            ) : (
              <AlertCircle className="h-4.5 w-4.5" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-950">
              {toast.title}
            </p>
            {toast.description ? (
              <p className="mt-1 text-sm leading-5 text-slate-600">
                {toast.description}
              </p>
            ) : null}
          </div>
          <Button
            aria-label={`Dismiss ${toast.title}`}
            className="min-h-8 shrink-0 rounded-lg px-2 py-1 text-slate-500 hover:text-slate-950"
            leftIcon={<X className="h-4 w-4" />}
            onClick={() => onDismiss(toast.id)}
            type="button"
            variant="ghost"
          >
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      ))}
    </div>
  );
}
