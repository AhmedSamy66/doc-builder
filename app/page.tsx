import { DocumentGeneratorWorkspace } from "@/src/features/document-generator/components/DocumentGeneratorWorkspace";

export default function Home() {
  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-linear-to-br from-slate-50 via-blue-50/30 to-slate-100 py-6 text-slate-950 lg:py-8">
      <section className="mx-auto flex w-full min-w-0 max-w-400 flex-col gap-7 px-4 sm:px-6 lg:px-8">
        <DocumentGeneratorWorkspace />
      </section>
    </main>
  );
}
