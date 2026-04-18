import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addTweet, exportDB, getUser, upsertUser, type UserRecord } from "@/lib/store";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Download } from "lucide-react";

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
  const [foundUser, setFoundUser] = useState<UserRecord | null>(null);
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
  const [screenshot, setScreenshot] = useState<string | undefined>(undefined);

  const handleScreenshot = async (file: File | null) => {
    if (!file) return setScreenshot(undefined);
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image too large (max 4MB while in local mode)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setScreenshot(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCheck = () => {
    if (!username.trim()) {
      toast.error("Enter a username first");
      return;
    }
    const u = getUser(username);
    setFoundUser(u);
    setChecked(true);
    if (u) {
      setDisplayName(u.displayName);
      toast.success(`Found @${u.username} — ${u.displayName}`);
    } else {
      toast.message("New user — fill in their info below");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Username is required");
    if (!tweetText.trim()) return toast.error("Tweet text is required");

    let user = foundUser;
    if (!user) {
      if (!displayName.trim()) return toast.error("Display name is required for new users");
      user = upsertUser({
        username,
        displayName,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        party: party || undefined,
        notes: notes || undefined,
      });
    }

    const updated = addTweet(user.username, {
      url: tweetUrl,
      text: tweetText,
      postedAt: postedAt ? new Date(postedAt).toISOString() : undefined,
      screenshot,
    });

    if (updated) {
      setFoundUser(updated);
      setTweetUrl("");
      setTweetText("");
      setPostedAt("");
      setScreenshot(undefined);
      toast.success("Tweet archived");
    }
  };

  const handleExport = () => {
    const blob = new Blob([exportDB()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded users.json");
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold">Archive a tweet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter a username. If they're already in the archive, paste their tweet.
            If not, you'll add their basic info first.
          </p>
        </div>

        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-foreground">
          <strong className="text-amber-700">Heads up:</strong> data saves to your browser only.
          Use <em>Export JSON</em> to download and commit <code>src/data/users.json</code> for everyone to see.
        </div>

        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <Label htmlFor="username">Twitter username</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="username"
                placeholder="e.g. sample_politician"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setChecked(false);
                  setFoundUser(null);
                }}
              />
              <Button type="button" onClick={handleCheck}>
                Check
              </Button>
            </div>
            {checked && foundUser && (
              <p className="mt-3 text-sm text-foreground">
                ✓ Existing user: <strong>{foundUser.displayName}</strong>{" "}
                <span className="text-muted-foreground">({foundUser.tweets.length} tweets)</span>
              </p>
            )}
            {checked && !foundUser && (
              <p className="mt-3 text-sm text-muted-foreground">
                New user — please fill in their info below.
              </p>
            )}
          </div>

          {checked && (
            <form onSubmit={handleSave} className="space-y-6">
              {!foundUser && (
                <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
                  <h2 className="font-display text-lg font-semibold">User information</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Only display name is required. Username will be saved as{" "}
                    <code>{username.replace(/^@/, "").toLowerCase()}</code>.
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
                    <Label htmlFor="screenshot">Screenshot (optional, max 4MB)</Label>
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleScreenshot(e.target.files?.[0] ?? null)}
                      className="mt-1.5 cursor-pointer"
                    />
                    {screenshot && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-border">
                        <img src={screenshot} alt="Preview" className="max-h-64 w-full object-contain bg-muted" />
                        <button
                          type="button"
                          onClick={() => setScreenshot(undefined)}
                          className="block w-full border-t border-border bg-muted px-3 py-2 text-xs text-muted-foreground hover:bg-secondary"
                        >
                          Remove screenshot
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" size="lg">Save to archive</Button>
                <Button type="button" variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" /> Export JSON
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
