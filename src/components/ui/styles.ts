export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export const fieldLabelClassName = "text-sm font-semibold text-slate-800";

export const fieldControlClassName =
  "w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-950 shadow-sm shadow-slate-950/5 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export const fieldErrorClassName =
  "mt-2 flex items-start gap-1.5 text-sm font-medium text-rose-600";

export const fieldHelperClassName = "mt-2 text-sm leading-5 text-slate-500";

export const fieldIconClassName =
  "pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400";
