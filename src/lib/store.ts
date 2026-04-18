import seed from "@/data/users.json";

export type Tweet = {
  id: string;
  url: string;
  text: string;
  postedAt?: string;
  submittedAt: string;
};

export type UserRecord = {
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  party?: string;
  notes?: string;
  tweets: Tweet[];
};

type DB = { users: UserRecord[] };

const STORAGE_KEY = "trail-db-v1";

function loadDB(): DB {
  if (typeof window === "undefined") return seed as DB;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    // ignore
  }
  return JSON.parse(JSON.stringify(seed)) as DB;
}

function saveDB(db: DB) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function normalize(u: string) {
  return u.trim().replace(/^@/, "").toLowerCase();
}

export function getUser(username: string): UserRecord | null {
  const db = loadDB();
  const key = normalize(username);
  return db.users.find((u) => u.username.toLowerCase() === key) ?? null;
}

export function listUsers(): UserRecord[] {
  return loadDB().users;
}

export function upsertUser(input: {
  username: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  party?: string;
  notes?: string;
}): UserRecord {
  const db = loadDB();
  const key = normalize(input.username);
  let user = db.users.find((u) => u.username.toLowerCase() === key);
  if (!user) {
    user = {
      username: key,
      displayName: input.displayName,
      firstName: input.firstName,
      lastName: input.lastName,
      party: input.party,
      notes: input.notes,
      tweets: [],
    };
    db.users.push(user);
  } else {
    user.displayName = input.displayName || user.displayName;
    if (input.firstName !== undefined) user.firstName = input.firstName;
    if (input.lastName !== undefined) user.lastName = input.lastName;
    if (input.party !== undefined) user.party = input.party;
    if (input.notes !== undefined) user.notes = input.notes;
  }
  saveDB(db);
  return user;
}

export function addTweet(
  username: string,
  tweet: { url: string; text: string; postedAt?: string }
): UserRecord | null {
  const db = loadDB();
  const key = normalize(username);
  const user = db.users.find((u) => u.username.toLowerCase() === key);
  if (!user) return null;
  user.tweets.unshift({
    id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    url: tweet.url,
    text: tweet.text,
    postedAt: tweet.postedAt,
    submittedAt: new Date().toISOString(),
  });
  saveDB(db);
  return user;
}

export function exportDB(): string {
  return JSON.stringify(loadDB(), null, 2);
}

export function resetDB() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
