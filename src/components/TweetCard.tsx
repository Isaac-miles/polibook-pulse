import { useState } from "react";
import type { Tweet } from "@/lib/api";
import { ExternalLink, Heart, HeartCrack, ImageIcon, X } from "lucide-react";
import { useVoteTweet } from "@/hooks/useQueries";

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
  const [lightbox, setLightbox] = useState(false);
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

  return (
    <article className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5">
      <div className="absolute inset-y-0 left-0 w-1 bg-[image:var(--gradient-hero)] opacity-80" />
      <p className="whitespace-pre-wrap pl-2 text-[15px] leading-relaxed text-card-foreground">
        {tweet.text}
      </p>

      {tweet.screenshot && (
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="mt-4 block w-full overflow-hidden rounded-lg border border-border bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <img
            src={tweet.screenshot}
            alt="Tweet screenshot"
            className="max-h-96 w-full object-contain"
            loading="lazy"
            style={{ backfaceVisibility: "hidden", transform: "translateZ(0)", pointerEvents: "none" }}
          />
        </button>
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
          {tweet.screenshot && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <ImageIcon className="h-3 w-3" /> Screenshot
            </span>
          )}
          {tweet.url && (
            <a
              href={tweet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              View source <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-sm">
        <button
          type="button"
          onClick={() => handleVote("love")}
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
          onClick={() => handleVote("hate")}
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

      {lightbox && tweet.screenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-background/90 p-2 text-foreground shadow-lg hover:bg-background"
            onClick={() => setLightbox(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={tweet.screenshot}
            alt="Tweet screenshot"
            className="max-h-[90vh] max-w-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </article>
  );
}
