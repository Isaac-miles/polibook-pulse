import { useRef, useEffect } from "react";
import { Archive } from "@/lib/api";
import { ArchiveCard } from "@/components/ArchiveCard";
import { Button } from "@/components/ui/button";
import { FileText, Star, Plus, Loader2 } from "lucide-react";

interface RecentArchivesSectionProps {
  archives: Archive[];
  hasNextPage: boolean;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  onFetchNextPage: () => void;
  onAddClick: () => void;
}

export function RecentArchivesSection({
  archives,
  hasNextPage,
  isLoading,
  isFetchingNextPage,
  onFetchNextPage,
  onAddClick,
}: RecentArchivesSectionProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onFetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onFetchNextPage]);
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-2 lg:p-8 shadow-2xl backdrop-blur-xl">
      {/* subtle gradient glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-100/40 via-transparent to-emerald-200/30" />

      {/* content */}
      <div className="relative">
        <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* left */}
          <div className="flex items-start gap-4">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-500 text-white shadow-lg">
              <FileText className="h-5 w-5" />

              {/* small star accent */}
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-green-600 shadow">
                <Star className="h-3 w-3 fill-green-600" />
              </span>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Community timeline
              </p>

              <h2 className="mt-1 text-sm font-semibold text-foreground">
                Recently added archives
              </h2>
            </div>
          </div>

          {/* right CTA */}
          {(!archives || archives.length === 0) && !isLoading && (
            <Button
              onClick={onAddClick}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
              Add archive
            </Button>
          )}
        </div>

        {/* divider */}
        <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent"></div>

        {/* list */}
        <div className="space-y-4">
          {isLoading && archives.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {archives.map((archive) => (
                <ArchiveCard key={archive.id} archive={archive} />
              ))}
              {/* Sentinel element for infinite scroll */}
              <div ref={sentinelRef} className="py-4 text-center">
                {isFetchingNextPage && (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Loading more...</span>
                  </div>
                )}
                {!hasNextPage && archives.length > 0 && (
                  <p className="text-xs text-muted-foreground">No more archives</p>
                )}
              </div>
            </>
          )}
        </div>
        {hasNextPage && (
          <div className="sticky bottom-0 left-0 z-10 mt-4 rounded-t-3xl border-t border-border bg-white/95 px-4 py-3 text-center text-sm text-muted-foreground shadow-[inset_0_1px_0_rgba(0,0,0,0.04)] backdrop-blur">
            {isFetchingNextPage ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more archives...
              </div>
            ) : (
              <span>Scroll to load more archives</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
