'use server';

import { createHash, randomInt } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ensureOwnerAccess } from '@/lib/auth/owners';
import { getViewer, safeNext } from '@/lib/auth/viewer';
import { codeEmail, sendMail } from '@/lib/email/send';
import { serviceClient } from '@/lib/supabase/clients';
import { sessionClient } from '@/lib/supabase/ssr';

export interface AuthState {
  step: 'email' | 'code' | 'done';
  email?: string;
  message?: string;
  error?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const field = (f: FormData, k: string) => String(f.get(k) ?? '').trim();

/** Step 1: email a 6-digit sign-in code (Supabase sends it with our template). */
export async function sendSignInCode(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, 'email').toLowerCase();
  if (!EMAIL.test(email)) return { step: 'email', error: 'Please enter a valid email address.' };
  const supabase = await sessionClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) {
    const wait = /rate|seconds/i.test(error.message);
    return { step: 'email', email, error: wait ? 'Too many attempts — please wait a minute and try again.' : error.message };
  }
  return { step: 'code', email, message: `We sent a 6-digit code to ${email}.` };
}

/** Step 2: verify the code and start the session. */
export async function verifySignInCode(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = field(form, 'email').toLowerCase();
  const token = field(form, 'code').replace(/\D/g, '');
  const next = safeNext(field(form, 'next'));
  if (token.length !== 6) return { step: 'code', email, error: 'Enter the 6-digit code from the email.' };
  const supabase = await sessionClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error || !data.user) return { step: 'code', email, error: 'That code didn’t work. Check the latest email, or send a new code.' };
  await ensureOwnerAccess(data.user.id, email);
  redirect(next);
}

export async function signInWithGoogle(form: FormData): Promise<void> {
  const next = safeNext(field(form, 'next'));
  const h = await headers();
  const origin = h.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const supabase = await sessionClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`, queryParams: { prompt: 'select_account' } },
  });
  if (error || !data.url) redirect(`/login?error=google&next=${encodeURIComponent(next)}`);
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  const supabase = await sessionClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

// ---------------------------------------------------------------------------
// Adding another email address to an account
// ---------------------------------------------------------------------------
export interface LinkState {
  step: 'email' | 'code' | 'done';
  email?: string;
  message?: string;
  error?: string;
}

const hash = (code: string, email: string) => createHash('sha256').update(`${email}:${code}:${process.env.VOTE_SECRET ?? ''}`).digest('hex');

export async function sendLinkCode(_prev: LinkState, form: FormData): Promise<LinkState> {
  const viewer = await getViewer();
  if (!viewer) return { step: 'email', error: 'Please sign in again.' };
  const email = field(form, 'email').toLowerCase();
  if (!EMAIL.test(email)) return { step: 'email', error: 'Please enter a valid email address.' };
  if (viewer.emails.some((e) => e.email === email && e.verified)) return { step: 'email', error: 'That address is already on your account.' };

  const db = serviceClient();
  const owner = (await db.from('person_emails').select('person_id').eq('email', email).maybeSingle()).data;
  if (owner && owner.person_id !== viewer.personId) {
    // Belongs to someone else on file. Merging two records is an admin decision,
    // unless this login's record is brand new and empty (handled at verification).
  }
  const recent = await db
    .from('email_codes')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', new Date(Date.now() - 10 * 60_000).toISOString());
  if ((recent.count ?? 0) >= 3) return { step: 'code', email, error: 'We’ve sent a few codes already — check your inbox, or try again in a few minutes.' };

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await db.from('email_codes').insert({ email, purpose: 'link_email', person_id: viewer.personId, code_hash: hash(code, email) });
  const mail = codeEmail(code, 'Enter this code on austinunion.org to add this address to your account.');
  await sendMail({ to: email, ...mail });
  return { step: 'code', email, message: `We sent a code to ${email}.` };
}

export async function verifyLinkCode(_prev: LinkState, form: FormData): Promise<LinkState> {
  const viewer = await getViewer();
  if (!viewer) return { step: 'email', error: 'Please sign in again.' };
  const email = field(form, 'email').toLowerCase();
  const code = field(form, 'code').replace(/\D/g, '');
  const db = serviceClient();
  const row = (
    await db
      .from('email_codes')
      .select('id, code_hash, attempts, expires_at')
      .eq('email', email)
      .eq('purpose', 'link_email')
      .eq('person_id', viewer.personId)
      .is('used_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ).data;
  if (!row || Date.parse(row.expires_at) < Date.now() || row.attempts >= 5) {
    return { step: 'email', email, error: 'That code has expired. Please send a new one.' };
  }
  if (row.code_hash !== hash(code, email)) {
    await db.from('email_codes').update({ attempts: row.attempts + 1 }).eq('id', row.id);
    return { step: 'code', email, error: 'That code didn’t match. Try again.' };
  }
  await db.from('email_codes').update({ used_at: new Date().toISOString() }).eq('id', row.id);

  const owner = (await db.from('person_emails').select('person_id').eq('email', email).maybeSingle()).data;
  if (!owner) {
    await db.from('person_emails').insert({ email, person_id: viewer.personId, verified_at: new Date().toISOString() });
  } else if (owner.person_id === viewer.personId) {
    await db.from('person_emails').update({ verified_at: new Date().toISOString() }).eq('email', email);
  } else {
    // The address belongs to another record — typically the one an admin created
    // for them (with their membership). Move this login over to that record if
    // the current one is just an empty sign-in shell; otherwise ask an admin.
    const mine = await db.from('people').select('source').eq('id', viewer.personId).single();
    const [{ count: myMemberships }, { count: myRsvps }] = await Promise.all([
      db.from('memberships').select('id', { count: 'exact', head: true }).eq('person_id', viewer.personId),
      db.from('rsvps').select('id', { count: 'exact', head: true }).eq('person_id', viewer.personId),
    ]);
    const shell = mine.data?.source === 'signin' && !myMemberships && !myRsvps;
    if (!shell) {
      return {
        step: 'done',
        error: 'That address is already on another Austin Union record. Please contact us and we’ll merge them.',
      };
    }
    const target = owner.person_id;
    await db.from('person_emails').update({ person_id: target }).eq('person_id', viewer.personId);
    await db.from('person_emails').update({ verified_at: new Date().toISOString() }).eq('email', email);
    await db.from('auth_links').update({ person_id: target }).eq('person_id', viewer.personId);
    await db.from('people').delete().eq('id', viewer.personId);
  }
  revalidatePath('/account');
  return { step: 'done', email, message: `${email} is now linked to your account.` };
}
