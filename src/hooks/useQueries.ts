import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchTweets,
  searchUsers,
  getUser,
  getTweet,
  createTweet,
  updateTweet,
  deleteTweet,
  exportAll,
  captureScreenshot,
  getRecentArchives,
  voteTweet,
  type TweetDoc,
  type UserRecord,
  Tweet,
} from "../lib/api";

// Query keys
export const queryKeys = {
  tweets: {
    all: ["tweets"] as const,
    search: (query: string, page?: number, limit?: number) =>
      ["tweets", "search", query, page, limit] as const,
    detail: (id: string) => ["tweets", "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    search: (query: string) => ["users", "search", query] as const,
    detail: (displayName: string) => ["users", "detail", displayName] as const,
  },
  export: {
    all: ["export", "all"] as const,
  },
};

// ---- Search Users (fuzzy, multi-result — for index page) ----
export function useSearchUsers(query: string, options?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.users.search(query),
    queryFn: () => searchUsers(query),
    enabled: query.length > 0,
    staleTime: 0, // always refetch when query is re-triggered
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

// ---- Search Tweets Query ----
export function useSearchTweets(
  query: string,
  page = 1,
  limit = 100,
  options?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: queryKeys.tweets.search(query, page, limit),
    queryFn: () => searchTweets(query, { page, limit }),
    enabled: query.length > 0,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

// ---- Get User (exact match — for upload page check) ----
export function useGetUser(displayName: string, options?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.users.detail(displayName),
    queryFn: () => getUser(displayName),
    enabled: displayName.length > 0,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

// ---- Get Tweet Detail ----
export function useGetTweet(id: string, options?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.tweets.detail(id),
    queryFn: () => getTweet(id),
    enabled: id.length > 0,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    ...options,
  });
}

// ---- Recent archive timeline (real API now) ----
export function useRecentArchives(options?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["recent-archives"] as const,
    queryFn: getRecentArchives,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    ...options,
  });
}

// ---- Vote on Tweet Mutation ----
export function useVoteTweet(options?: Record<string, unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tweetId, voteType }: { tweetId: string; voteType: "love" | "hate" }) =>
      voteTweet(tweetId, voteType),
    onSuccess: (data, variables) => {
      // Update the cache for recent archives
      queryClient.setQueryData(["recent-archives"], (oldData: unknown) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.map((tweet: Tweet) =>
          tweet.id === variables.tweetId
            ? { ...tweet, loveCount: data.loveCount, heartbreakCount: data.heartbreakCount }
            : tweet,
        );
      });
      // Also invalidate search results if needed
      queryClient.invalidateQueries({ queryKey: queryKeys.tweets.all });
    },
    ...options,
  });
}

// ---- Create Tweet Mutation ----
export function useCreateTweet(options?: Record<string, unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTweet,
    onSuccess: (...args: unknown[]) => {
      // Nuke all cached search/user data so next search is fresh
      queryClient.invalidateQueries({ queryKey: queryKeys.tweets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      // Also remove stale cache entries entirely for searches
      queryClient.removeQueries({ queryKey: queryKeys.users.search("") });

      // Call user-provided onSuccess if any
      if (options?.onSuccess && typeof options.onSuccess === "function") {
        (options.onSuccess as (...a: unknown[]) => void)(...args);
      }
    },
    ...options,
    // Don't spread onSuccess from options — we handle it above
  });
}

// ---- Update Tweet Mutation ----
export function useUpdateTweet(options?: Record<string, unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateTweet>[1] }) =>
      updateTweet(id, payload),
    onSuccess: (data: TweetDoc) => {
      queryClient.setQueryData(queryKeys.tweets.detail(data._id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.tweets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    ...options,
  });
}

// ---- Delete Tweet Mutation ----
export function useDeleteTweet(options?: Record<string, unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTweet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tweets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    ...options,
  });
}

// ---- Capture Screenshot Mutation ----
export function useCaptureScreenshot(options?: Record<string, unknown>) {
  return useMutation({
    mutationFn: captureScreenshot,
    ...options,
  });
}

// ---- Export All ----
export function useExportAll(options?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.export.all,
    queryFn: exportAll,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    ...options,
  });
}

// ---- Utilities ----
export function useCachedUser(displayName: string) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<UserRecord>(queryKeys.users.detail(displayName));
}

export function useCachedTweet(id: string) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<TweetDoc>(queryKeys.tweets.detail(id));
}
