import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  searchArchives,
  searchUsers,
  getUser,
  getArchive,
  createArchive,
  updateArchive,
  deleteArchive,
  getComments,
  createComment,
  deleteComment,
  exportAll,
  captureScreenshot,
  getRecentArchives,
  voteArchive,
  type ArchiveDoc,
  type UserRecord,
  Archive,
} from "../lib/api";

// Query keys
export const queryKeys = {
  archives: {
    all: ["archives"] as const,
    search: (query: string, page?: number, limit?: number) =>
      ["archives", "search", query, page, limit] as const,
    detail: (id: string) => ["archives", "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    search: (query: string) => ["users", "search", query] as const,
    detail: (displayName: string) => ["users", "detail", displayName] as const,
  },
   comments: {
    byTweet: (tweetId: string) => ["comments", tweetId] as const,
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
// ---- Search Archives Query ----
export function useSearchArchives(
  query: string,
  page = 1,
  limit = 100,
  options?: Record<string, unknown>,
) {
  return useQuery({
    queryKey: queryKeys.archives.search(query, page, limit),
    queryFn: () => searchArchives(query, { page, limit }),
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
export function useGetArchive(id: string, options?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.archives.detail(id),
    queryFn: () => getArchive(id),
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
export function useVoteArchive(options?: Record<string, unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ archiveId, voteType }: { archiveId: string; voteType: "love" | "heartbreak" }) =>
      voteArchive(archiveId, voteType),
    onSuccess: (data, variables) => {
      // Update the cache for recent archives
      queryClient.setQueryData(["recent-archives"], (oldData: unknown) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.map((archive: Archive) =>
          archive.id === (variables as any).archiveId
            ? { ...archive, loveCount: data.loveCount, heartbreakCount: data.heartbreakCount }
            : archive,
        );
      });
      // Also invalidate search results if needed
      queryClient.invalidateQueries({ queryKey: queryKeys.archives.all });
    },
    ...options,
  });
}

// ---- Create Tweet Mutation ----
export function useCreateArchive(options?: Record<string, unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createArchive,
    onSuccess: (...args: unknown[]) => {
      // Nuke all cached search/user data so next search is fresh
      queryClient.invalidateQueries({ queryKey: queryKeys.archives.all });
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

// ---- Update Archive Mutation ----
export function useUpdateArchive(options?: Record<string, unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateArchive>[1] }) =>
      updateArchive(id, payload),
    onSuccess: (data: ArchiveDoc) => {
      queryClient.setQueryData(queryKeys.archives.detail(data._id), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.archives.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    ...options,
  });
}

// ---- Delete Archive Mutation ----
export function useDeleteArchive(options?: Record<string, unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteArchive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.archives.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    ...options,
  });
}

// get comment mutation
export function useComments(tweetId: string, options?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.comments.byTweet(tweetId),
    queryFn: () => getComments(tweetId),
    enabled: tweetId.length > 0,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useCreateComment(options?: Record<string, unknown>) {
  const queryClient = useQueryClient();
  const mutationOptions = (options ?? {}) as {
    onSuccess?: (...args: unknown[]) => void;
    [key: string]: unknown;
  };
  const { onSuccess: userOnSuccess, ...restOptions } = mutationOptions;

  return useMutation({
    mutationFn: ({ tweetId, payload }: { tweetId: string; payload: { author: string; text: string } }) =>
      createComment(tweetId, payload),
    onSuccess: (...args) => {
      const [, variables] = args as [unknown, { tweetId: string }];
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byTweet(variables.tweetId),
      });

      if (typeof userOnSuccess === "function") {
        userOnSuccess(...args);
      }
    },
    ...restOptions,
  });
}

export function useDeleteComment(options?: Record<string, unknown>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tweetId, commentId }: { tweetId: string; commentId: string }) =>
      deleteComment(tweetId, commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.comments.byTweet(variables.tweetId),
      });
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

export function useCachedArchive(id: string) {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<ArchiveDoc>(queryKeys.archives.detail(id));
}
