import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, FormEvent } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { AddArchiveModal } from "@/components/AddArchiveModal";
import { useSearchUsers, useInfiniteRecentArchives } from "@/hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { HeroSection } from "@/components/pages/HeroSection";
import { RecentArchivesSection } from "@/components/pages/RecentArchivesSection";
import { SearchResultsSection } from "@/components/pages/SearchResultsSection";
import { isValidSearchQuery, validateSearchQuery } from "@/lib/validators";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wepository — Political Accountability Archive" },
      {
        name: "description",
        content:
          "Search any X/Twitter username to view their archived political tweets and public record.",
      },
      { property: "og:title", content: "Wepository — Political Accountability Archive" },
      {
        property: "og:description",
        content: "Public, queryable archive of political statements on X/Twitter.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [inputValue, setInputValue] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (!value.trim()) {
      setSearched(false);
      setActiveQuery("");
      refetchRecent?.();
    }
  };

  const queryReady = searched && isValidSearchQuery(activeQuery);

  const {
    data: users,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useSearchUsers(activeQuery, {
    enabled: queryReady,
  });

  const isSearchLoading = queryReady && (isLoading || isFetching);

  const {
    data: recentPages,
    isLoading: isLoadingRecent,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchRecent,
  } = useInfiniteRecentArchives();

  const recentArchives = recentPages?.pages.flatMap((page) => page.data) ?? [];

  const handleSearch = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const q = inputValue.trim();

      // Validate search query
      const validation = validateSearchQuery(q);
      if (!validation.valid) {
        toast.error(validation.error);
        setSearched(false);
        return;
      }

      if (q === activeQuery) {
        // Same query — force refetch to get fresh data
        refetch();
      } else {
        // New query — update key so React Query fires a new request
        setActiveQuery(q);
      }
      setSearched(true);
    },
    [inputValue, activeQuery, refetch],
  );

  return (
    <div className="min-h-screen bg-[image:var(--gradient-soft)]">
      <SiteHeader />

      <HeroSection
        inputValue={inputValue}
        onInputChange={handleInputChange}
        onSearch={handleSearch}
        isLoading={isSearchLoading}
      />

      <main className="mx-auto max-w-5xl px-2 py-12">
        {/* Recent timeline on home page */}
        {!searched && (
          <RecentArchivesSection
            archives={recentArchives}
            hasNextPage={Boolean(hasNextPage)}
            isLoading={isLoadingRecent}
            isFetchingNextPage={Boolean(isFetchingNextPage)}
            onFetchNextPage={() => fetchNextPage()}
            onAddClick={() => setIsModalOpen(true)}
          />
        )}

        {/* Search results */}
        {queryReady && (
          <SearchResultsSection
            isLoading={isSearchLoading}
            error={error}
            users={users}
            activeQuery={activeQuery}
            onRetry={() => refetch()}
          />
        )}
      </main>

      <Button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 right-4 z-20 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:bg-primary/90 sm:bottom-6 sm:right-6"
      >
        <Plus className="h-4 w-4" />
        Add archive
      </Button>

      <AddArchiveModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onArchiveAdded={() => refetchRecent()}
      />

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Wepository · A community accountability project
      </footer>
    </div>
  );
}
