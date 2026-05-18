import { useState, useEffect } from "react";
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
import { Loader2, AlertCircle } from "lucide-react";

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
      setErrors({});
      toast.success("Archived successfully");
      onOpenChange(false);
      onArchiveAdded?.();
    },
    onError: (err: Error) => {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    },
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

  // Show toast when user is found
  const handleCheck = async () => {
    const validation = validateSchema(usernameSchema, username);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, username: validation.error }));
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

  const isFormValid = () => {
    // Check username
    if (!username.trim()) return false;
    if (errors.username) return false;

    // Check if user is checked
    if (!checked) return false;

    // Check tweetText
    if (!tweetText.trim()) return false;
    if (errors.tweetText) return false;

    // If new user, check displayName
    if (!foundUser && !displayName.trim()) return false;
    if (!foundUser && errors.displayName) return false;

    // Check other optional fields
    if (errors.party) return false;
    if (errors.notes) return false;
    if (errors.tweetUrl) return false;

    return true;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Please fix all errors before saving");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to archive</DialogTitle>
          <DialogDescription>Archive a statement with details and screenshots.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Step 1: Look up user */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="username"
                  placeholder="e.g. john_doe"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setChecked(false);
                  }}
                  disabled={checking}
                  className={`${
                    errors.username ? "border-red-500 border-2" : ""
                  }`}
                />
                {errors.username && (
                  <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.username}</span>
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleCheck}
                disabled={checking || !!errors.username || !username.trim()}
              >
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
              <div className="space-y-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  placeholder="Full name to display"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={errors.displayName ? "border-red-500 border-2" : ""}
                />
                {errors.displayName && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.displayName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="party">Party affiliation (optional)</Label>
                <Input
                  id="party"
                  placeholder="e.g. APC, PDP"
                  value={party}
                  onChange={(e) => setParty(e.target.value)}
                  className={errors.party ? "border-red-500 border-2" : ""}
                />
                {errors.party && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.party}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional context or notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className={errors.notes ? "border-red-500 border-2" : ""}
                />
                {errors.notes && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.notes}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Archive/tweet info */}
          {checked && (
            <>
              <div className="space-y-2">
                <Label htmlFor="tweetText">Text</Label>
                <Textarea
                  id="tweetText"
                  placeholder="The text of the political statement"
                  value={tweetText}
                  onChange={(e) => setTweetText(e.target.value)}
                  rows={4}
                  required
                  className={errors.tweetText ? "border-red-500 border-2" : ""}
                />
                {errors.tweetText && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.tweetText}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tweetUrl">Source URL</Label>
                <Input
                  id="tweetUrl"
                  type="url"
                  placeholder="Link to the statement"
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  className={errors.tweetUrl ? "border-red-500 border-2" : ""}
                />
                {errors.tweetUrl && (
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errors.tweetUrl}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 max-w-sm">
                <Label htmlFor="postedAt">Posted date (optional)</Label>
                <Input
                  id="postedAt"
                  type="datetime-local"
                  value={postedAt}
                  onChange={(e) => setPostedAt(e.target.value)}
                />
              </div>

              {/* Screenshots */}
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

              {/* Action buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createArchiveMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!isFormValid() || createArchiveMutation.isPending}
                  className="flex-1"
                >
                  {createArchiveMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save archive"
                  )}
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
