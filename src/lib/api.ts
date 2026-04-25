import apiClient from "./apiClient";

export interface ScreenshotInfo {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  publicId: string;
}

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
  screenshot?: ScreenshotInfo; // Kept for backward compatibility
  screenshots?: ScreenshotInfo[]; // New: array of screenshots
  createdAt: string;
  updatedAt: string;
  loveCount: number;
  heartbreakCount: number;
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

// ---- Frontend shape (grouped by user) ------------------------------------

export interface Tweet {
  id: string;
  url: string;
  text: string;
  postedAt?: string;
  screenshot?: string; // Kept for backward compatibility
  screenshots?: string[]; // New: array of screenshot URLs
  createdAt: string;
  loveCount: number;
  heartbreakCount: number;
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

/** Turn a flat backend doc into the frontend Tweet shape. */
function docToTweet(doc: TweetDoc): Tweet {
  // Handle both old (single screenshot) and new (multiple screenshots) formats
  const screenshots = doc.screenshots
    ? doc.screenshots.map((s) => s.url)
    : doc.screenshot
      ? [doc.screenshot.url]
      : [];

  return {
    id: doc._id,
    url: doc.tweetUrl,
    text: doc.tweetText,
    postedAt: doc.postedOn ?? undefined,
    screenshot: doc.screenshot?.url || undefined, // Keep for backward compatibility
    screenshots: screenshots.length > 0 ? screenshots : undefined,
    createdAt: doc.createdAt,
    loveCount: doc.loveCount || 0,
    heartbreakCount: doc.heartbreakCount || 0,
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

const DUMMY_RECENT_ARCHIVES: Tweet[] = [
  {
    id: "recent-1",
    url: "https://twitter.com/example/status/1234567890123456789",
    text: "A new accountability record has been added for the public archive — every voice should be visible.",
    postedAt: "2026-04-19T14:36:00.000Z",
    createdAt: "2026-04-20T08:20:00.000Z",
    loveCount: 12,
    heartbreakCount: 2,
  },
  {
    id: "recent-2",
    url: "https://twitter.com/example/status/9876543210987654321",
    text: "Verified statement archived from a national figure with screenshot and source link.",
    postedAt: "2026-04-18T11:10:00.000Z",
    createdAt: "2026-04-19T21:05:00.000Z",
    loveCount: 8,
    heartbreakCount: 1,
  },
  {
    id: "recent-3",
    url: "https://twitter.com/example/status/1122334455667788990",
    text: "Community members are building the archive together — this timeline shows the latest additions.",
    postedAt: "2026-04-17T08:45:00.000Z",
    createdAt: "2026-04-18T18:55:00.000Z",
    loveCount: 15,
    heartbreakCount: 0,
  },
];

export async function getRecentArchives(): Promise<Tweet[]> {
  try {
    const res = await apiClient.get("/api/recent-archives");
    const docs: TweetDoc[] = res.data;
    return docs.map((doc) => docToTweet(doc));
  } catch (error) {
    // Fallback to dummy data on failure
    console.warn("Failed to fetch recent archives, using dummy data:", error);
    return DUMMY_RECENT_ARCHIVES;
  }
}

// API calls

export async function searchTweets(
  query: string,
  opts: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    search: query,
    page: String(opts.page ?? 1),
    limit: String(opts.limit ?? 100),
    sort: "-createdAt",
  });

  const res = await apiClient.get(`/api/tweets?${params}`);
  return res.data;
}

/**
 * Group an array of docs into multiple UserRecords keyed by displayName.
 */
function groupByUser(docs: TweetDoc[]): UserRecord[] {
  const map = new Map<string, TweetDoc[]>();

  for (const doc of docs) {
    const key = doc.displayName.toLowerCase();
    const arr = map.get(key) ?? [];
    arr.push(doc);
    map.set(key, arr);
  }

  const users: UserRecord[] = [];
  for (const group of map.values()) {
    const record = docsToUserRecord(group);
    if (record) users.push(record);
  }
  return users;
}

/**
 * Fuzzy search — returns all matching users grouped by displayName.
 * Searches across displayName, firstName, lastName, party, notes, tweetText.
 */
export async function searchUsers(query: string): Promise<UserRecord[]> {
  const { data } = await searchTweets(query, { limit: 200 });
  return groupByUser(data);
}

/**
 * Exact lookup by displayName — returns a single UserRecord or null.
 * Used by the upload page to check if a user already exists.
 */
export async function getUser(displayName: string): Promise<UserRecord | null> {
  const { data } = await searchTweets(displayName, { limit: 200 });

  const exact = data.filter((d) => d.displayName.toLowerCase() === displayName.toLowerCase());

  return docsToUserRecord(exact);
}

export async function getTweet(id: string): Promise<TweetDoc> {
  const res = await apiClient.get(`/api/tweets/${id}`);
  return res.data;
}

export async function captureScreenshot(url: string): Promise<{ url: string; publicId: string }> {
  const res = await apiClient.post("/api/screenshots", { url });
  return res.data;
}

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
  screenshots?: File[];
  screenshotUrl?: string;
  screenshotPublicId?: string;
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

  if (payload.screenshots && payload.screenshots.length > 0) {
    payload.screenshots.forEach((file, index) => {
      fd.append(`screenshots`, file);
    });
  } else if (payload.screenshot) {
    fd.append("screenshot", payload.screenshot);
  } else if (payload.screenshotUrl && payload.screenshotPublicId) {
    fd.append("screenshotUrl", payload.screenshotUrl);
    fd.append("screenshotPublicId", payload.screenshotPublicId);
  }

  const res = await apiClient.post("/api/tweets", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

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
    screenshots?: File[];
    removeScreenshot?: boolean;
    removeScreenshots?: boolean;
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
  if (payload.removeScreenshots) fd.append("removeScreenshots", "true");
  if (payload.screenshots && payload.screenshots.length > 0) {
    payload.screenshots.forEach((file) => {
      fd.append(`screenshots`, file);
    });
  } else if (payload.screenshot) {
    fd.append("screenshot", payload.screenshot);
  }

  const res = await apiClient.put(`/api/tweets/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteTweet(id: string): Promise<void> {
  await apiClient.delete(`/api/tweets/${id}`);
}

export async function exportAll(): Promise<TweetDoc[]> {
  const all: TweetDoc[] = [];
  let page = 1;
  let pages = 1;

  do {
    const res = await apiClient.get("/api/tweets", {
      params: { page, limit: 100, sort: "-createdAt" },
    });
    all.push(...res.data.data);
    pages = res.data.meta.pages;
    page++;
  } while (page <= pages);

  return all;
}

export async function voteTweet(
  tweetId: string,
  voteType: "love" | "hate",
): Promise<{ loveCount: number; heartbreakCount: number }> {
  const res = await apiClient.post(`/api/tweets/${tweetId}/vote`, { type: voteType });
  return res.data;
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
