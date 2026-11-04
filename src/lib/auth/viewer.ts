// Who is signed in, resolved to their person record, memberships and staff role.
// This is the one place the app decides what a visitor may see or do.
import 'server-only';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { cache } from 'react';
import { hasDatabase, serviceClient } from '@/lib/supabase/clients';
import { sessionClient } from '@/lib/supabase/ssr';

export type MembershipKind = 'voting' | 'associate' | 'honorary';
export type StaffRole = 'editor' | 'admin';

export interface ViewerMembership {
  id: string;
  kind: MembershipKind;
  status: 'active' | 'lapsed' | 'revoked';
  honoraryReason: string | null;
  endsOn: string | null;
  current: boolean;
}

export interface Viewer {
  userId: string;
  signedInAs: string;
  personId: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  contactEmail: string;
  emails: { email: string; verified: boolean }[];
  verifiedStudent: boolean;
  classYear: number | null;
  subscribed: boolean;
  staffRole: StaffRole | null;
  memberships: ViewerMembership[];
  /** Holds at least one current membership. */
  isMember: boolean;
}

const UATX = /@([a-z0-9-]+\.)*uaustin\.org$/i;

function isCurrent(m: { status: string; ends_on: string | null }) {
  return m.status === 'active' && (!m.ends_on || m.ends_on >= new Date().toISOString().slice(0, 10));
}

/** The signed-in visitor, or null. Deduplicated per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  // Always per-request: sessions and membership dates depend on the visitor and on today.
  await connection();
  if (!hasDatabase()) return null;
  const auth = await sessionClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user?.email) return null;

  const db = serviceClient();
  let personId = (await db.from('auth_links').select('person_id').eq('user_id', user.id).maybeSingle()).data?.person_id;
  if (!personId) {
    // Login created before the link existed (shouldn't happen, but heal it).
    const owner = (await db.from('person_emails').select('person_id').eq('email', user.email.toLowerCase()).maybeSingle()).data;
    personId =
      owner?.person_id ??
      (await db.from('people').insert({ email: user.email.toLowerCase(), source: 'signin' }).select('id').single()).data?.id;
    if (!personId) return null;
    await db.from('auth_links').upsert({ user_id: user.id, person_id: personId });
  }

  const [person, emails, staff, memberships] = await Promise.all([
    db.from('people').select('first_name, last_name, email, class_year, subscribed').eq('id', personId).single(),
    db.from('person_emails').select('email, verified_at').eq('person_id', personId).order('created_at'),
    db.from('staff').select('role').eq('person_id', personId).maybeSingle(),
    db.from('memberships').select('id, kind, status, honorary_reason, ends_on').eq('person_id', personId),
  ]);
  if (!person.data) return null;

  const ms: ViewerMembership[] = (memberships.data ?? []).map((m) => ({
    id: m.id,
    kind: m.kind,
    status: m.status as ViewerMembership['status'],
    honoraryReason: m.honorary_reason,
    endsOn: m.ends_on,
    current: isCurrent(m),
  }));
  const mails = (emails.data ?? []).map((e) => ({ email: e.email, verified: Boolean(e.verified_at) }));
  const p = person.data;
  return {
    userId: user.id,
    signedInAs: user.email,
    personId,
    firstName: p.first_name,
    lastName: p.last_name,
    displayName: [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email,
    contactEmail: p.email,
    emails: mails,
    verifiedStudent: mails.some((e) => e.verified && UATX.test(e.email)),
    classYear: p.class_year,
    subscribed: p.subscribed,
    staffRole: (staff.data?.role as StaffRole | undefined) ?? null,
    memberships: ms,
    isMember: ms.some((m) => m.current),
  };
});

export async function requireViewer(next: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}

export async function requireStaff(next: string, min: StaffRole = 'editor'): Promise<Viewer> {
  const viewer = await requireViewer(next);
  if (!viewer.staffRole || (min === 'admin' && viewer.staffRole !== 'admin')) redirect('/account?denied=1');
  return viewer;
}

/** For server actions: returns the staff viewer or throws (never redirects mid-action). */
export async function assertStaff(min: StaffRole = 'editor'): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer?.staffRole || (min === 'admin' && viewer.staffRole !== 'admin')) throw new Error('Not authorised');
  return viewer;
}

/** Only allow same-site paths as post-login destinations. */
export function safeNext(next: string | null | undefined, fallback = '/account'): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
