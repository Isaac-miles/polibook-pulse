import { UserRecord } from "@/lib/api";
import { ArchiveCard } from "@/components/ArchiveCard";
import { UserCircle2 } from "lucide-react";

interface UserProfileCardProps {
  user: UserRecord;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  return (
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
                <span className="font-medium text-foreground/70">Affiliation:</span> {user.party}
              </span>
            )}
            <span>
              <span className="font-medium text-foreground/70">Archives:</span>{" "}
              {user.archives.length}
            </span>
          </div>
          {user.notes && <p className="mt-2 text-sm italic text-muted-foreground">{user.notes}</p>}
        </div>
      </div>

      {/* archive list */}
      <div>
        <h3 className="mb-4 font-display text-lg font-semibold">
          Archived statements ({user.archives.length})
        </h3>
        <div className="space-y-3">
          {user.archives.map((archive) => (
            <ArchiveCard key={archive.id} archive={archive} />
          ))}
        </div>
      </div>
    </div>
  );
}
