import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Archive } from "@/lib/api";
import { ExternalLink, Heart, HeartCrack, ImageIcon } from "lucide-react";
import { useVoteArchive } from "@/hooks/useQueries";
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

export function ArchiveCard({ archive }: { archive: Archive }) {
  const [voteState, setVoteState] = useState<"love" | "hate" | null>(null);

  const voteMutation = useVoteArchive({
    onSuccess: (data: { loveCount: number; heartbreakCount: number }) => {
      // Update local counts after successful vote
      archive.loveCount = data.loveCount;
      archive.heartbreakCount = data.heartbreakCount;
    },
  });

  const handleVote = (type: "love" | "hate") => {
    if (voteState === type) {
      setVoteState(null);
    } else {
      setVoteState(type);
      voteMutation.mutate({ archiveId: archive.id, voteType: type });
    }
  };

  const screenshots = archive.screenshots || (archive.screenshot ? [archive.screenshot] : []);

  return (
    <Link to={`/archive/${archive.id}`} className="block">
      <article className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5 cursor-pointer">
        <div className="absolute inset-y-0 left-0 w-1 bg-[image:var(--gradient-hero)] opacity-80" />
        <p className="whitespace-pre-wrap pl-2 text-[15px] leading-relaxed text-card-foreground">
          {archive.text}
        </p>

        {screenshots.length > 0 && (
          <div className="mt-4">
            <ScreenshotGrid images={screenshots} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <div className="flex flex-col gap-0.5">
            <span>
              <span className="font-medium text-foreground/70">Posted:</span>{" "}
              {formatDate(archive.postedAt)}
            </span>
            <span>
              <span className="font-medium text-foreground/70">Archived:</span>{" "}
              {formatDate(archive.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {screenshots.length > 0 && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <ImageIcon className="h-3 w-3" />
                {screenshots.length} {screenshots.length === 1 ? "Screenshot" : "Screenshots"}
              </span>
            )}
            {archive.url && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    window.open(archive.url, "_blank", "noopener,noreferrer");
                  } catch {
                    window.location.href = archive.url;
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
            <Heart
              className={`h-4 w-4 cursor-pointer ${voteState === "love" ? "fill-current" : ""}`}
            />
            {archive.loveCount}
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
            <HeartCrack
              className={`h-4 w-4 cursor-pointer ${voteState === "hate" ? "fill-current" : ""}`}
            />
            {archive.heartbreakCount}
          </button>
        </div>
      </article>
    </Link>
  );
}
