"use client";

import { cn } from "@/src/components/ui/styles";
import type { ActiveDocumentFormTab } from "@/src/features/document-generator/types/document-form";

type DocumentTabsProps = {
  activeTab: ActiveDocumentFormTab;
  onChange: (tab: ActiveDocumentFormTab) => void;
};

function TabButton({
  activeTab,
  children,
  tab,
  onClick,
}: {
  activeTab: ActiveDocumentFormTab;
  children: string;
  onClick: (tab: ActiveDocumentFormTab) => void;
  tab: ActiveDocumentFormTab;
}) {
  const isActive = activeTab === tab;

  return (
    <button
      className={cn(
        "min-h-11 cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition",
        isActive
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
      )}
      onClick={() => onClick(tab)}
      type="button"
    >
      {children}
    </button>
  );
}

export function DocumentTabs({ activeTab, onChange }: DocumentTabsProps) {
  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white/90 p-3 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="grid grid-cols-2 gap-2">
        <TabButton activeTab={activeTab} onClick={onChange} tab="build">
          Build Fields
        </TabButton>
        <TabButton activeTab={activeTab} onClick={onChange} tab="fill">
          Fill Fields
        </TabButton>
      </div>
    </section>
  );
}
