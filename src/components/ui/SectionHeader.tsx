import type { ReactNode } from "react";

type SectionHeaderProps = {
  description: string;
  icon: ReactNode;
  title: string;
};

export function SectionHeader({ description, icon, title }: SectionHeaderProps) {
  return (
    <div className="flex gap-4">
      <span
        aria-hidden="true"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700 shadow-sm shadow-blue-950/10"
      >
        {icon}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}
