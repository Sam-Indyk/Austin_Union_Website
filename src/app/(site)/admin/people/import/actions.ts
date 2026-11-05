'use server';

import { revalidatePath } from 'next/cache';
import { assertStaff } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';

export interface ImportRow {
  email: string;
  firstName: string;
  lastName: string;
  /** Other addresses from the export (Wix "Email 2", …): added so the person can sign in with them too. */
  otherEmails: string[];
  status: 'subscribed' | 'unsubscribed' | 'unset';
  labels: string;
}

export interface ImportResult {
  ok: boolean;
  error?: string;
  total?: number;
  created?: number;
  updated?: number;
  skipped?: number;
  subscribed?: number;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clean = (s: unknown, max: number) => String(s ?? '').trim().slice(0, max);

/**
 * Import contacts exported from Wix. Re-running the same file is safe: people
 * are matched by email, names are only filled in where missing, and anyone
 * who unsubscribed (here or on Wix) stays unsubscribed.
 */
export async function importContacts(filename: string, rows: ImportRow[], addUnset: boolean): Promise<ImportResult> {
  const viewer = await assertStaff('admin');
  if (!Array.isArray(rows) || rows.length === 0) return { ok: false, error: 'No contacts to import.' };
  if (rows.length > 10000) return { ok: false, error: 'That file is too large (10,000 contacts at most).' };
  const db = serviceClient();

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let subscribed = 0;
  const seen = new Set<string>();

  const work = rows.filter((r) => {
    const email = clean(r?.email, 254).toLowerCase();
    if (!EMAIL.test(email) || seen.has(email)) {
      skipped++;
      return false;
    }
    seen.add(email);
    return true;
  });

  const one = async (r: ImportRow) => {
    const email = clean(r.email, 254).toLowerCase();
    const status = r.status === 'subscribed' || r.status === 'unsubscribed' ? r.status : 'unset';
    // 'implicit' never re-subscribes someone who unsubscribed before.
    const optIn = status === 'subscribed' || (status === 'unset' && addUnset) ? 'implicit' : 'none';
    const res = await db.rpc('upsert_contact', {
      p_email: email,
      p_first: clean(r.firstName, 80),
      p_last: clean(r.lastName, 80),
      p_source: 'wix_import',
      p_opt_in: optIn,
    });
    if (res.error || !res.data?.[0]) {
      skipped++;
      return;
    }
    const { person_id: personId, created: isNew } = res.data[0];
    if (isNew) created++;
    else updated++;

    if (status === 'unsubscribed') {
      await db.from('people').update({ subscribed: false, unsubscribed_at: new Date().toISOString() }).eq('id', personId).is('unsubscribed_at', null);
    }
    const labels = clean(r.labels, 300);
    if (isNew && labels) await db.from('people').update({ notes: `Wix labels: ${labels}` }).eq('id', personId);
    const others = (r.otherEmails ?? []).map((e) => clean(e, 254).toLowerCase()).filter((e) => EMAIL.test(e) && e !== email);
    if (others.length) {
      await db.from('person_emails').upsert(
        others.map((e) => ({ email: e, person_id: personId })),
        { onConflict: 'email', ignoreDuplicates: true },
      );
    }
  };

  // A few at a time: quick for a few hundred contacts without flooding the database.
  for (let i = 0; i < work.length; i += 8) await Promise.all(work.slice(i, i + 8).map(one));

  const emails = [...seen];
  for (let i = 0; i < emails.length; i += 200) {
    const res = await db.from('people').select('id', { count: 'exact', head: true }).in('email', emails.slice(i, i + 200)).eq('subscribed', true);
    subscribed += res.count ?? 0;
  }

  await db.from('contact_imports').insert({
    filename: clean(filename, 200) || 'contacts.csv',
    total: rows.length,
    created,
    updated,
    skipped,
    imported_by: viewer.personId,
  });
  revalidatePath('/admin/people');
  return { ok: true, total: rows.length, created, updated, skipped, subscribed };
}
