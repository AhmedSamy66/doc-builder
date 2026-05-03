import type { ReactNode } from "react";

type PageHeaderProps = {
  actions?: ReactNode;
  eyebrow?: string;
  icon?: ReactNode;
  subtitle?: string;
  title: string;
};

export function PageHeader({
  actions,
  eyebrow,
  icon,
  subtitle,
  title,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 pb-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex max-w-3xl items-start gap-4">
        {icon ? (
          <span
            aria-hidden="true"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-linear-to-b from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-950/20"
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-sm font-semibold uppercase tracking-normal text-blue-700">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-3">{actions}</div>
      ) : null}
    </header>
  );
}
