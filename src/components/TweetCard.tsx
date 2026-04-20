import { useState } from "react";
import type { Tweet } from "@/lib/api";
import { ExternalLink, ImageIcon, X } from "lucide-react";

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
          className="mt-4 block w-full overflow-hidden rounded-lg border border-border bg-muted transition-transform hover:scale-[1.01]"
        >
          <img
            src={tweet.screenshot}
            alt="Tweet screenshot"
            className="max-h-96 w-full object-contain"
            loading="lazy"
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
