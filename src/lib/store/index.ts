// Write-side storage for things visitors submit: mailing-list sign-ups,
// messages, and RSVPs.
//
// Until Supabase is connected this uses a JSON file in .data/ (development
// only). The Supabase implementation will satisfy the same interface.
import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type ContactSource = 'mailing_list' | 'rsvp' | 'message' | 'wix_import' | 'admin';

export interface ContactInput {
  email: string;
  firstName?: string;
  lastName?: string;
  source: ContactSource;
  /** Whether this submission opts the person into announcement emails. */
  subscribe: boolean;
}

export interface MessageInput {
  name: string;
  email: string;
  body: string;
  page: string;
}

export interface RsvpInput {
  eventId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Store {
  /** Adds or refreshes a contact; never re-subscribes someone who unsubscribed. */
  upsertContact(input: ContactInput): Promise<{ created: boolean }>;
  addMessage(input: MessageInput): Promise<void>;
  /** Returns duplicate=true if this email already RSVP'd to the event. */
  addRsvp(input: RsvpInput): Promise<{ duplicate: boolean; count: number }>;
}

// ---------------------------------------------------------------------------
// Development JSON store
// ---------------------------------------------------------------------------
interface DevDb {
  contacts: (Omit<ContactInput, 'subscribe'> & { subscribed: boolean; createdAt: string })[];
  messages: (MessageInput & { createdAt: string })[];
  rsvps: (RsvpInput & { createdAt: string; checkedInAt?: string })[];
}

const FILE = path.join(process.cwd(), '.data', 'dev-db.json');
let queue: Promise<unknown> = Promise.resolve();

async function load(): Promise<DevDb> {
  try {
    return JSON.parse(await fs.readFile(FILE, 'utf8')) as DevDb;
  } catch {
    return { contacts: [], messages: [], rsvps: [] };
  }
}

/** Serialises read-modify-write cycles so concurrent submissions don't clobber each other. */
function mutate<T>(fn: (db: DevDb) => T): Promise<T> {
  const run = queue.then(async () => {
    const db = await load();
    const result = fn(db);
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(db, null, 2));
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

const now = () => new Date().toISOString();

const devStore: Store = {
  upsertContact(input) {
    return mutate((db) => {
      const email = input.email.toLowerCase();
      const existing = db.contacts.find((c) => c.email === email);
      if (existing) {
        existing.firstName ||= input.firstName;
        existing.lastName ||= input.lastName;
        // Opting in again re-subscribes, unless they explicitly unsubscribed (tracked once emails exist).
        if (input.subscribe) existing.subscribed = true;
        return { created: false };
      }
      const { subscribe, ...rest } = input;
      db.contacts.push({ ...rest, email, subscribed: subscribe, createdAt: now() });
      return { created: true };
    });
  },
  addMessage(input) {
    return mutate((db) => {
      db.messages.push({ ...input, createdAt: now() });
    });
  },
  addRsvp(input) {
    return mutate((db) => {
      const email = input.email.toLowerCase();
      const duplicate = db.rsvps.some((r) => r.eventId === input.eventId && r.email === email);
      if (!duplicate) db.rsvps.push({ ...input, email, createdAt: now() });
      return { duplicate, count: db.rsvps.filter((r) => r.eventId === input.eventId).length };
    });
  },
};

export function getStore(): Store {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEV_STORE) {
    throw new Error('No database configured. Connect Supabase before deploying.');
  }
  return devStore;
}
