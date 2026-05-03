"use client";

import { useState } from "react";
import type { ToastMessage } from "@/src/components/ui";

export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  function dismissToast(toastId: string) {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId),
    );
  }

  function showToast(toast: Omit<ToastMessage, "id">) {
    const toastId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    setToasts((currentToasts) => [
      ...currentToasts,
      {
        ...toast,
        id: toastId,
      },
    ]);
    window.setTimeout(() => dismissToast(toastId), 4200);
  }

  return {
    dismissToast,
    showToast,
    toasts,
  };
}
