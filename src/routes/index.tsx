import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { TweetCard } from "@/components/TweetCard";
import { type UserRecord } from "@/lib/api";
import { useGetUser } from "@/hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserCircle2, Loader2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Trail — Political Accountability Archive" },
      {
        name: "description",
        content:
          "Search any X/Twitter username to view their archived political tweets and public record.",
      },
      { property: "og:title", content: "Trail — Political Accountability Archive" },
      {
        property: "og:description",
        content: "Public, queryable archive of political statements on X/Twitter.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);

  // Use React Query hook for user data fetching and caching
  const {
    data: user,
    isLoading,
    error,
  } = useGetUser(searched ? query : "", {
    enabled: searched && query.length > 0,
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearched(true);
  };

  return (
    <div className="min-h-screen bg-[image:var(--gradient-soft)]">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[image:var(--gradient-hero)]" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-20 md:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-white backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Public record · Nigeria on the trail
          </div>
          <h1 className="mt-5 font-sans text-3xl font-bold tracking-tight text-white md:text-7xl">
            Accountability{" "}
            <span className="bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              archive
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-white/90 md:text-lg">
            A community archive of political statements posted on X/Twitter by Nigerian public
            figures. Search any username to see what they actually said — with timestamps,
            screenshots, and sources.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-10 flex flex-col gap-2 rounded-2xl bg-card p-2 shadow-[var(--shadow-elevated)] sm:flex-row"
          >
            <div className="flex flex-1 items-center gap-2 px-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter display name (e.g. Jon Doe or @jondoe)"
                className="border-0 bg-transparent text-foreground shadow-none focus-visible:ring-0"
              />
            </div>
            <Button type="submit" size="lg" className="shrink-0" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching…
                </>
              ) : (
                "Load tweets & info"
              )}
            </Button>
          </form>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-4 py-12">
        {/* Initial empty state */}
        {!searched && (
          <div className="rounded-xl border border-dashed border-border bg-card/60 p-10 text-center backdrop-blur">
            <p className="text-sm text-muted-foreground">
              Search a display name to load their archived tweets and public record.
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Searching the archive…</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
            <h2 className="font-display text-lg font-semibold text-destructive">
              Something went wrong
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Search failed"}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setSearched(false)}>
              Try again
            </Button>
          </div>
        )}

        {/* Not found */}
        {searched && !isLoading && !error && !user && (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <h2 className="font-display text-xl font-semibold">No record found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              No archive exists for <strong>{query}</strong> yet.
            </p>
            <a
              href="/upload"
              className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Be the first to add them
            </a>
          </div>
        )}

        {/* Results */}
        {!isLoading && user && (
          <div className="space-y-6">
            {/* User profile card */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[image:var(--gradient-hero)] text-primary-foreground">
                <UserCircle2 className="h-9 w-9" />
              </div>
              <div className="flex-1">
                <h2 className="font-display text-2xl font-bold">{user.displayName}</h2>
                <p className="text-sm text-muted-foreground">@{user.username}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {(user.firstName || user.lastName) && (
                    <span>
                      <span className="font-medium text-foreground/70">Name:</span>{" "}
                      {[user.firstName, user.lastName].filter(Boolean).join(" ")}
                    </span>
                  )}
                  {user.party && (
                    <span>
                      <span className="font-medium text-foreground/70">Affiliation:</span>{" "}
                      {user.party}
                    </span>
                  )}
                  <span>
                    <span className="font-medium text-foreground/70">Tweets archived:</span>{" "}
                    {user.tweets.length}
                  </span>
                </div>
                {user.notes && (
                  <p className="mt-2 text-sm italic text-muted-foreground">{user.notes}</p>
                )}
              </div>
            </div>

            {/* Tweet list */}
            <div>
              <h3 className="mb-4 font-display text-lg font-semibold">
                Archived statements ({user.tweets.length})
              </h3>
              <div className="space-y-3">
                {user.tweets.length === 0 && (
                  <p className="text-sm text-muted-foreground">No tweets archived yet.</p>
                )}
                {user.tweets.map((t) => (
                  <div key={t.id} className="space-y-2">
                    <TweetCard tweet={t} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Trail · A community accountability project
      </footer>
    </div>
  );
}
