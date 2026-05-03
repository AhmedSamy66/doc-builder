"use client";

import { FileText } from "lucide-react";

type FillFieldsHeaderProps = {
  imageFieldCount: number;
  textFieldCount: number;
};

export function FillFieldsHeader({
  imageFieldCount,
  textFieldCount,
}: FillFieldsHeaderProps) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700"
      >
        <FileText className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-base font-semibold text-slate-950">
          Fill Document Values
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {textFieldCount} text inputs, {imageFieldCount} image uploads
        </p>
      </div>
    </div>
  );
}
