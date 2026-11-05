// Email campaigns: scheduling event announcements/reminders and sending them.
//
// A campaign is sent at most once to each address (email_sends has a unique
// key per campaign + address), so a run that times out can simply be resumed.
// In production, /api/cron/dispatch is called every few minutes; officers can
// also press "Send now".
import 'server-only';
import { toEvent } from '@/lib/content/db-source';
import type { EventItem } from '@/lib/content/types';
import { serviceClient } from '@/lib/supabase/clients';
import { sendMail } from './send';
import { eventAnnouncement, eventReminder, type Recipient, type RenderedEmail } from './templates';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.austinunion.org';
export const unsubscribeUrl = (token: string) => `${SITE}/unsubscribe?t=${token}`;
export const manageRsvpUrl = (token: string) => `${SITE}/rsvp/${token}`;

/** Create or update the automatic campaigns for an event after it is saved. */
export async function syncEventCampaigns(eventId: string): Promise<void> {
  const db = serviceClient();
  const row = (await db.from('events').select('*').eq('id', eventId).single()).data;
  if (!row) return;
  const e = toEvent(row);
  const existing = (await db.from('email_campaigns').select('id, kind, status').eq('event_id', eventId)).data ?? [];
  const find = (kind: string) => existing.find((c) => c.kind === kind);

  const live = row.status === 'published' && Date.parse(row.ends_at) > Date.now();
  const announce = find('announcement');
  if (row.announce && live && (row.visibility === 'public' || row.visibility === 'members')) {
    const when = row.publish_at && Date.parse(row.publish_at) > Date.now() ? row.publish_at : new Date().toISOString();
    if (!announce) {
      await db.from('email_campaigns').insert({
        kind: 'announcement',
        event_id: eventId,
        subject: e.title,
        audience: row.visibility === 'members' ? { type: 'members', kinds: row.member_kinds } : { type: 'subscribers' },
        status: 'scheduled',
        scheduled_at: when,
      });
    } else if (announce.status === 'scheduled' || announce.status === 'draft') {
      await db.from('email_campaigns').update({ subject: e.title, scheduled_at: when, status: 'scheduled' }).eq('id', announce.id);
    }
  } else if (announce && (announce.status === 'scheduled' || announce.status === 'draft')) {
    await db.from('email_campaigns').update({ status: 'cancelled' }).eq('id', announce.id);
  }

  const reminder = find('reminder');
  if (row.reminder_hours && live && row.rsvp_mode === 'native') {
    const when = new Date(Date.parse(row.starts_at) - row.reminder_hours * 3600_000).toISOString();
    if (!reminder) {
      await db.from('email_campaigns').insert({ kind: 'reminder', event_id: eventId, subject: `Reminder: ${e.title}`, audience: { type: 'rsvps', eventId }, status: 'scheduled', scheduled_at: when });
    } else if (reminder.status !== 'sent' && reminder.status !== 'sending') {
      await db.from('email_campaigns').update({ subject: `Reminder: ${e.title}`, scheduled_at: when, status: 'scheduled' }).eq('id', reminder.id);
    }
  } else if (reminder && reminder.status === 'scheduled') {
    await db.from('email_campaigns').update({ status: 'cancelled' }).eq('id', reminder.id);
  }
}

type Audience = { type: 'subscribers' } | { type: 'rsvps'; eventId: string } | { type: 'members'; kinds?: string[] | null };

interface Target extends Recipient {
  personId: string | null;
}

async function resolveAudience(audience: Audience): Promise<Target[]> {
  const db = serviceClient();
  if (audience.type === 'rsvps') {
    const rows =
      (
        await db
          .from('rsvps')
          .select('email, first_name, person_id, manage_token, status')
          .eq('event_id', audience.eventId)
          .eq('status', 'going') // not the waitlist: "see you tomorrow" would be wrong for them
          .not('email', 'like', '%@guests.austinunion.org') // walk-ins added without an email
      ).data ?? [];
    return rows.map((r) => ({ email: r.email, firstName: r.first_name, personId: r.person_id, manageUrl: manageRsvpUrl(r.manage_token) }));
  }
  if (audience.type === 'members') {
    const today = new Date().toISOString().slice(0, 10);
    const rows =
      (await db.from('memberships').select('kind, status, ends_on, people!memberships_person_id_fkey(id, email, first_name, unsubscribe_token, unsubscribed_at)')).data ?? [];
    const seen = new Map<string, Target>();
    for (const m of rows) {
      const p = m.people as unknown as { id: string; email: string; first_name: string | null; unsubscribe_token: string; unsubscribed_at: string | null } | null;
      if (!p || p.unsubscribed_at || m.status !== 'active' || (m.ends_on && m.ends_on < today)) continue;
      if (audience.kinds?.length && !audience.kinds.includes(m.kind)) continue;
      seen.set(p.email, { email: p.email, firstName: p.first_name, personId: p.id, unsubscribeUrl: unsubscribeUrl(p.unsubscribe_token) });
    }
    return [...seen.values()];
  }
  const rows = (await db.from('people').select('id, email, first_name, unsubscribe_token').eq('subscribed', true)).data ?? [];
  return rows.map((p) => ({ email: p.email, firstName: p.first_name, personId: p.id, unsubscribeUrl: unsubscribeUrl(p.unsubscribe_token) }));
}

/** The list unsubscribe link for an address, if that person is currently subscribed. */
export async function subscriberUnsubscribeUrl(email: string): Promise<string | undefined> {
  const row = (await serviceClient().from('person_emails').select('people(unsubscribe_token, subscribed)').eq('email', email.toLowerCase()).maybeSingle()).data;
  const p = row?.people as unknown as { unsubscribe_token: string; subscribed: boolean } | null;
  return p?.subscribed ? unsubscribeUrl(p.unsubscribe_token) : undefined;
}

async function settingsAddress(): Promise<string | undefined> {
  const row = (await serviceClient().from('site_content').select('value').eq('key', 'settings').maybeSingle()).data;
  return (row?.value as { mailingAddress?: string } | undefined)?.mailingAddress || undefined;
}

export function renderFor(kind: string, e: EventItem, r: Recipient, mailingAddress?: string): RenderedEmail {
  return kind === 'reminder' ? eventReminder(e, r) : eventAnnouncement(e, r, { mailingAddress });
}

/** Send (or continue sending) one campaign. Returns how many were sent this run. */
export async function dispatchCampaign(campaignId: string, budget = 300): Promise<number> {
  const db = serviceClient();
  const c = (await db.from('email_campaigns').select('*').eq('id', campaignId).single()).data;
  if (!c || c.status === 'sent' || c.status === 'cancelled' || !c.event_id) return 0;
  const eventRow = (await db.from('events').select('*').eq('id', c.event_id).single()).data;
  if (!eventRow) return 0;
  const event = toEvent(eventRow);
  if (c.kind === 'reminder' && Date.parse(event.startsAt) < Date.now()) {
    await db.from('email_campaigns').update({ status: 'cancelled', last_error: 'Event already started' }).eq('id', c.id);
    return 0;
  }

  await db.from('email_campaigns').update({ status: 'sending', started_at: c.started_at ?? new Date().toISOString() }).eq('id', c.id);
  const audience = await resolveAudience(c.audience as Audience);
  const done = new Set(((await db.from('email_sends').select('email').eq('campaign_id', c.id)).data ?? []).map((s) => s.email));
  const todo = audience.filter((t) => !done.has(t.email)).slice(0, budget);
  const address = await settingsAddress();

  let sent = 0;
  let failed = 0;
  let lastError: string | null = null;
  const queue = [...todo];
  const worker = async () => {
    for (let t = queue.shift(); t; t = queue.shift()) {
      // Claim the address first so a parallel run can't double-send it.
      const claim = await db.from('email_sends').insert({ campaign_id: c.id, person_id: t.personId, email: t.email, status: 'queued' }).select('id').single();
      if (claim.error) continue;
      try {
        const mail = renderFor(c.kind, event, t, address);
        await sendMail({
          to: t.email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          // Mail apps' own unsubscribe button POSTs to the one-click endpoint.
          headers: t.unsubscribeUrl
            ? { 'List-Unsubscribe': `<${t.unsubscribeUrl.replace('/unsubscribe?', '/api/unsubscribe?')}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
            : undefined,
        });
        await db.from('email_sends').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', claim.data.id);
        sent++;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        await db.from('email_sends').update({ status: 'failed', error: lastError }).eq('id', claim.data.id);
        failed++;
      }
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));

  const remaining = audience.length - done.size - todo.length;
  const totals = (await db.from('email_sends').select('status').eq('campaign_id', c.id)).data ?? [];
  await db
    .from('email_campaigns')
    .update({
      status: remaining > 0 ? 'sending' : 'sent',
      sent_at: remaining > 0 ? null : new Date().toISOString(),
      sent_count: totals.filter((s) => s.status === 'sent').length,
      failed_count: totals.filter((s) => s.status === 'failed').length,
      last_error: lastError,
    })
    .eq('id', c.id);
  return sent + failed;
}

/** Send everything that is due. Called by the scheduler. */
export async function dispatchDue(): Promise<{ campaigns: number; emails: number }> {
  const db = serviceClient();
  const due =
    (await db.from('email_campaigns').select('id').in('status', ['scheduled', 'sending']).lte('scheduled_at', new Date().toISOString()).order('scheduled_at')).data ?? [];
  let emails = 0;
  for (const c of due) emails += await dispatchCampaign(c.id);
  return { campaigns: due.length, emails };
}
