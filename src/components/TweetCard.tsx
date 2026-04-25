import { ArchiveCard } from "./ArchiveCard";
import type { Archive } from "@/lib/api";

// Compatibility wrapper: keep `TweetCard` API but delegate to `ArchiveCard`.
export function TweetCard({ tweet }: { tweet: Archive }) {
  return <ArchiveCard archive={tweet} />;
}
