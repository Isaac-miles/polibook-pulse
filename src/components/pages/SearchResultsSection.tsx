import { UserRecord } from "@/lib/api";
import { UserProfileCard } from "./UserProfileCard";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface SearchResultsSectionProps {
  isLoading: boolean;
  error: Error | null;
  users?: UserRecord[];
  activeQuery: string;
  onRetry: () => void;
}

export function SearchResultsSection({
  isLoading,
  error,
  users,
  activeQuery,
  onRetry,
}: SearchResultsSectionProps) {
  const totalArchives = users?.reduce((sum, u) => sum + (u.archives?.length ?? 0), 0) ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-xl border border-border bg-card p-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Searching the archive…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <h2 className="font-display text-lg font-semibold text-destructive">
          Something went wrong
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Search failed"}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
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
    );
  }

  return (
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

      {/* Results */}
      {users.map((user) => (
        <UserProfileCard key={user.username} user={user} />
      ))}
    </div>
  );
}
