import { createFileRoute, useRouter } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { UploadArchiveForm } from "@/components/UploadArchiveForm";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload to archive — Wepository" },
      {
        name: "description",
        content: "Add a politician and archive a statement to the public accountability record.",
      },
      { property: "og:title", content: "Upload to archive — Wepository" },
      {
        property: "og:description",
        content: "Add a politician and archive a statement to the public accountability record.",
      },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Add to archive</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a username and fetch the tweet URL first. The statement metadata is auto-populated
            from the source and cannot be edited.
          </p>
        </div>

        <div className="mt-6 rounded-3xl border border-border bg-card/80 p-8 shadow-[var(--shadow-soft)] dark:bg-slate-950/90">
          <UploadArchiveForm
            submitLabel="Save to archive"
            onSuccess={() => router.navigate({ to: "/" })}
          />
        </div>
      </main>
    </div>
  );
}
