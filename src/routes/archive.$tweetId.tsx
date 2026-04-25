import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ScreenshotGrid } from "@/components/ScreenshotGrid";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGetTweet } from "@/hooks/useQueries";
import { type ScreenshotInfo } from "@/lib/api";
import { ExternalLink, Heart, HeartCrack, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/archive/$tweetId")({
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

function formatDate(iso?: string) {
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
  const { tweetId } = Route.useParams();
  const [comment, setComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Mock comments data - in a real app, this would come from the API
  const [comments, setComments] = useState<
    Array<{ id: string; author: string; text: string; createdAt: string }>
  >([
    {
      id: "1",
      author: "Community Member",
      text: "This is an important archive. Everyone should see this.",
      createdAt: new Date().toISOString(),
    },
  ]);

  const { data: tweet, isLoading, error } = useGetTweet(tweetId);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmittingComment(true);
    // Simulate API call
    setTimeout(() => {
      setComments([
        ...comments,
        {
          id: `${comments.length + 1}`,
          author: "Anonymous User",
          text: comment,
          createdAt: new Date().toISOString(),
        },
      ]);
      setComment("");
      setIsSubmittingComment(false);
      toast.success("Comment posted");
    }, 500);
  };

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

  if (error || !tweet) {
    return (
      <div className="min-h-screen bg-background">
        <Toaster richColors position="top-center" />
        <SiteHeader />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-center">
            <p className="text-destructive">Archive not found or error loading details.</p>
          </div>
        </main>
      </div>
    );
  }

  // Get screenshots from new format or fall back to old format
  const screenshots = ((tweet.screenshots || []).map((s: ScreenshotInfo) => s.url) ||
    (tweet.screenshot?.url ? [tweet.screenshot.url] : [])) as string[];

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-4 py-12">
        {/* Archive Details Card */}
        <article className="rounded-xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
          <div className="mb-6 border-b border-border pb-6">
            <h1 className="text-2xl font-bold text-foreground">{tweet.displayName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {tweet.partyAffiliation && <span>{tweet.partyAffiliation} • </span>}
              Archived {formatDate(tweet.createdAt)}
            </p>
          </div>

          {/* User Info */}
          {(tweet.firstName || tweet.lastName || tweet.notes) && (
            <div className="mb-6 space-y-2 rounded-lg bg-muted/30 p-4">
              {tweet.firstName && (
                <p className="text-sm">
                  <span className="font-medium">First Name:</span> {tweet.firstName}
                </p>
              )}
              {tweet.lastName && (
                <p className="text-sm">
                  <span className="font-medium">Last Name:</span> {tweet.lastName}
                </p>
              )}
              {tweet.notes && (
                <p className="text-sm">
                  <span className="font-medium">Notes:</span> {tweet.notes}
                </p>
              )}
            </div>
          )}

          {/* Tweet Text */}
          <div className="mb-6">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-card-foreground">
              {tweet.tweetText}
            </p>
          </div>

          {/* Screenshots */}
          {screenshots.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 text-sm font-medium text-foreground">
                {screenshots.length === 1 ? "Screenshot" : `Screenshots (${screenshots.length})`}
              </h2>
              <ScreenshotGrid images={screenshots} />
            </div>
          )}

          {/* Metadata */}
          <div className="mb-6 space-y-2 border-t border-border pt-6 text-sm text-muted-foreground">
            {tweet.postedOn && (
              <p>
                <span className="font-medium text-foreground/70">Originally posted:</span>{" "}
                {formatDate(tweet.postedOn)}
              </p>
            )}
            {tweet.tweetUrl && (
              <p>
                <span className="font-medium text-foreground/70">Source:</span>{" "}
                <a
                  href={tweet.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  View on X/Twitter <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            )}
          </div>

          {/* Vote Buttons */}
          <div className="flex flex-wrap gap-3 border-t border-border pt-6">
            <Button variant="outline" size="sm" className="gap-2">
              <Heart className="h-4 w-4" />
              {tweet.loveCount} Love this
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <HeartCrack className="h-4 w-4" />
              {tweet.heartbreakCount} Heartbreak
            </Button>
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-8">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Community Discussion</h2>

          {/* Add Comment Form */}
          <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
            <form onSubmit={handleAddComment} className="space-y-4">
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
                  Share your thoughts
                </label>
                <Textarea
                  id="comment"
                  placeholder="Add a comment about this archive..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
              <Button type="submit" disabled={isSubmittingComment || !comment.trim()}>
                {isSubmittingComment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Post Comment
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <div className="rounded-lg border border-border bg-muted/30 p-8 text-center">
                <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium text-foreground">{c.author}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
                  </div>
                  <p className="text-sm text-card-foreground">{c.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
