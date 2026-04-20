import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchTweets,
  getUser,
  getTweet,
  createTweet,
  updateTweet,
  deleteTweet,
  exportAll,
  type TweetDoc,
  type UserRecord,
  type PaginatedResponse,
} from "../lib/api";

// Query keys for organization
export const queryKeys = {
  tweets: {
    all: ["tweets"] as const,
    search: (query: string, page?: number, limit?: number) =>
      ["tweets", "search", query, page, limit] as const,
    detail: (id: string) => ["tweets", "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    detail: (displayName: string) => ["users", "detail", displayName] as const,
  },
  export: {
    all: ["export", "all"] as const,
  },
};

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    ...options,
  });
}

// ---- Get User Query ----
export function useGetUser(displayName: string, options?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.users.detail(displayName),
    queryFn: () => getUser(displayName),
    enabled: displayName.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
}

// ---- Get Tweet Detail Query ----
export function useGetTweet(id: string, options?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.tweets.detail(id),
    queryFn: () => getTweet(id),
    enabled: id.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
}

// ---- Create Tweet Mutation ----
export function useCreateTweet(options?: Record<string, unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTweet,
    onSuccess: () => {
      // Invalidate search results and user data
      queryClient.invalidateQueries({ queryKey: queryKeys.tweets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    ...options,
  });
}

// ---- Update Tweet Mutation ----
export function useUpdateTweet(options?: Record<string, unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateTweet>[1] }) =>
      updateTweet(id, payload),
    onSuccess: (data: TweetDoc) => {
      // Update the specific tweet detail cache
      queryClient.setQueryData(queryKeys.tweets.detail(data._id), data);
      // Invalidate related queries
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
      // Invalidate all tweet and user queries
      queryClient.invalidateQueries({ queryKey: queryKeys.tweets.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    ...options,
  });
}

// ---- Export All Query ----
export function useExportAll(options?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.export.all,
    queryFn: exportAll,
    staleTime: Infinity, // Don't refetch automatically
    gcTime: 60 * 60 * 1000, // 1 hour
    ...options,
  });
}

// ---- Utility: Get cached user data ----
export function useCachedUser(displayName: string) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<UserRecord>(queryKeys.users.detail(displayName));
}

// ---- Utility: Get cached tweet data ----
export function useCachedTweet(id: string) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<TweetDoc>(queryKeys.tweets.detail(id));
}
