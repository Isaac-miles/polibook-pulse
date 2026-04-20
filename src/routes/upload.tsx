import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { downloadJSON, type UserRecord, type TweetDoc } from "@/lib/api";
import { useGetUser, useCreateTweet, useExportAll } from "@/hooks/useQueries";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload a tweet — Trail" },
      {
        name: "description",
        content: "Add a politician and archive a tweet to the public accountability record.",
      },
      { property: "og:title", content: "Upload a tweet — Trail" },
      {
        property: "og:description",
        content: "Add a politician and archive a tweet to the public accountability record.",
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [party, setParty] = useState("");
  const [notes, setNotes] = useState("");

  // tweet fields
  const [tweetUrl, setTweetUrl] = useState("");
  const [tweetText, setTweetText] = useState("");
  const [postedAt, setPostedAt] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | undefined>(undefined);

  // Use React Query hooks
  const { data: foundUser, isLoading: checking } = useGetUser(checked ? username : "", {
    enabled: checked && username.length > 0,
  });

  const router = useRouter();

  const createTweetMutation = useCreateTweet({
    onSuccess: (newTweet: TweetDoc) => {
      // Reset tweet fields only (keep user context)
      setTweetUrl("");
      setTweetText("");
      setPostedAt("");
      setScreenshotFile(null);
      setScreenshotPreview(undefined);
      toast.success("Tweet archived successfully");
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

  // Show toast when user is found
  useEffect(() => {
    if (checked && !checking && foundUser) {
      toast.success(`Found ${foundUser.displayName} — ${foundUser.tweets.length} tweet(s)`);
    } else if (checked && !checking && !foundUser) {
      toast.message("New user — fill in their info below");
    }
  }, [checked, checking, foundUser]);

  const handleScreenshot = (file: File | null) => {
    if (!file) {
      setScreenshotFile(null);
      setScreenshotPreview(undefined);
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image too large — maximum 4 MB");
      return;
    }
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCheck = async () => {
    const q = username.trim();
    if (!q) {
      toast.error("Enter a display name first");
      return;
    }
    setChecked(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Display name is required");
    if (!tweetText.trim()) return toast.error("Tweet text is required");

    const effectiveDisplayName = foundUser ? foundUser.displayName : displayName.trim();

    if (!foundUser && !effectiveDisplayName) {
      return toast.error("Display name is required for new users");
    }

    createTweetMutation.mutate({
      displayName: effectiveDisplayName,
      firstName: (foundUser?.firstName ?? firstName) || undefined,
      lastName: (foundUser?.lastName ?? lastName) || undefined,
      partyAffiliation: (foundUser?.party ?? party) || undefined,
      notes: (foundUser?.notes ?? notes) || undefined,
      tweetUrl: tweetUrl || undefined,
      tweetText,
      postedOn: postedAt ? new Date(postedAt).toISOString() : undefined,
      screenshot: screenshotFile ?? undefined,
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
          <h1 className="font-display text-3xl font-bold">Archive a tweet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a display name. If they're already in the archive, paste their tweet. If not,
            you'll add their basic info first.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {/* ---- Step 1: Look up user ---- */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <Label htmlFor="username">Display name</Label>
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
              <Button type="button" onClick={handleCheck} disabled={checking}>
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
              </Button>
            </div>
            {checked && foundUser && (
              <p className="mt-3 text-sm text-foreground">
                ✓ Existing user: <strong>{foundUser.displayName}</strong>{" "}
                <span className="text-muted-foreground">
                  ({foundUser.tweets.length} tweet
                  {foundUser.tweets.length !== 1 ? "s" : ""})
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
                    Only display name is required.
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
                    </div>
                    <div>
                      <Label htmlFor="first">First name</Label>
                      <Input
                        id="first"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last">Last name</Label>
                      <Input
                        id="last"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="party">Party / affiliation</Label>
                      <Input
                        id="party"
                        value={party}
                        onChange={(e) => setParty(e.target.value)}
                        className="mt-1.5"
                      />
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
                    </div>
                  </div>
                </div>
              )}

              {/* Tweet fields */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                <h2 className="font-display text-lg font-semibold">Tweet</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="url">Tweet URL</Label>
                    <Input
                      id="url"
                      type="url"
                      placeholder="https://twitter.com/..."
                      value={tweetUrl}
                      onChange={(e) => setTweetUrl(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="text">Tweet text *</Label>
                    <Textarea
                      id="text"
                      required
                      rows={4}
                      placeholder="Paste the full tweet text here..."
                      value={tweetText}
                      onChange={(e) => setTweetText(e.target.value)}
                      className="mt-1.5"
                    />
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
                    <Label htmlFor="screenshot">Screenshot (optional, max 4 MB)</Label>
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleScreenshot(e.target.files?.[0] ?? null)}
                      className="mt-1.5 cursor-pointer"
                    />
                    {screenshotPreview && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-border">
                        <img
                          src={screenshotPreview}
                          alt="Preview"
                          className="max-h-64 w-full object-contain bg-muted"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshotFile(null);
                            setScreenshotPreview(undefined);
                            // Reset the file input
                            const input = document.getElementById(
                              "screenshot",
                            ) as HTMLInputElement | null;
                            if (input) input.value = "";
                          }}
                          className="block w-full border-t border-border bg-muted px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"
                        >
                          Remove screenshot
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <Button type="submit" size="lg" disabled={createTweetMutation.isPending}>
                  {createTweetMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save to archive"
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleExport} disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export JSON
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
