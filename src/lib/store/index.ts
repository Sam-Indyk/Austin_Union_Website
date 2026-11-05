// Write-side storage for things visitors submit: mailing-list sign-ups,
// messages, and RSVPs.
//
// Writes go to Supabase when it is configured; otherwise (development only) to a
// JSON file in .data/.
import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { check, hasDatabase, serviceClient } from '@/lib/supabase/clients';

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
  /** Guests beyond this many "going" RSVPs are waitlisted. */
  capacity?: number;
}

export interface RsvpResult {
  duplicate: boolean;
  count: number;
  status: 'going' | 'waitlist';
  /** Secret link token that lets the guest cancel. */
  manageToken?: string;
}

export interface Store {
  /** Adds or refreshes a contact; never re-subscribes someone who unsubscribed. */
  upsertContact(input: ContactInput): Promise<{ created: boolean }>;
  addMessage(input: MessageInput): Promise<void>;
  /** Returns duplicate=true if this email already RSVP'd to the event. */
  addRsvp(input: RsvpInput): Promise<RsvpResult>;
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
      return { duplicate, count: db.rsvps.filter((r) => r.eventId === input.eventId).length, status: 'going' as const };
    });
  },
};

// ---------------------------------------------------------------------------
// Supabase store
// ---------------------------------------------------------------------------
const supabaseStore: Store = {
  async upsertContact(input) {
    const optIn = !input.subscribe ? 'none' : input.source === 'mailing_list' ? 'explicit' : 'implicit';
    const rows = check(
      await serviceClient().rpc('upsert_contact', {
        p_email: input.email,
        p_first: input.firstName ?? '',
        p_last: input.lastName ?? '',
        p_source: input.source,
        p_opt_in: optIn,
      }),
      'upsert_contact',
    ) as { person_id: string; created: boolean }[];
    return { created: rows[0]?.created ?? false };
  },

  async addMessage(input) {
    const db = serviceClient();
    const person = check(await db.from('people').select('id').eq('email', input.email.toLowerCase()).maybeSingle(), 'people');
    check(await db.from('messages').insert({ ...input, email: input.email.toLowerCase(), person_id: person?.id ?? null }), 'messages.insert');
  },

  async addRsvp(input) {
    const db = serviceClient();
    const email = input.email.toLowerCase();
    const owner = check(await db.from('person_emails').select('person_id').eq('email', email).maybeSingle(), 'person_emails');
    const going = async () =>
      (await db.from('rsvps').select('id', { count: 'exact', head: true }).eq('event_id', input.eventId).eq('status', 'going')).count ?? 0;
    const status = input.capacity && (await going()) >= input.capacity ? 'waitlist' : 'going';

    const existing = check(
      await db.from('rsvps').select('id, status, manage_token').eq('event_id', input.eventId).eq('email', email).maybeSingle(),
      'rsvps',
    );
    if (existing && existing.status !== 'cancelled') {
      return { duplicate: true, count: await going(), status: existing.status as RsvpResult['status'], manageToken: existing.manage_token };
    }
    // A previously cancelled RSVP is revived rather than duplicated.
    const res = existing
      ? await db.from('rsvps').update({ status, first_name: input.firstName, last_name: input.lastName }).eq('id', existing.id).select('manage_token').single()
      : await db
          .from('rsvps')
          .insert({ event_id: input.eventId, first_name: input.firstName, last_name: input.lastName, email, person_id: owner?.person_id ?? null, status })
          .select('manage_token')
          .single();
    if (res.error?.code === '23505') return { duplicate: true, count: await going(), status: 'going' };
    if (res.error) throw new Error(`rsvps.insert: ${res.error.message}`);
    return { duplicate: false, count: await going(), status, manageToken: res.data.manage_token };
  },
};

export function getStore(): Store {
  if (hasDatabase()) return supabaseStore;
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEV_STORE) {
    throw new Error('No database configured. Connect Supabase before deploying.');
  }
  return devStore;
}
