import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { downloadJSON, type UserRecord, type ArchiveDoc } from "@/lib/api";
import { useGetUser, useCreateArchive, useExportAll } from "@/hooks/useQueries";
import {
  usernameSchema,
  displayNameSchema,
  urlSchema,
  partySchema,
  statementTextSchema,
  notesSchema,
  validateSchema,
} from "@/lib/validators";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Download, Loader2, X, Plus, AlertCircle } from "lucide-react";

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
  const [username, setUsername] = useState("");
  const [checked, setChecked] = useState(false);

  // new user fields
  const [displayName, setDisplayName] = useState("");
  const [party, setParty] = useState("");
  const [notes, setNotes] = useState("");

  // archive/tweet fields
  const [tweetUrl, setTweetUrl] = useState("");
  const [tweetText, setTweetText] = useState("");
  const [postedAt, setPostedAt] = useState("");
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);

  // Validation errors
  const [errors, setErrors] = useState<{
    username?: string;
    displayName?: string;
    party?: string;
    notes?: string;
    tweetUrl?: string;
    tweetText?: string;
  }>({});

  const MAX_SCREENSHOTS = 8;
  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

  // Use React Query hooks
  const usernameValid = validateSchema(usernameSchema, username.trim()).valid;

  const { data: foundUser, isLoading: checking } = useGetUser(checked ? username.trim() : "", {
    enabled: checked && username.trim().length > 0 && usernameValid,
  });

  const router = useRouter();

  const createArchiveMutation = useCreateArchive({
    onSuccess: (newArchive: ArchiveDoc) => {
      // Reset tweet fields only (keep user context)
      setTweetUrl("");
      setTweetText("");
      setPostedAt("");
      setScreenshotFiles([]);
      setScreenshotPreviews([]);
      setErrors({});
      toast.success("Archived successfully");
      router.navigate({ to: "/" });
    },
    onError: (err: Error) => {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    },
  });

  const {
    data: exportData,
    isLoading: exporting,
    refetch: exportRefetch,
  } = useExportAll({
    enabled: false,
  });

  // Real-time validation for username
  useEffect(() => {
    if (!username.trim()) {
      setErrors((prev) => ({ ...prev, username: undefined }));
      return;
    }
    const validation = validateSchema(usernameSchema, username);
    setErrors((prev) => ({ ...prev, username: validation.valid ? undefined : validation.error }));
  }, [username]);

  // Real-time validation for displayName
  useEffect(() => {
    if (!displayName.trim()) {
      setErrors((prev) => ({ ...prev, displayName: undefined }));
      return;
    }
    const validation = validateSchema(displayNameSchema, displayName);
    setErrors((prev) => ({ ...prev, displayName: validation.valid ? undefined : validation.error }));
  }, [displayName]);

  // Real-time validation for party
  useEffect(() => {
    if (!party.trim()) {
      setErrors((prev) => ({ ...prev, party: undefined }));
      return;
    }
    const validation = validateSchema(partySchema, party);
    setErrors((prev) => ({ ...prev, party: validation.valid ? undefined : validation.error }));
  }, [party]);

  // Real-time validation for notes
  useEffect(() => {
    if (!notes.trim()) {
      setErrors((prev) => ({ ...prev, notes: undefined }));
      return;
    }
    const validation = validateSchema(notesSchema, notes);
    setErrors((prev) => ({ ...prev, notes: validation.valid ? undefined : validation.error }));
  }, [notes]);

  // Real-time validation for tweetUrl
  useEffect(() => {
    if (!tweetUrl.trim()) {
      setErrors((prev) => ({ ...prev, tweetUrl: undefined }));
      return;
    }
    const validation = validateSchema(urlSchema, tweetUrl);
    setErrors((prev) => ({ ...prev, tweetUrl: validation.valid ? undefined : validation.error }));
  }, [tweetUrl]);

  // Real-time validation for tweetText
  useEffect(() => {
    if (!tweetText.trim()) {
      setErrors((prev) => ({ ...prev, tweetText: undefined }));
      return;
    }
    const validation = validateSchema(statementTextSchema, tweetText);
    setErrors((prev) => ({ ...prev, tweetText: validation.valid ? undefined : validation.error }));
  }, [tweetText]);

  const handleCheck = () => {
    const validation = validateSchema(usernameSchema, username);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, username: validation.error }));
      setChecked(false);
      return;
    }
    setChecked(true);
  };

  const handleScreenshots = (files: FileList | null) => {
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length && screenshotFiles.length + newFiles.length < MAX_SCREENSHOTS; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File ${file.name} is larger than 4 MB`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} is not an image`);
        continue;
      }
      newFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshotPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    }

    setScreenshotFiles((prev) => [...prev, ...newFiles]);
  };

  const removeScreenshot = (index: number) => {
    setScreenshotFiles((prev) => prev.filter((_, i) => i !== index));
    setScreenshotPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all required fields
    const usernameVal = validateSchema(usernameSchema, username);
    if (!usernameVal.valid && username.trim()) {
      toast.error(usernameVal.error);
      return;
    }

    const textVal = validateSchema(statementTextSchema, tweetText);
    if (!textVal.valid) {
      toast.error(textVal.error);
      return;
    }

    const urlVal = validateSchema(urlSchema, tweetUrl);
    if (!urlVal.valid && tweetUrl.trim()) {
      toast.error(urlVal.error);
      return;
    }

    // Validate display name for new users
    if (!foundUser) {
      const displayNameVal = validateSchema(displayNameSchema, displayName);
      if (!displayNameVal.valid) {
        toast.error(displayNameVal.error);
        return;
      }
    }

    // Validate party if provided
    const partyVal = validateSchema(partySchema, party);
    if (!partyVal.valid && party.trim()) {
      toast.error(partyVal.error);
      return;
    }

    // Validate notes if provided
    const notesVal = validateSchema(notesSchema, notes);
    if (!notesVal.valid && notes.trim()) {
      toast.error(notesVal.error);
      return;
    }

    const effectiveDisplayName = foundUser ? foundUser.displayName : displayName.trim();

    createArchiveMutation.mutate({
      displayName: effectiveDisplayName,
      username: username.trim(),
      partyAffiliation: (foundUser?.party ?? party.trim()) || undefined,
      notes: (foundUser?.notes ?? notes.trim()) || undefined,
      tweetUrl: tweetUrl.trim() || undefined,
      tweetText: tweetText.trim(),
      postedOn: postedAt ? new Date(postedAt).toISOString() : undefined,
      screenshots: screenshotFiles.length > 0 ? screenshotFiles : undefined,
    });
  };

  const handleExport = async () => {
    try {
      const result = await exportRefetch();
      if (result.data) {
        downloadJSON(result.data);
        toast.success("Downloaded trail-export.json");
      }
    } catch {
      toast.error("Export failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Add to archive</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a username. If they're already in the archive, paste their statement. If not,
            you'll add their basic info first.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {/* ---- Step 1: Look up user ---- */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <Label htmlFor="username">Username</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="username"
                placeholder="e.g. Jon Doe"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setChecked(false);
                }}
              />
              <Button
                type="button"
                onClick={handleCheck}
                disabled={checking || !!errors.username || !username.trim()}
              >
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
              </Button>
            </div>
            {errors.username && (
              <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {errors.username}
              </div>
            )}
            {checked && foundUser && (
              <p className="mt-3 text-sm text-foreground">
                ✓ Existing user: <strong>{foundUser.displayName}</strong>{" "}
                <span className="text-muted-foreground">
                  ({foundUser.archives.length} archive{foundUser.archives.length !== 1 ? "s" : ""})
                </span>
              </p>
            )}
            {checked && !foundUser && !checking && (
              <p className="mt-3 text-sm text-muted-foreground">
                New user — please fill in their info below.
              </p>
            )}
          </div>

          {/* ---- Step 2+3: User info & Tweet form ---- */}
          {checked && (
            <form onSubmit={handleSave} className="space-y-6">
              {/* New user fields */}
              {!foundUser && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                  <h2 className="font-display text-lg font-semibold">User information</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Display name is required. Username will be used for searching.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label htmlFor="display">Display name *</Label>
                      <Input
                        id="display"
                        required
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="mt-1.5"
                      />
                      {errors.displayName && (
                        <div className="mt-1.5 flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          {errors.displayName}
                        </div>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="party">Party / affiliation</Label>
                      <Input
                        id="party"
                        value={party}
                        onChange={(e) => setParty(e.target.value)}
                        className="mt-1.5"
                      />
                      {errors.party && (
                        <div className="mt-1.5 flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          {errors.party}
                        </div>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1.5"
                        rows={2}
                      />
                      {errors.notes && (
                        <div className="mt-1.5 flex items-center gap-2 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          {errors.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tweet fields */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <h2 className="font-display text-lg font-semibold">Statement</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="url">Source URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://twitter.com/..."
                      value={tweetUrl}
                      onChange={(e) => setTweetUrl(e.target.value)}
                      className="mt-1.5"
                    />
                    {errors.tweetUrl && (
                      <div className="mt-1.5 flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {errors.tweetUrl}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="text">Text *</Label>
                    <Textarea
                      id="text"
                      required
                      rows={4}
                      placeholder="Paste the full statement here..."
                      value={tweetText}
                      onChange={(e) => setTweetText(e.target.value)}
                      className="mt-1.5"
                    />
                    {errors.tweetText && (
                      <div className="mt-1.5 flex items-center gap-2 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {errors.tweetText}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="posted">Posted on (optional)</Label>
                    <Input
                      id="posted"
                      type="datetime-local"
                      value={postedAt}
                      onChange={(e) => setPostedAt(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="screenshots">Screenshots (optional, max 8, 4 MB each)</Label>
                    <Input
                      id="screenshots"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleScreenshots(e.target.files)}
                      className="mt-1.5 cursor-pointer"
                      disabled={screenshotFiles.length >= MAX_SCREENSHOTS}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {screenshotFiles.length}/{MAX_SCREENSHOTS} screenshots selected
                    </p>

                    {/* Screenshot previews grid */}
                    {screenshotPreviews.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <h3 className="text-sm font-medium text-foreground">
                          Selected screenshots:
                        </h3>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                          {screenshotPreviews.map((preview, index) => (
                            <div
                              key={index}
                              className="group relative overflow-hidden rounded-lg border border-border bg-muted"
                            >
                              <img
                                src={preview}
                                alt={`Screenshot ${index + 1}`}
                                className="aspect-square w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => removeScreenshot(index)}
                                className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/20"
                                title="Delete screenshot"
                              >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/90 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                  <X className="h-4 w-4" />
                                </div>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <Button type="submit" size="lg" disabled={createArchiveMutation.isPending}>
                  {createArchiveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save to archive"
                  )}
                </Button>
                {/* <Button type="button" variant="outline" onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export JSON
                </Button> */}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
