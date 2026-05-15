import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Archive } from "@/lib/api";
import { ExternalLink, ThumbsUp, ThumbsDown, ImageIcon, User } from "lucide-react";
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
  const [voteState, setVoteState] = useState<"love" | "heartbreak" | null>(null);

  const voteMutation = useVoteArchive({
    onSuccess: (data: { loveCount: number; heartbreakCount: number }) => {
      // Update local counts after successful vote
      archive.votes.loveCount = data.loveCount;
      archive.votes.heartbreakCount = data.heartbreakCount;
    },
  });

  const handleVote = (type: "love" | "heartbreak") => {
    if (voteState === type) {
      setVoteState(null);
    } else {
      setVoteState(type);
      voteMutation.mutate({ archiveId: archive.id, voteType: type });
    }
  };

  const screenshots = archive.screenshots || (archive.screenshot ? [archive.screenshot] : []);

  return (
    <Link to={"/archive/$archiveId"} params={{ archiveId: archive.id }} className="block">
      <article className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5 cursor-pointer">
        <div className="absolute inset-y-0 left-0 w-1 bg-[image:var(--gradient-hero)] opacity-80" />

        {/* Profile header */}
        {archive.displayName && (
          <div className="flex items-start gap-3 mb-2 pb-4 ">
            <div className="h-10 w-10 rounded-full bg-muted shrink-0 flex items-center justify-center">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{archive.displayName}</span>
                {archive.username && (
                  <span className="text-sm text-muted-foreground">@{archive.username}</span>
                )}
                {archive.partyAffiliation && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {archive.partyAffiliation}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="whitespace-pre-wrap pl-2 text-[15px] leading-relaxed text-card-foreground">
          {archive.text}
        </p>

        {screenshots.length > 0 && (
          <div className="mt-4">
            <ScreenshotGrid images={screenshots} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2  pt-3 text-xs text-muted-foreground">
          <div className="flex flex-col gap-0.5">
            {archive.postedAt && (
              <span>
                <span className="font-medium text-foreground/70">Posted:</span>{" "}
                {formatDate(archive.postedAt)}
              </span>
            )}
            {archive.createdAt && (
              <span>
                <span className="font-medium text-foreground/70">Archived:</span>{" "}
                {formatDate(archive.createdAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {archive.screenshotUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  try {
                    window.open(archive.screenshotUrl, "_blank", "noopener,noreferrer");
                  } catch {
                    window.location.href = archive.screenshotUrl;
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
            <ThumbsUp
              className={`h-4 w-4 cursor-pointer ${voteState === "love" ? "fill-current" : ""}`}
            />
            {archive.votes.loveCount}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              handleVote("heartbreak");
            }}
            disabled={voteMutation.isPending}
            aria-pressed={voteState === "heartbreak"}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
              voteState === "heartbreak"
                ? "border-destructive bg-destructive/10 text-destructive"
                : "border-border bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            <ThumbsDown
              className={`h-4 w-4 cursor-pointer ${voteState === "heartbreak" ? "fill-current" : ""}`}
            />
            {archive.votes.heartbreakCount}
          </button>
        </div>
      </article>
    </Link>
  );
}
