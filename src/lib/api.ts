import { apiClient } from "./apiClient";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export interface TweetDoc {
  _id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  partyAffiliation: string;
  notes: string;
  tweetUrl: string;
  tweetText: string;
  postedOn: string | null;
  screenshot: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    publicId: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse {
  data: TweetDoc[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface Tweet {
  id: string;
  url: string;
  text: string;
  postedAt?: string;
  screenshot?: string;
  createdAt: string;
}

export interface UserRecord {
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  party?: string;
  notes?: string;
  tweets: Tweet[];
}

function docToTweet(doc: TweetDoc): Tweet {
  return {
    id: doc._id,
    url: doc.tweetUrl,
    text: doc.tweetText,
    postedAt: doc.postedOn ?? undefined,
    screenshot: doc.screenshot?.url || undefined,
    createdAt: doc.createdAt,
  };
}

/**
 * Group an array of flat tweet docs (all for the same displayName) into a
 * single UserRecord.  If the array is empty, returns null.
 */
function docsToUserRecord(docs: TweetDoc[]): UserRecord | null {
  if (docs.length === 0) return null;

  const first = docs[0];
  return {
    username: first.displayName.replace(/\s+/g, "_").toLowerCase(),
    displayName: first.displayName,
    firstName: first.firstName || undefined,
    lastName: first.lastName || undefined,
    party: first.partyAffiliation || undefined,
    notes: first.notes || undefined,
    tweets: docs.map(docToTweet),
  };
}

// ---- API calls ------------------------------------------------------------

/**
 * Search tweets by a query string (matches displayName, names, party, text).
 * Returns ALL matching results (paginates under the hood up to 200).
 */
export async function searchTweets(
  query: string,
  opts: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse> {
  const params = {
    search: query,
    page: opts.page ?? 1,
    limit: opts.limit ?? 100,
    sort: "-createdAt",
  };

  const response = await apiClient.get<PaginatedResponse>("/api/tweets", {
    params,
  });

  return response.data;
}

/**
 * Look up a user by displayName and return a grouped UserRecord.
 * Returns null if nothing is found.
 */
export async function getUser(displayName: string): Promise<UserRecord | null> {
  const { data } = await searchTweets(displayName, { limit: 200 });

  // Filter to exact displayName match (search is fuzzy)
  const exact = data.filter((d) => d.displayName.toLowerCase() === displayName.toLowerCase());

  return docsToUserRecord(exact);
}

/**
 * Fetch a single tweet doc by ID.
 */
export async function getTweet(id: string): Promise<TweetDoc> {
  const response = await apiClient.get<TweetDoc>(`/api/tweets/${id}`);
  return response.data;
}

/**
 * Create a new tweet record.
 * Accepts a File object for the screenshot (uploaded via FormData / Cloudinary).
 */
export async function createTweet(payload: {
  displayName: string;
  firstName?: string;
  lastName?: string;
  partyAffiliation?: string;
  notes?: string;
  tweetUrl?: string;
  tweetText: string;
  postedOn?: string;
  screenshot?: File;
}): Promise<TweetDoc> {
  const fd = new FormData();
  fd.append("displayName", payload.displayName);
  fd.append("firstName", payload.firstName ?? "");
  fd.append("lastName", payload.lastName ?? "");
  fd.append("partyAffiliation", payload.partyAffiliation ?? "");
  fd.append("notes", payload.notes ?? "");
  fd.append("tweetUrl", payload.tweetUrl ?? "");
  fd.append("tweetText", payload.tweetText);
  fd.append("postedOn", payload.postedOn ?? "");

  if (payload.screenshot) {
    fd.append("screenshot", payload.screenshot);
  }

  const response = await apiClient.post<TweetDoc>("/api/tweets", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

/**
 * Update an existing tweet record by ID.
 */
export async function updateTweet(
  id: string,
  payload: {
    displayName?: string;
    firstName?: string;
    lastName?: string;
    partyAffiliation?: string;
    notes?: string;
    tweetUrl?: string;
    tweetText?: string;
    postedOn?: string;
    screenshot?: File;
    removeScreenshot?: boolean;
  },
): Promise<TweetDoc> {
  const fd = new FormData();
  if (payload.displayName !== undefined) fd.append("displayName", payload.displayName);
  if (payload.firstName !== undefined) fd.append("firstName", payload.firstName);
  if (payload.lastName !== undefined) fd.append("lastName", payload.lastName);
  if (payload.partyAffiliation !== undefined)
    fd.append("partyAffiliation", payload.partyAffiliation);
  if (payload.notes !== undefined) fd.append("notes", payload.notes);
  if (payload.tweetUrl !== undefined) fd.append("tweetUrl", payload.tweetUrl);
  if (payload.tweetText !== undefined) fd.append("tweetText", payload.tweetText);
  if (payload.postedOn !== undefined) fd.append("postedOn", payload.postedOn);
  if (payload.removeScreenshot) fd.append("removeScreenshot", "true");
  if (payload.screenshot) fd.append("screenshot", payload.screenshot);

  const response = await apiClient.put<TweetDoc>(`/api/tweets/${id}`, fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

/**
 * Delete a tweet record by ID.
 */
export async function deleteTweet(id: string): Promise<void> {
  await apiClient.delete(`/api/tweets/${id}`);
}

/**
 * Export all tweets as a JSON blob (for download).
 * Paginates internally to pull everything.
 */
export async function exportAll(): Promise<TweetDoc[]> {
  const all: TweetDoc[] = [];
  let page = 1;
  let pages = 1;

  do {
    const res = await searchTweets("", { page, limit: 100 });
    all.push(...res.data);
    pages = res.meta.pages;
    page++;
  } while (page <= pages);

  return all;
}

/**
 * Download the full DB export as a JSON file.
 */
export function downloadJSON(data: unknown, filename = "trail-export.json") {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
