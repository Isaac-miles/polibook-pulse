import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, SubmitEventHandler, FormEvent } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ArchiveCard } from "@/components/ArchiveCard";
import { useSearchUsers, useRecentArchives } from "@/hooks/useQueries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, UserCircle2, FileText, Loader2, Star, Plus } from "lucide-react";

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
  const [inputValue, setInputValue] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [searched, setSearched] = useState(false);

  const {
    data: users,
    isLoading,
    error,
    refetch,
  } = useSearchUsers(activeQuery, {
    enabled: searched && activeQuery.length > 0,
  });

  const { data: recentArchives } = useRecentArchives();

  const handleSearch = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const q = inputValue.trim();
      if (!q) return;

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

  const totalArchives = users?.reduce((sum, u) => sum + (u.archives?.length ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen bg-[image:var(--gradient-soft)]">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border min-h-[620px]">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/nassembly.png')",
          }}
        ></div>

        {/* Dark green gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#004d26]/95 via-[#006633]/85 to-[#0f9d58]/45" />

        {/* Dot texture */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Soft fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

        <div className="relative mx-auto max-w-6xl px-4 py-12">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.25em] text-white backdrop-blur-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
            Public Record · Nigeria on the trail
          </div>

          {/* Main content */}
          <div className="mt-4 max-w-3xl">
            <h1 className="text-4xl font-bold leading-tight text-white md:text-7xl">
              Accountability{" "}
              <span className=" bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">
                archive
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/90 md:text-xl">
              A community archive of political statements posted on X/Twitter by Nigerian public
              figures. Search any name, party, or keyword to see what they actually said — with
              timestamps, screenshots, and sources.
            </p>
          </div>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="mt-10 flex flex-col gap-3 rounded-3xl bg-white/95 p-3 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:rounded-full"
          >
            {/* Input */}
            <div className="flex w-full items-center gap-2 px-2 py-1 sm:flex-1 sm:px-2 sm:py-2 ">
              <Search className="h-5 w-5 text-muted-foreground" />

              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search by name, party, or keyword..."
                className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0 placeholder:text-muted-foreground sm:text-lg"
              />
            </div>

            {/* Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-green-700 py-2 px-3 text-base font-semibold hover:bg-green-800 sm:w-auto sm:rounded-full sm:px-3 sm:py-3"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search archive"
              )}
            </Button>
          </form>

          {/* Feature pills */}
          <div className="mt-6 flex flex-wrap gap-3">
            {["Timestamps", "Screenshots", "Sources", "Community verified"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-md"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-2 py-12">
        {/* Recent timeline on home page */}
        {!searched && (
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/70 p-2 lg:p-8 shadow-2xl backdrop-blur-xl">
            {/* subtle gradient glow */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-green-100/40 via-transparent to-emerald-200/30" />

            {/* content */}
            <div className="relative">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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

                    <h2 className="mt-1 text-xl font-semibold text-foreground">
                      Recently added archives
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Browse the latest political statements added by the community.
                    </p>
                  </div>
                </div>

                {/* right CTA */}
                <a
                  href="/upload"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-muted"
                >
                  <Plus className="h-4 w-4" />
                  Add archive
                </a>
              </div>

              {/* divider */}
              <div className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-border to-transparent"></div>

              {/* list */}
              <div className="space-y-4">
                {recentArchives?.map((archive) => (
                  <ArchiveCard archive={archive} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Searching the archive…</p>
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
            <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        )}

        {/* Not found */}
        {searched && !isLoading && !error && (!users || users.length === 0) && (
          <div className="rounded-lg border border-border bg-card p-10 text-center">
            <h2 className="font-display text-xl font-semibold">No results found</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Nothing in the archive matches <strong>"{activeQuery}"</strong>.
            </p>
            <a
              href="/upload"
              className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Be the first to add a record
            </a>
          </div>
        )}

        {/* Results */}
        {!isLoading && users && users.length > 0 && (
          <div className="space-y-10">
            {/* Result count */}
            <p className="text-sm text-muted-foreground">
              Found{" "}
              <strong className="text-foreground">
                {totalArchives} archive{totalArchives !== 1 ? "s" : ""}
              </strong>{" "}
              across{" "}
              <strong className="text-foreground">
                {users.length} {users.length === 1 ? "person" : "people"}
              </strong>{" "}
              matching "{activeQuery}"
            </p>

            {users.map((user) => (
              <div key={user.username} className="space-y-6">
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
                        <span className="font-medium text-foreground/70">Archives archived:</span>{" "}
                        {user.archives.length}
                      </span>
                    </div>
                    {user.notes && (
                      <p className="mt-2 text-sm italic text-muted-foreground">{user.notes}</p>
                    )}
                  </div>
                </div>

                {/* archive list */}
                <div>
                  <h3 className="mb-4 font-display text-lg font-semibold">
                    Archived statements ({user.archives.length})
                  </h3>
                  <div className="space-y-3">
                    {user.archives.map((t) => (
                      <ArchiveCard key={t.id} archive={t} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <a
        href="/upload"
        className="fixed bottom-4 right-4 z-20 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-glow)] transition hover:bg-primary/90 sm:bottom-6 sm:right-6"
      >
        <Plus className="h-4 w-4" />
        Create archive
      </a>
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Trail · A community accountability project
      </footer>
    </div>
  );
}
