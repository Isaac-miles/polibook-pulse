import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGetUser, useCreateArchive } from "@/hooks/useQueries";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AddArchiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchiveAdded?: () => void;
}

export function AddArchiveModal({ open, onOpenChange, onArchiveAdded }: AddArchiveModalProps) {
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

  const MAX_SCREENSHOTS = 8;
  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

  // Use React Query hooks
  const { data: foundUser, isLoading: checking } = useGetUser(checked ? username : "", {
    enabled: checked && username.length > 0,
  });

  const createArchiveMutation = useCreateArchive({
    onSuccess: () => {
      // Reset all fields
      setUsername("");
      setChecked(false);
      setDisplayName("");
      setParty("");
      setNotes("");
      setTweetUrl("");
      setTweetText("");
      setPostedAt("");
      setScreenshotFiles([]);
      toast.success("Archived successfully");
      onOpenChange(false);
      onArchiveAdded?.();
    },
    onError: (err: Error) => {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    },
  });

  // Show toast when user is found
  const handleCheck = async () => {
    const q = username.trim();
    if (!q) {
      toast.error("Enter a username first");
      return;
    }
    setChecked(true);
  };

  const handleScreenshots = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" is too large — maximum 4 MB per image`);
        continue;
      }

      if (screenshotFiles.length + newFiles.length >= MAX_SCREENSHOTS) {
        toast.error(`Maximum ${MAX_SCREENSHOTS} screenshots allowed`);
        break;
      }

      newFiles.push(file);
    }

    setScreenshotFiles((prev) => [...prev, ...newFiles]);
  };

  const removeScreenshot = (index: number) => {
    setScreenshotFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Username is required");
    if (!tweetText.trim()) return toast.error("Statement text is required");

    const effectiveDisplayName = foundUser ? foundUser.displayName : displayName.trim();

    if (!foundUser && !effectiveDisplayName) {
      return toast.error("Display name is required for new users");
    }

    createArchiveMutation.mutate({
      displayName: effectiveDisplayName,
      username: username.trim(),
      partyAffiliation: (foundUser?.party ?? party) || undefined,
      notes: (foundUser?.notes ?? notes) || undefined,
      tweetUrl: tweetUrl || undefined,
      tweetText,
      postedOn: postedAt ? new Date(postedAt).toISOString() : undefined,
      screenshots: screenshotFiles.length > 0 ? screenshotFiles : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to archive</DialogTitle>
          <DialogDescription>Archive a statement with details and screenshots.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Step 1: Look up user */}
          <div className="space-y-3">
            <Label htmlFor="username">Username</Label>
            <div className="flex gap-2">
              <Input
                id="username"
                placeholder="e.g. john_doe"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setChecked(false);
                }}
                disabled={checking}
              />
              <Button type="button" variant="outline" onClick={handleCheck} disabled={checking}>
                {checking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check"
                )}
              </Button>
            </div>
          </div>

          {/* Show message if user found or new */}
          {checked && (
            <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">
              {foundUser ? (
                <p>
                  Found <strong>{foundUser.displayName}</strong> — {foundUser.archives.length}{" "}
                  archive(s)
                </p>
              ) : (
                <p>New user — fill in their info below</p>
              )}
            </div>
          )}

          {/* New user info */}
          {checked && !foundUser && (
            <>
              <div className="space-y-3">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  placeholder="Full name to display"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="party">Party affiliation (optional)</Label>
                <Input
                  id="party"
                  placeholder="e.g. APC, PDP"
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional context or notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Archive/tweet info */}
          {checked && (
            <>
              <div className="space-y-3">
                <Label htmlFor="tweetText">Text</Label>
                <Textarea
                  id="tweetText"
                  placeholder="The text of the political statement"
                  value={tweetText}
                  onChange={(e) => setTweetText(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="tweetUrl">Source URL</Label>
                <Input
                  id="tweetUrl"
                  type="url"
                  placeholder="Link to the statement"
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                />
              </div>

              <div className="space-y-3 max-w-sm">
                <Label htmlFor="postedAt">Posted date (optional)</Label>
                <Input
                  id="postedAt"
                  type="datetime-local"
                  value={postedAt}
                  onChange={(e) => setPostedAt(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="screenshots">Screenshots (optional)</Label>
                <Input
                  id="screenshots"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleScreenshots(e.currentTarget.files)}
                  disabled={screenshotFiles.length >= MAX_SCREENSHOTS}
                />
                {screenshotFiles.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {screenshotFiles.length} file(s) selected
                  </div>
                )}
              </div>
            </>
          )}

          {/* Submit button */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!checked || createArchiveMutation.isPending}>
              {createArchiveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add archive"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
