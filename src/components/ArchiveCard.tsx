import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { Archive } from "@/lib/api";
import { ExternalLink, ThumbsUp, User, MessageCircle, Share2 } from "lucide-react";
import { useVoteArchive } from "@/hooks/useQueries";
import { toast } from "sonner";
import { ScreenshotGrid } from "./ScreenshotGrid";

const TRUNCATE_AT = 250;

function formatDate(iso?: string) {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;

  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export function ArchiveCard({ archive }: { archive: Archive }) {
  const [voteState, setVoteState] = useState<"love" | null>(null);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const voteMutation = useVoteArchive({
    onSuccess: (data: { loveCount: number; heartbreakCount: number }) => {
      archive.votes.loveCount = data.loveCount;
    },
  });

  const handleVote = (type: "love") => {
    if (voteState === type) {
      setVoteState(null);
    } else {
      setVoteState(type);
      voteMutation.mutate({ archiveId: archive.id, voteType: type });
    }
  };

  const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `https://wepository.com/archive/${archive.id}`;
    const copy = async () => {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } catch {
        const ta = document.createElement("textarea");
        ta.value = url;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        toast.success("Link copied to clipboard");
      }
    };
    copy();
  };

  const screenshots = archive.screenshots || (archive.screenshot ? [archive.screenshot] : []);
  const text = archive.text ?? "";
  const isTruncatable = text.length > TRUNCATE_AT;
  const displayText = isTruncatable && !expanded ? text.slice(0, TRUNCATE_AT) : text;

  return (
    <article
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-glow)] hover:-translate-y-0.5 cursor-pointer"
      onClick={() => navigate({ to: "/archive/$archiveId", params: { archiveId: archive.id } })}
    >
      <div className="absolute inset-y-0 left-0 w-1 bg-[image:var(--gradient-hero)] opacity-80" />

      {/* Profile header */}
      {archive.displayName && (
        <div className="flex items-start gap-3 mb-2 pb-4">
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

      {/* Text with truncation */}
      <p className="whitespace-pre-wrap pl-2 text-[15px] leading-relaxed text-card-foreground">
        {displayText}
        {isTruncatable && !expanded && (
          <>
            {"... "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpanded(true);
              }}
              className="text-primary font-medium hover:underline"
            >
              See more
            </button>
          </>
        )}
        {isTruncatable && expanded && (
          <>
            {" "}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setExpanded(false);
              }}
              className="text-primary font-medium hover:underline"
            >
              See less
            </button>
          </>
        )}
      </p>

      {/* Screenshots — clicks open lightbox, not the card */}
      {screenshots.length > 0 && (
        <div
          className="mt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <ScreenshotGrid images={screenshots} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-muted-foreground">
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
            navigate({ to: "/archive/$archiveId", params: { archiveId: archive.id } });
          }}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm border-border bg-muted text-muted-foreground hover:bg-muted/80"
        >
          <MessageCircle className="h-4 w-4" />
          {archive.commentCount ?? 0}
        </button>

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

        <div className="ml-auto">
          <button
            type="button"
            onClick={(e) => handleCopy(e)}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm border-border bg-muted text-muted-foreground hover:bg-muted/80"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </div>
    </article>
  );
}
