import apiClient from "./apiClient";

export interface ScreenshotInfo {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  publicId: string;
}

export interface ArchiveDoc {
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
  data: ArchiveDoc[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// ---- Frontend shape (grouped by user) ------------------------------------

export interface Archive {
  id: string;
  url: string;
  text: string;
  postedAt?: string;
  screenshot?: string; // Kept for backward compatibility
  screenshots?: string[]; // New: array of screenshot URLs
  createdAt: string;
  loveCount: number;
  heartbreakCount: number;
  displayName?: string;
  username?: string;
}

export interface UserRecord {
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  party?: string;
  notes?: string;
  archives: Archive[];
}

/** Turn a flat backend doc into the frontend Archive shape. */
function docToArchive(doc: ArchiveDoc): Archive {
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
    displayName: doc.displayName || undefined,
    username: doc.displayName ? doc.displayName.replace(/\s+/g, "_").toLowerCase() : undefined,
  };
}

/**
 * Group an array of flat tweet docs (all for the same displayName) into a
 * single UserRecord.  If the array is empty, returns null.
 */
function docsToUserRecord(docs: ArchiveDoc[]): UserRecord | null {
  if (docs.length === 0) return null;

  const first = docs[0];
  return {
    username: first.displayName.replace(/\s+/g, "_").toLowerCase(),
    displayName: first.displayName,
    firstName: first.firstName || undefined,
    lastName: first.lastName || undefined,
    party: first.partyAffiliation || undefined,
    notes: first.notes || undefined,
    archives: docs.map(docToArchive),
  };
}



export async function getRecentArchives(): Promise<Archive[]> {
  try {
    const res = await apiClient.get("/api/archives/recent");
    const docs: ArchiveDoc[] = res.data;
    if (!docs || !Array.isArray(docs) || docs.length === 0) return [];
    return docs.map((doc) => docToArchive(doc));
  } catch (error) {
    // If the API fails, return a safe empty array instead of dummy content.
    console.warn("Failed to fetch recent archives, returning empty array:", error);
    return [];
  }
}

// API calls

export async function searchArchives(
  query: string,
  opts: { page?: number; limit?: number } = {},
): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    search: query,
    page: String(opts.page ?? 1),
    limit: String(opts.limit ?? 100),
    sort: "-createdAt",
  });

  const res = await apiClient.get(`/api/archives?${params}`);
  return res.data;
}

/**
 * Group an array of docs into multiple UserRecords keyed by displayName.
 */
function groupByUser(docs: ArchiveDoc[]): UserRecord[] {
  const map = new Map<string, ArchiveDoc[]>();

  for (const doc of docs) {
    const key = doc.displayName.toLowerCase();
    const arr = map.get(key) ?? [];
    arr.push(doc);
    map.set(key, arr);
  }

  const users: UserRecord[] = [];
  for (const group of map.values()) {
    const record = docsToUserRecord(group as ArchiveDoc[]);
    if (record) users.push(record);
  }
  return users;
}

/**
 * Fuzzy search — returns all matching users grouped by displayName.
 * Searches across displayName, firstName, lastName, party, notes, tweetText.
 */
export async function searchUsers(query: string): Promise<UserRecord[]> {
  const { data } = await searchArchives(query, { limit: 200 });
  return groupByUser(data);
}

/**
 * Exact lookup by displayName — returns a single UserRecord or null.
 * Used by the upload page to check if a user already exists.
 */
export async function getUser(displayName: string): Promise<UserRecord | null> {
  const { data } = await searchArchives(displayName, { limit: 200 });

  const exact = data.filter((d) => d.displayName.toLowerCase() === displayName.toLowerCase());

  return docsToUserRecord(exact);
}

export async function getArchive(id: string): Promise<ArchiveDoc> {
  const res = await apiClient.get(`/api/archives/${id}`);
  return res.data;
}

export async function captureScreenshot(url: string): Promise<{ url: string; publicId: string }> {
  const res = await apiClient.post("/api/screenshots", { url });
  return res.data;
}

export async function createArchive(payload: {
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
}): Promise<ArchiveDoc> {
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

  const res = await apiClient.post("/api/archives", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function updateArchive(
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
): Promise<ArchiveDoc> {
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

  const res = await apiClient.put(`/api/archives/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteArchive(id: string): Promise<void> {
  await apiClient.delete(`/api/archives/${id}`);
}

export async function exportAll(): Promise<ArchiveDoc[]> {
  const all: ArchiveDoc[] = [];
  let page = 1;
  let pages = 1;

  do {
    const res = await apiClient.get("/api/archives", {
      params: { page, limit: 100, sort: "-createdAt" },
    });
    all.push(...res.data.data);
    pages = res.data.meta.pages;
    page++;
  } while (page <= pages);

  return all;
}

export async function voteArchive(
  archiveId: string,
  voteType: "love" | "hate",
): Promise<{ loveCount: number; heartbreakCount: number }> {
  const res = await apiClient.post(`/api/archives/${archiveId}/vote`, { type: voteType });
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
