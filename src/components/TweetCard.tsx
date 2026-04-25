import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Tweet } from "@/lib/api";
import { ExternalLink, Heart, HeartCrack, ImageIcon, X } from "lucide-react";
import { useVoteTweet } from "@/hooks/useQueries";
import { ScreenshotGrid } from "./ScreenshotGrid";

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

export function TweetCard({ tweet }: { tweet: Tweet }) {
  const [voteState, setVoteState] = useState<"love" | "hate" | null>(null);

  const voteMutation = useVoteTweet({
    onSuccess: (data) => {
      // Update local counts after successful vote
      tweet.loveCount = data.loveCount;
      tweet.heartbreakCount = data.heartbreakCount;
    },
  });

  const handleVote = (type: "love" | "hate") => {
    if (voteState === type) {
      // Toggle off
      setVoteState(null);
      // Note: Backend might need to handle unvoting, but for now, just toggle locally
    } else {
      setVoteState(type);
      voteMutation.mutate({ tweetId: tweet.id, voteType: type });
    }
  };

  // Get screenshots from new format or fall back to old format
  const screenshots = tweet.screenshots || (tweet.screenshot ? [tweet.screenshot] : []);

  return (
    <Link to={`/archive/${tweet.id}`} className="block">
      <article className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5 cursor-pointer">
        <div className="absolute inset-y-0 left-0 w-1 bg-[image:var(--gradient-hero)] opacity-80" />
        <p className="whitespace-pre-wrap pl-2 text-[15px] leading-relaxed text-card-foreground">
          {tweet.text}
        </p>

        {/* Use ScreenshotGrid for multiple/single screenshots */}
        {screenshots.length > 0 && (
          <div className="mt-4">
            <ScreenshotGrid images={screenshots} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex flex-col gap-0.5">
            <span>
              <span className="font-medium text-foreground/70">Posted:</span>{" "}
              {formatDate(tweet.postedAt)}
            </span>
            <span>
              <span className="font-medium text-foreground/70">Archived:</span>{" "}
              {formatDate(tweet.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {screenshots.length > 0 && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <ImageIcon className="h-3 w-3" /> {screenshots.length}{" "}
                {screenshots.length === 1 ? "Screenshot" : "Screenshots"}
              </span>
            )}
            {tweet.url && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    window.open(tweet.url, "_blank", "noopener,noreferrer");
                  } catch {
                    // Fallback for environments where window.open may be blocked
                    window.location.href = tweet.url;
                  }
                }}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                aria-label="View source in new tab"
              >
                View source <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div
          className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleVote("love");
            }}
            disabled={voteMutation.isPending}
            aria-pressed={voteState === "love"}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
              voteState === "love"
                ? "border-emerald-400 bg-emerald-500/10 text-emerald-300"
                : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <Heart className={`h-4 w-4 ${voteState === "love" ? "fill-current" : ""}`} />
            {tweet.loveCount}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleVote("hate");
            }}
            disabled={voteMutation.isPending}
            aria-pressed={voteState === "hate"}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
              voteState === "hate"
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <HeartCrack className={`h-4 w-4 ${voteState === "hate" ? "fill-current" : ""}`} />
            {tweet.heartbreakCount}
          </button>
        </div>
      </article>
    </Link>
  );
}
