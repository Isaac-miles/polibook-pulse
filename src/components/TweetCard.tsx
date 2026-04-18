import type { Tweet } from "@/lib/store";
import { ExternalLink } from "lucide-react";

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
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-card-foreground">
        {tweet.text}
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <div className="flex flex-col gap-0.5">
          <span>
            <span className="font-medium text-foreground/70">Posted:</span>{" "}
            {formatDate(tweet.postedAt)}
          </span>
          <span>
            <span className="font-medium text-foreground/70">Archived:</span>{" "}
            {formatDate(tweet.submittedAt)}
          </span>
        </div>
        {tweet.url && (
          <a
            href={tweet.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            View source <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </article>
  );
}
