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

interface PaginatedResponse {
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

// ---- Helpers --------------------------------------------------------------

/** Turn a flat backend doc into the frontend Tweet shape. */
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
 * Returns the raw paginated response from the backend.
 */
export async function searchTweets(
  query: string,
  opts: { page?: number; limit?: number } = {}
): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    search: query,
    page: String(opts.page ?? 1),
    limit: String(opts.limit ?? 100),
    sort: "-createdAt",
  });

  const res = await fetch(`${API_BASE}/api/tweets?${params}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Search failed (${res.status})`);
  }
  return res.json();
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

  const exact = data.filter(
    (d) => d.displayName.toLowerCase() === displayName.toLowerCase()
  );

  return docsToUserRecord(exact);
}

/**
 * Fetch a single tweet doc by ID.
 */
export async function getTweet(id: string): Promise<TweetDoc> {
  const res = await fetch(`${API_BASE}/api/tweets/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Not found (${res.status})`);
  }
  return res.json();
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

  const res = await fetch(`${API_BASE}/api/tweets`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Create failed (${res.status})`);
  }
  return res.json();
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
  }
): Promise<TweetDoc> {
  const fd = new FormData();
  if (payload.displayName !== undefined) fd.append("displayName", payload.displayName);
  if (payload.firstName !== undefined) fd.append("firstName", payload.firstName);
  if (payload.lastName !== undefined) fd.append("lastName", payload.lastName);
  if (payload.partyAffiliation !== undefined) fd.append("partyAffiliation", payload.partyAffiliation);
  if (payload.notes !== undefined) fd.append("notes", payload.notes);
  if (payload.tweetUrl !== undefined) fd.append("tweetUrl", payload.tweetUrl);
  if (payload.tweetText !== undefined) fd.append("tweetText", payload.tweetText);
  if (payload.postedOn !== undefined) fd.append("postedOn", payload.postedOn);
  if (payload.removeScreenshot) fd.append("removeScreenshot", "true");
  if (payload.screenshot) fd.append("screenshot", payload.screenshot);

  const res = await fetch(`${API_BASE}/api/tweets/${id}`, {
    method: "PUT",
    body: fd,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Update failed (${res.status})`);
  }
  return res.json();
}

/**
 * Delete a tweet record by ID.
 */
export async function deleteTweet(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/tweets/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `Delete failed (${res.status})`);
  }
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