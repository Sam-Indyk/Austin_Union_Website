// Keeping the guest list honest when spots open up: whoever has waited longest
// moves from the waitlist to "going" and gets an email saying so.
import 'server-only';
import { toEvent } from '@/lib/content/db-source';
import { manageRsvpUrl } from '@/lib/email/campaigns';
import { sendMail } from '@/lib/email/send';
import { rsvpConfirmation } from '@/lib/email/templates';
import { serviceClient } from '@/lib/supabase/clients';

/** Spots left, or null when there's no limit. */
export async function spotsLeft(eventId: string): Promise<number | null> {
  const db = serviceClient();
  const ev = (await db.from('events').select('capacity').eq('id', eventId).single()).data;
  if (!ev?.capacity) return null;
  const going = (await db.from('rsvps').select('id', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'going')).count ?? 0;
  return Math.max(0, ev.capacity - going);
}

/** Tell a guest they've been moved off the waitlist. */
export async function notifyPromoted(rsvpId: string): Promise<void> {
  if (!process.env.SMTP_URL) return;
  const db = serviceClient();
  const r = (await db.from('rsvps').select('email, first_name, manage_token, event_id').eq('id', rsvpId).single()).data;
  if (!r || r.email.endsWith('@guests.austinunion.org')) return;
  const row = (await db.from('events').select('*').eq('id', r.event_id).single()).data;
  if (!row || Date.parse(row.ends_at) < Date.now()) return;
  const e = toEvent(row);
  const mail = rsvpConfirmation(e, { email: r.email, firstName: r.first_name ?? undefined, manageUrl: manageRsvpUrl(r.manage_token) }, { promoted: true, partnerUrl: e.rsvp.partner?.url });
  await sendMail({ to: r.email, subject: mail.subject, html: mail.html, text: mail.text }).catch((err) => console.error('Waitlist email failed', err));
}

/** Fill any open spots from the waitlist, oldest first. Returns how many moved up. */
export async function promoteFromWaitlist(eventId: string): Promise<number> {
  const db = serviceClient();
  const ev = (await db.from('events').select('ends_at').eq('id', eventId).single()).data;
  if (!ev || Date.parse(ev.ends_at) < Date.now()) return 0;
  const left = await spotsLeft(eventId);
  if (left === 0) return 0;
  let q = db.from('rsvps').select('id').eq('event_id', eventId).eq('status', 'waitlist').order('created_at');
  if (left !== null) q = q.limit(left);
  const next = (await q).data ?? [];
  for (const r of next) {
    const { data } = await db.from('rsvps').update({ status: 'going' }).eq('id', r.id).eq('status', 'waitlist').select('id');
    if (data?.length) await notifyPromoted(r.id);
  }
  return next.length;
}
