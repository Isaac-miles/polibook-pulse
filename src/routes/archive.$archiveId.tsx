import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ScreenshotGrid } from "@/components/ScreenshotGrid";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useComments, useCreateComment, useGetArchive, useVoteArchive } from "@/hooks/useQueries";
import { type ScreenshotInfo } from "@/lib/api";
import { ExternalLink, ThumbsUp, ThumbsDown, Loader2, MessageCircle, User } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/archive/$archiveId")({
  head: () => ({
    meta: [
      { title: "Archive Details — Trail" },
      {
        name: "description",
        content: "View archive details and community discussions.",
      },
    ],
  }),
  component: ArchiveDetailsPage,
});

function formatDate(iso?: string | null) {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ArchiveDetailsPage() {
  const { archiveId } = Route.useParams();
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentText, setCommentText] = useState("");

  // Fetch archive details
  const { data: archive, isLoading, error } = useGetArchive(archiveId);

  // Comments — always fetch for this page (not toggled like ArchiveCard)
  const { data: comments, isLoading: loadingComments } = useComments(archiveId, {
    enabled: !!archive,
  });

  const createCommentMutation = useCreateComment({
    onSuccess: () => {
      setCommentText("");
      toast.success("Comment posted");
    },
  });

  const voteMutation = useVoteArchive();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster richColors position="top-center" />
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !archive) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster richColors position="top-center" />
        <SiteHeader backBtn={true} />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">Archive not found or error loading details.</p>
          </div>
        </main>
      </div>
    );
  }

  // Get screenshots from new format or fall back to old format
  const screenshots = archive.screenshots
    ? (archive.screenshots as ScreenshotInfo[]).map((s) => s.url)
    : archive.screenshot?.url
      ? [archive.screenshot.url]
      : [];
  // Combine names for a cleaner title
  const fullName = [archive.firstName, archive.lastName].filter(Boolean).join(" ");

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <SiteHeader backBtn={true} />
      <main className="mx-auto max-w-2xl px-4 py-4">
        <article className="border-b border-border pb-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-muted shrink-0  flex items-center justify-center">
              <User className="h-8 w-8" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{fullName}</span>

                {archive.partyAffiliation && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {archive.partyAffiliation}
                  </span>
                )}

                <span className="text-sm text-muted-foreground">@{archive.displayName}</span>

                <span className="text-muted-foreground">·</span>
              </div>

              {archive.notes && (
                <p className="text-sm italic text-muted-foreground mt-1">"{archive.notes}"</p>
              )}
            </div>
          </div>

          {/* CONTENT */}
          <div className="mt-3 text-[17px] leading-relaxed text-foreground">
            {archive.tweetText}
          </div>

          {/* MEDIA */}
          {screenshots?.length > 0 && (
            <div className="mt-3 rounded-xl overflow-hidden">
              <ScreenshotGrid images={screenshots} />
            </div>
          )}

          {/* ACTION BAR */}
          <div className="flex items-center justify-between max-w-md mt-3 text-muted-foreground">
            <button
              onClick={() => voteMutation.mutate({ archiveId, voteType: "love" })}
              className="flex items-center gap-1 hover:text-red-500 transition"
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-sm">{archive.votes?.loveCount ?? 0}</span>
            </button>

            <button
              onClick={() => voteMutation.mutate({ archiveId, voteType: "heartbreak" })}
              className="flex items-center gap-1 hover:text-orange-500 transition"
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="text-sm">{archive.votes?.heartbreakCount ?? 0}</span>
            </button>

            <span className="text-xs">posted {formatDate(archive.postedOn)}</span>
            <span className="text-xs text-muted-foreground">
              archived {formatDate(archive.createdAt)}
            </span>

            {archive.tweetUrl && (
              <p>
                <span className="font-medium text-foreground/70">Source:</span>{" "}
                <a
                  href={archive.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  View on X <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            )}
          </div>
        </article>

        {/* COMMENT COMPOSER */}
        <div className="flex gap-3 py-4 border-b border-border">
          {/* <MessageCircle className="mr-2 h-5 w-5" /> */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Your name"
              value={commentAuthor}
              onChange={(e) => setCommentAuthor(e.target.value)}
              className="w-full text-sm bg-transparent outline-none p-1 mb-1"
            />

            <Textarea
              disabled={!commentAuthor.trim()}
              placeholder="Post your reply..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className=" p-2 text-sm focus-visible:ring-0"
              rows={2}
            />

            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                disabled={!commentText.trim() || !commentAuthor.trim()}
                onClick={() =>
                  createCommentMutation.mutate({
                    tweetId: archiveId,
                    payload: {
                      author: commentAuthor.trim(),
                      text: commentText.trim(),
                    },
                  })
                }
              >
                Reply
              </Button>
            </div>
          </div>
        </div>

        {/* COMMENTS LIST */}
        <div>
          {loadingComments && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading comments…
            </div>
          )}

          {!loadingComments && (!comments || comments.length === 0) && (
            <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
              <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
            </div>
          )}

          {comments?.map((c) => (
            <div key={c._id} className="flex gap-3 py-3 border-b border-border">
              <div className="h-10 w-10 rounded-full bg-muted shrink-0  flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{c.author}</span>
                  <span className="text-muted-foreground">{formatDate(c.createdAt)}</span>
                </div>

                <p className="text-sm mt-1 text-foreground">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
