import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchPostMetadata, fetchTweetScreenshot, extractUsernameFromUrl, detectPlatform } from "@/lib/api";
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
import { Loader2, AlertCircle, PenLine } from "lucide-react";

interface UploadArchiveFormProps {
  submitLabel?: string;
  onSuccess?: () => void;
  onDraftStateChange?: (hasDraft: boolean) => void;
}

const MAX_SCREENSHOTS = 8;
const MAX_FILE_SIZE = 4 * 1024 * 1024;

function formatLocalDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function parseTweetTextFromHtml(html: string) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const blockquote = doc.querySelector("blockquote");
    let text = blockquote?.textContent?.trim() || doc.body.textContent?.trim() || "";
    if (!text) return "";

    // Remove the trailing author signature and date that oEmbed includes.
    // Example: "— Shola 👑 (@itsSh0la) June 9, 2023"
    text = text
      .replace(/\s*—\s*(?:[\s\S]*?)?\(?@[-\w]+\)?\s+[A-Za-z]+\s+\d{1,2},?\s+\d{4}.*$/i, "")
      .trim();

    return text.replace(/\s+/g, " ").trim();
  } catch {
    return "";
  }
}

function isTweetTextTruncated(text: string): boolean {
  const trimmed = text.trim();
  // Check for obvious truncation markers:
  // 1. Ends with ellipsis
  if (/\.\.\.\s*$/.test(trimmed)) return true;
  // 2. Ends with ellipsis character (…)
  if (/…\s*$/.test(trimmed)) return true;
  // 3. Ends with special char that often precedes truncation (like † from oEmbed)
  if (/[†‡•◆★]\s*$/.test(trimmed)) return true;
  // 4. Long text that doesn't end with proper sentence punctuation
  if (trimmed.length > 100 && !/[.!?\"')\]]\s*$/.test(trimmed.replace(/\s+$/, ""))) return true;
  return false;
}

function parseTweetDateFromHtml(html: string) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const anchors = Array.from(doc.querySelectorAll("a"));
    const dateAnchor =
      anchors
        .reverse()
        .find(
          (anchor) =>
            anchor.href.includes("/status/") || /\b\d{4}\b/.test(anchor.textContent ?? ""),
        ) || anchors[anchors.length - 1];
    const rawDate = dateAnchor?.textContent?.trim();
    if (!rawDate) return "";
    const date = new Date(rawDate);
    if (isNaN(date.getTime())) return "";
    return formatLocalDateTime(date);
  } catch {
    return "";
  }
}

function base64ToFile(base64: string, filename: string = "tweet-screenshot.png"): File {
  // Extract the base64 data (remove the data:image/png;base64, prefix if present)
  const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "image/png" });
  return new File([blob], filename, { type: "image/png" });
}

export function UploadArchiveForm({
  submitLabel = "Save to archive",
  onSuccess,
  onDraftStateChange,
}: UploadArchiveFormProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [party, setParty] = useState("");
  const [notes, setNotes] = useState("");
  const [tweetUrl, setTweetUrl] = useState("");
  const [tweetText, setTweetText] = useState("");
  const [postedAt, setPostedAt] = useState("");
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState<string[]>([]);
  const [automaticScreenshotSrc, setAutomaticScreenshotSrc] = useState<string | null>(null);
  const [isFetchingScreenshot, setIsFetchingScreenshot] = useState(false);
  const [errors, setErrors] = useState<{
    username?: string;
    displayName?: string;
    party?: string;
    notes?: string;
    tweetUrl?: string;
    tweetText?: string;
  }>({});
  const [metadataFetched, setMetadataFetched] = useState(false);
  const [textTruncated, setTextTruncated] = useState(false);
  const [allowManualEdit, setAllowManualEdit] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  // Set to true when fetch fails — unlocks all fields for manual entry
  const [manualMode, setManualMode] = useState(false);
  // Set to true after a failed fetch to show the inline "Fill in manually" prompt
  const [fetchFailed, setFetchFailed] = useState(false);

  const hasDraftData = useMemo(
    () =>
      metadataFetched ||
      username.trim() !== "" ||
      displayName.trim() !== "" ||
      party.trim() !== "" ||
      notes.trim() !== "" ||
      tweetUrl.trim() !== "" ||
      tweetText.trim() !== "" ||
      postedAt.trim() !== "" ||
      screenshotFiles.length > 0 ||
      screenshotPreviews.length > 0 ||
      automaticScreenshotSrc !== null,
    [
      metadataFetched,
      username,
      displayName,
      party,
      notes,
      tweetUrl,
      tweetText,
      postedAt,
      screenshotFiles.length,
      screenshotPreviews.length,
      automaticScreenshotSrc,
    ],
  );

  useEffect(() => {
    onDraftStateChange?.(hasDraftData);
  }, [hasDraftData, onDraftStateChange]);

  // Persist draft to localStorage so saved drafts survive closing the modal
  useEffect(() => {
    const draftKey = "archiveDraft";
    if (hasDraftData) {
      try {
        const payload = JSON.stringify({
          tweetUrl,
          username,
          displayName,
          party,
          notes,
          tweetText,
          postedAt,
          metadataFetched,
          screenshotPreviews,
        });
        localStorage.setItem(draftKey, payload);
      } catch (err) {
        console.warn("Failed to persist draft", err);
      }
    } else {
      localStorage.removeItem(draftKey);
    }
  }, [
    hasDraftData,
    tweetUrl,
    username,
    displayName,
    party,
    notes,
    tweetText,
    postedAt,
    metadataFetched,
    screenshotPreviews,
  ]);

  // Load existing draft on mount (if any). This ensures re-opening the modal restores the draft.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("archiveDraft");
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{
        tweetUrl: string;
        username: string;
        displayName: string;
        party: string;
        notes: string;
        tweetText: string;
        postedAt: string;
        metadataFetched: boolean;
        screenshotPreviews: string[];
      }>;

      if (saved.tweetUrl) setTweetUrl(saved.tweetUrl);
      if (saved.username) setUsername(saved.username);
      if (saved.displayName) setDisplayName(saved.displayName);
      if (saved.party) setParty(saved.party);
      if (saved.notes) setNotes(saved.notes);
      if (saved.tweetText) setTweetText(saved.tweetText);
      if (saved.postedAt) setPostedAt(saved.postedAt);
      if (Array.isArray(saved.screenshotPreviews) && saved.screenshotPreviews.length > 0)
        setScreenshotPreviews(saved.screenshotPreviews);
      if (saved.metadataFetched) setMetadataFetched(true);
    } catch (err) {
      // ignore parse errors
    }
  }, []);

  const usernameValid = validateSchema(usernameSchema, username.trim()).valid;

  const { data: foundUser } = useGetUser(username.trim(), {
    enabled: (metadataFetched || manualMode) && username.trim().length > 0 && usernameValid,
  });

  const createArchiveMutation = useCreateArchive({
    onSuccess: () => {
      toast.success("Archived successfully");
      onSuccess?.();
    },
    onError: (err: Error) => {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    },
  });

  useEffect(() => {
    if (!username.trim()) {
      setErrors((prev) => ({ ...prev, username: undefined }));
      return;
    }
    const validation = validateSchema(usernameSchema, username);
    setErrors((prev) => ({ ...prev, username: validation.valid ? undefined : validation.error }));
  }, [username]);

  useEffect(() => {
    if (!displayName.trim()) {
      setErrors((prev) => ({ ...prev, displayName: undefined }));
      return;
    }
    const validation = validateSchema(displayNameSchema, displayName);
    setErrors((prev) => ({
      ...prev,
      displayName: validation.valid ? undefined : validation.error,
    }));
  }, [displayName]);

  useEffect(() => {
    if (!party.trim()) {
      setErrors((prev) => ({ ...prev, party: undefined }));
      return;
    }
    const validation = validateSchema(partySchema, party);
    setErrors((prev) => ({ ...prev, party: validation.valid ? undefined : validation.error }));
  }, [party]);

  useEffect(() => {
    if (!notes.trim()) {
      setErrors((prev) => ({ ...prev, notes: undefined }));
      return;
    }
    const validation = validateSchema(notesSchema, notes);
    setErrors((prev) => ({ ...prev, notes: validation.valid ? undefined : validation.error }));
  }, [notes]);

  useEffect(() => {
    if (!tweetUrl.trim()) {
      setErrors((prev) => ({ ...prev, tweetUrl: undefined }));
      return;
    }
    const validation = validateSchema(urlSchema, tweetUrl);
    setErrors((prev) => ({ ...prev, tweetUrl: validation.valid ? undefined : validation.error }));
  }, [tweetUrl]);

  useEffect(() => {
    if (!tweetText.trim()) {
      setErrors((prev) => ({ ...prev, tweetText: undefined }));
      return;
    }
    const validation = validateSchema(statementTextSchema, tweetText);
    setErrors((prev) => ({ ...prev, tweetText: validation.valid ? undefined : validation.error }));
  }, [tweetText]);

  const handleFetchUrl = async () => {
    const val = validateSchema(urlSchema, tweetUrl.trim());
    if (!val.valid) {
      setErrors((prev) => ({ ...prev, tweetUrl: val.error }));
      toast.error(val.error);
      return;
    }

    // For platforms that can't be auto-fetched, skip the network call and go
    // straight to manual mode with a clear explanation.
    const platform = detectPlatform(tweetUrl.trim());
    if (platform === "tiktok" || platform === "instagram" || platform === "facebook") {
      const labels: Record<string, string> = {
        tiktok: "TikTok",
        instagram: "Instagram",
        facebook: "Facebook",
      };
      toast.info(`Auto-fetch isn't available for ${labels[platform]}. Fill in the details manually.`);
      setManualMode(true);
      setMetadataFetched(true);
      setAllowManualEdit(true);
      setErrors((prev) => ({ ...prev, tweetUrl: undefined }));
      // Pre-fill username from URL where possible
      const extractedUsername = extractUsernameFromUrl(tweetUrl.trim());
      if (extractedUsername) setUsername(extractedUsername);
      return;
    }

    setIsFetchingUrl(true);
    try {
      const data = await fetchPostMetadata(tweetUrl.trim());
      const fetchedUsername = data.author_url
        ? data.author_url.split("/").filter(Boolean).pop() || ""
        : extractUsernameFromUrl(tweetUrl.trim());
      const fetchedDisplayName = data.author_name || fetchedUsername || "";
      const parsedText = parseTweetTextFromHtml(data.html || "");
      const parsedPostedAt = parseTweetDateFromHtml(data.html || "");

      if (!fetchedUsername) {
        toast.error("Could not determine the author from this URL.");
        return;
      }

      if (!parsedText) {
        toast.error("Could not extract the post text from this URL.");
        return;
      }

      // Check if tweet text appears to be truncated
      const isTruncated = isTweetTextTruncated(parsedText);
      if (isTruncated) {
        setTextTruncated(true);
        toast.warning("Tweet text may be truncated. You can edit it before saving.");
      } else {
        setTextTruncated(false);
      }

      // Always trust the URL-author mapping. Populate username/displayName from URL/oEmbed.
      setUsername(fetchedUsername);
      setDisplayName(fetchedDisplayName);
      setTweetText(parsedText);
      setPostedAt(parsedPostedAt);
      setMetadataFetched(true);
      setAllowManualEdit(isTruncated);
      setErrors((prev) => ({ ...prev, tweetUrl: undefined, username: undefined }));

      if (!parsedPostedAt) {
        toast.info("No published date was available from the tweet metadata.");
      }

      try {
        setIsFetchingScreenshot(true);
        const screenshotBase64 = await fetchTweetScreenshot(tweetUrl.trim());
        if (screenshotBase64) {
          setAutomaticScreenshotSrc(
            screenshotBase64.startsWith("data:")
              ? screenshotBase64
              : `data:image/png;base64,${screenshotBase64}`,
          );
        } else {
          setAutomaticScreenshotSrc(null);
        }
      } catch (error) {
        console.warn("Automatic screenshot failed", error);
        setAutomaticScreenshotSrc(null);
      } finally {
        setIsFetchingScreenshot(false);
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Invalid source URL: tweet not found or metadata unavailable.";
      setErrors((prev) => ({ ...prev, tweetUrl: msg }));
      // Don't use a toast action here — toast clicks outside the modal
      // trigger the draft-prompt interceptor. Show the fallback inline instead.
      toast.error(msg);
      setFetchFailed(true);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleScreenshots = (files: FileList | null) => {
    if (!files) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`\"${file.name}\" is too large — maximum 4 MB per image`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`\"${file.name}\" is not an image`);
        continue;
      }
      if (screenshotFiles.length + newFiles.length >= MAX_SCREENSHOTS) {
        toast.error(`Maximum ${MAX_SCREENSHOTS} screenshots allowed`);
        break;
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

  const isFormValid = () => {
    if (!metadataFetched && !manualMode) return false;
    if (!username.trim()) return false;
    if (errors.username) return false;
    if (!tweetText.trim()) return false;
    if (errors.tweetText) return false;
    // In manual mode display name is always editable and required
    if (!displayName.trim()) return false;
    if (errors.displayName) return false;
    // In auto mode, if user already exists we don't need display name from form
    if (!manualMode && !foundUser && !displayName.trim()) return false;
    if (errors.party) return false;
    if (errors.notes) return false;
    // URL is required only when not in manual mode
    if (!manualMode && errors.tweetUrl) return false;
    return true;
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error("Please fix all errors before saving");
      return;
    }

    const effectiveDisplayName = foundUser ? foundUser.displayName : displayName.trim();

    // Build the final screenshots array
    const finalScreenshots: File[] = [];

    // Add the automatic screenshot first if available
    if (automaticScreenshotSrc) {
      try {
        const automaticFile = base64ToFile(
          automaticScreenshotSrc,
          "automatic-tweet-screenshot.png",
        );
        finalScreenshots.push(automaticFile);
      } catch (err) {
        console.warn("Failed to convert automatic screenshot", err);
        // Continue without automatic screenshot if conversion fails
      }
    }

    // Add manual screenshots
    finalScreenshots.push(...screenshotFiles);

    createArchiveMutation.mutate({
      displayName: effectiveDisplayName,
      username: username.trim(),
      partyAffiliation: (foundUser?.party ?? party.trim()) || undefined,
      notes: (foundUser?.notes ?? notes.trim()) || undefined,
      tweetUrl: tweetUrl.trim() || undefined,
      tweetText: tweetText.trim(),
      postedOn: postedAt || undefined,
      screenshots: finalScreenshots.length > 0 ? finalScreenshots : undefined,
    });
  };

  // Clear persisted draft after successful save
  useEffect(() => {
    if (createArchiveMutation.isSuccess) {
      try {
        localStorage.removeItem("archiveDraft");
      } catch (err) {
        // ignore
      }
    }
  }, [createArchiveMutation.isSuccess]);

  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Prevent form submission on Enter key unless it's from the submit button
    if (e.key === "Enter" && e.target !== e.currentTarget) {
      const target = e.target as HTMLElement;
      // Allow Enter only in textarea and select elements
      if (target.tagName !== "TEXTAREA" && target.tagName !== "SELECT") {
        e.preventDefault();
      }
    }
  };

  return (
    <form onSubmit={handleSave} onKeyDown={handleFormKeyDown} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="sourceUrl">Source URL</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="sourceUrl"
              type="url"
              placeholder={manualMode ? "Post URL (optional — post may be deleted)" : "Paste a link from X, TikTok, Instagram or Facebook"}
              value={tweetUrl}
              onChange={(e) => {
                setTweetUrl(e.target.value);
                setMetadataFetched(false);
                setManualMode(false);
                setFetchFailed(false);
                setAutomaticScreenshotSrc(null);
              }}
              autoFocus
              className={`${errors.tweetUrl ? "border-red-500 border-2" : ""}`}
            />
            {/* Platform badge */}
            {tweetUrl.trim() && !manualMode && (() => {
              const platform = detectPlatform(tweetUrl.trim());
              const badges: Record<string, { label: string; color: string }> = {
                twitter:   { label: "X / Twitter", color: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" },
                tiktok:    { label: "TikTok", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300" },
                instagram: { label: "Instagram", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
                facebook:  { label: "Facebook", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
              };
              const badge = badges[platform];
              if (!badge) return null;
              return (
                <span className={`mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                  {badge.label}
                  {platform !== "twitter" && (
                    <span className="ml-1 opacity-70">· manual entry required</span>
                  )}
                </span>
              );
            })()}
            {errors.tweetUrl && !manualMode && (
              <div className="mt-1 space-y-2">
                <div className="flex items-center gap-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errors.tweetUrl}</span>
                </div>
                {fetchFailed && (
                  <button
                    type="button"
                    onClick={() => {
                      setManualMode(true);
                      setMetadataFetched(true);
                      setAllowManualEdit(true);
                      setFetchFailed(false);
                      setErrors((prev) => ({ ...prev, tweetUrl: undefined }));
                    }}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    Post deleted? Fill in manually instead
                  </button>
                )}
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleFetchUrl}
            disabled={isFetchingUrl || !tweetUrl.trim()}
          >
            {isFetchingUrl ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              "Fetch"
            )}
          </Button>
        </div>
      </div>

      {/* Manual mode banner */}
      {manualMode && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-400/50 bg-amber-50 dark:bg-amber-500/10 p-3 text-sm">
          <PenLine className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">Manual entry mode</p>
            <p className="text-amber-700 dark:text-amber-400 mt-0.5">
              The post couldn't be fetched automatically — it may have been deleted. Fill in the
              details below from your own records or a screenshot.
            </p>
          </div>
        </div>
      )}

      {/* Username is populated from the URL and shown only after metadata is fetched. */}
      {(metadataFetched || manualMode) && (
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
                  if (metadataFetched && !manualMode) setMetadataFetched(false);
                  setTextTruncated(false);
                  setAllowManualEdit(false);
                }}
                disabled={metadataFetched && !manualMode}
                className={`${errors.username ? "border-red-500 border-2" : ""}`}
              />
              {errors.username && (
                <div className="flex items-center gap-1 mt-1 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errors.username}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(metadataFetched || manualMode) && (
        <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">
          {foundUser ? (
            <p>
              Found <strong>{foundUser.displayName}</strong> — {foundUser.archives.length}{" "}
              archive(s)
            </p>
          ) : (
            <p>{manualMode ? "New entry — fill in the details below." : "New user — fill in their info below."}</p>
          )}
        </div>
      )}

      {(metadataFetched || manualMode) && !foundUser && (
        <>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              placeholder="Full name to display"
              value={displayName}
              readOnly={!manualMode}
              onChange={(e) => manualMode && setDisplayName(e.target.value)}
              className={errors.displayName ? "border-red-500 border-2" : ""}
            />
            {errors.displayName && (
              <div className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{errors.displayName}</span>
              </div>
            )}
          </div>

          {/* Party affiliation field — commented out for now
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
          */}

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

      {(metadataFetched || manualMode) && (
        <div className="rounded-xl border border-border bg-card p-2 shadow-[var(--shadow-soft)]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold">Statement</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {manualMode
                  ? "Enter the statement details manually."
                  : allowManualEdit
                    ? "The statement text appears incomplete. You can edit it below."
                    : "The statement text is populated from the tweet URL."}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="url">Source URL {manualMode && <span className="text-muted-foreground font-normal">(optional)</span>}</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://twitter.com/..."
                value={tweetUrl}
                readOnly={metadataFetched && !manualMode}
                onChange={(e) => manualMode && setTweetUrl(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="text">
                Text *{" "}
                {allowManualEdit && (
                  <span className="text-yellow-600 font-semibold">(Edit to complete)</span>
                )}
              </Label>
              {textTruncated && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <div className="font-semibold mb-1">⚠️ Text may be incomplete</div>
                  <p>
                    The extracted tweet text appears to contain ellipsis (...). Please review and
                    paste the complete tweet text if needed.
                  </p>
                </div>
              )}
              <Textarea
                id="text"
                required
                rows={4}
                placeholder="Statement text"
                value={tweetText}
                onChange={(e) => setTweetText(e.target.value)}
                readOnly={!allowManualEdit && !manualMode}
                className="mt-1.5"
              />
              {errors.tweetText && (
                <div className="mt-1.5 flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errors.tweetText}
                </div>
              )}
            </div>
            {isFetchingScreenshot && (
              <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>Fetching automatic screenshot...</span>
              </div>
            )}
            {automaticScreenshotSrc && (
              <div className="rounded-xl border border-border bg-muted p-3">
                <div className="mb-2 text-sm font-medium text-foreground">Screenshot</div>
                <img
                  src={automaticScreenshotSrc}
                  alt="Automatic tweet screenshot"
                  className="w-full  rounded-lg border border-border object-contain"
                />
              </div>
            )}
            <div>
              <Label htmlFor="posted">Posted on (optional)</Label>
              <Input
                id="posted"
                type="datetime-local"
                value={postedAt}
                onChange={(e) => setPostedAt(e.target.value)}
                readOnly={!!postedAt && !manualMode}
                className="mt-1.5 w-full max-w-full"
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
              {screenshotPreviews.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Selected screenshots:</h3>
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
                            <AlertCircle className="h-4 w-4" />
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
      )}

      <div className="flex flex-wrap gap-3">
        {(metadataFetched || manualMode) && (
          <Button type="submit" size="lg" disabled={createArchiveMutation.isPending || isFetchingScreenshot}>
            {createArchiveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : isFetchingScreenshot ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Waiting for screenshot…
              </>
            ) : (
              submitLabel
            )}
          </Button>
        )}
      </div>
    </form>
  );
}
