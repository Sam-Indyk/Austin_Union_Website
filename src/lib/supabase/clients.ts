// Supabase clients.
//
//  - publicClient(): anon key, no session. Used by cached public reads; row level
//    security limits it to published, public content.
//  - serviceClient(): service-role key, bypasses RLS. Server-only, used for writes
//    the server has already validated (sign-ups, RSVPs, ballots) and admin actions
//    after an explicit permission check.
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type DB = SupabaseClient<Database>;

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** True when the app is connected to a database (otherwise it serves the seed content). */
export function hasDatabase(): boolean {
  return Boolean(URL && ANON && SERVICE);
}

const opts = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

let pub: DB | undefined;
let svc: DB | undefined;

export function publicClient(): DB {
  if (!URL || !ANON) throw new Error('Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).');
  return (pub ??= createClient<Database>(URL, ANON, opts));
}

export function serviceClient(): DB {
  if (!URL || !SERVICE) throw new Error('Supabase is not configured (SUPABASE_SERVICE_ROLE_KEY).');
  return (svc ??= createClient<Database>(URL, SERVICE, opts));
}

/** Throws with a readable message when a Supabase call fails. */
export function check<T>(res: { data: T; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}
