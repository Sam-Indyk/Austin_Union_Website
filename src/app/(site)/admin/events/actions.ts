'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { assertStaff } from '@/lib/auth/viewer';
import { toEvent } from '@/lib/content/db-source';
import type { ImageRef } from '@/lib/content/types';
import { dispatchCampaign, manageRsvpUrl, renderFor, syncEventCampaigns, unsubscribeUrl } from '@/lib/email/campaigns';
import { sendMail } from '@/lib/email/send';
import { uploadImage } from '@/lib/media/upload';
import { notifyPromoted, promoteFromWaitlist } from '@/lib/rsvps';
import { plainText, sanitizeRich } from '@/lib/sanitize';
import { serviceClient } from '@/lib/supabase/clients';
import type { Database } from '@/lib/supabase/database.types';
import { austinToISO } from '@/lib/time';

type EventUpdate = Database['public']['Tables']['events']['Update'];

export interface EventFormState {
  error?: string;
  message?: string;
}

const f = (form: FormData, k: string) => String(form.get(k) ?? '').trim();
const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/^-|-$/g, '') || 'event';

function refresh(slug?: string) {
  updateTag('events');
  if (slug) updateTag(`event:${slug}`);
  revalidatePath('/admin/events');
  revalidatePath('/admin');
}

const isFile = (v: FormDataEntryValue | null): v is File => typeof v === 'object' && v !== null && 'size' in v && v.size > 0;

export async function saveEvent(eventId: string | null, _prev: EventFormState, form: FormData): Promise<EventFormState> {
  const viewer = await assertStaff();
  const db = serviceClient();
  const title = plainText(f(form, 'title'), 200);
  if (!title) return { error: 'Give the event a title.' };

  const date = f(form, 'date');
  const start = f(form, 'start_time');
  const end = f(form, 'end_time');
  const endDate = f(form, 'end_date') || date;
  if (!date || !start || !end) return { error: 'Set the date, start time and end time.' };
  const startsAt = austinToISO(date, start);
  const endsAt = austinToISO(endDate, end);
  if (Date.parse(endsAt) <= Date.parse(startsAt)) return { error: 'The event has to end after it starts.' };

  // Image: a new upload, or the existing one with an updated focal point / alt text.
  let image: ImageRef | null = null;
  try {
    const file = form.get('image_file');
    if (isFile(file)) image = await uploadImage(file, { folder: 'events', alt: plainText(f(form, 'image_alt'), 200) || title });
    else if (f(form, 'image_json')) image = JSON.parse(f(form, 'image_json')) as ImageRef;
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'The image could not be uploaded.' };
  }
  if (!image) return { error: 'Add an image — it’s used on the Events page, the event page and in emails.' };
  image = {
    ...image,
    alt: plainText(f(form, 'image_alt'), 200) || image.alt || title,
    focalX: Number(f(form, 'focal_x')) || image.focalX || 50,
    focalY: Number(f(form, 'focal_y')) || image.focalY || 50,
  };

  // Recap photos: keep the ones still listed, add new uploads.
  let recapPhotos: ImageRef[] = [];
  try {
    recapPhotos = JSON.parse(f(form, 'recap_photos') || '[]') as ImageRef[];
    for (const file of form.getAll('recap_files')) {
      if (isFile(file)) recapPhotos.push(await uploadImage(file, { folder: 'recaps', maxWidth: 1800, alt: `${title} — photo` }));
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'A recap photo could not be uploaded.' };
  }
  const recapSummary = sanitizeRich(f(form, 'recap_summary'));
  const youtube = f(form, 'recap_youtube');
  const recap = recapSummary || youtube || recapPhotos.length ? { summary: recapSummary || undefined, youtubeUrl: youtube || undefined, photos: recapPhotos } : null;

  const partnerUrl = f(form, 'partner_url');
  if (partnerUrl && !/^https?:\/\//.test(partnerUrl)) return { error: 'The UATX registration link should start with https://' };
  const capacity = Number(f(form, 'capacity')) || null;
  const visibility = (f(form, 'visibility') || 'public') as 'public' | 'members' | 'unlisted';
  const kinds = form.getAll('member_kinds').map(String) as ('voting' | 'associate' | 'honorary')[];
  const publishAt = f(form, 'publish_date') && f(form, 'publish_time') ? austinToISO(f(form, 'publish_date'), f(form, 'publish_time')) : null;
  const closesAt = f(form, 'closes_date') && f(form, 'closes_time') ? austinToISO(f(form, 'closes_date'), f(form, 'closes_time')) : null;
  const reminder = f(form, 'reminder_hours');

  const fields: EventUpdate = {
    title,
    summary: plainText(f(form, 'summary'), 600),
    description: sanitizeRich(f(form, 'description')),
    starts_at: startsAt,
    ends_at: endsAt,
    location_name: plainText(f(form, 'location_name'), 200),
    address: plainText(f(form, 'address'), 300) || null,
    image: image as unknown as EventUpdate['image'],
    status: (f(form, 'status') || 'draft') as EventUpdate['status'],
    publish_at: publishAt,
    visibility,
    member_kinds: visibility === 'members' && kinds.length ? kinds : null,
    rsvp_mode: f(form, 'rsvp_mode') === 'none' ? 'none' : 'native',
    rsvp_closes_at: closesAt,
    capacity,
    partner: partnerUrl ? ({ kind: 'swoogo', url: partnerUrl, swoogoEventId: f(form, 'swoogo_event_id') || undefined } as EventUpdate['partner']) : null,
    feature_on_home: form.get('feature_on_home') === 'on',
    home_card: (f(form, 'card_title') || f(form, 'card_subtitle')
      ? { title: plainText(f(form, 'card_title'), 160) || undefined, subtitle: plainText(f(form, 'card_subtitle'), 160) || undefined }
      : null) as EventUpdate['home_card'],
    recap: recap as unknown as EventUpdate['recap'],
    announce: form.get('announce') === 'on',
    reminder_hours: reminder === 'none' ? null : Number(reminder) || 24,
  };

  let id = eventId;
  let slug: string;
  if (!id) {
    const base = slugify(f(form, 'slug') || title);
    slug = base;
    for (let n = 2; (await db.from('events').select('id').eq('slug', slug).maybeSingle()).data; n++) slug = `${base}-${n}`;
    const { data, error } = await db
      .from('events')
      .insert({ ...(fields as Database['public']['Tables']['events']['Insert']), slug, created_by: viewer.personId })
      .select('id')
      .single();
    if (error || !data) return { error: error?.message ?? 'Could not create the event.' };
    id = data.id;
  } else {
    const current = (await db.from('events').select('slug, status').eq('id', id).single()).data;
    slug = current?.slug ?? slugify(title);
    // The link can change only while the event is still a draft (published links may already be shared).
    const wanted = slugify(f(form, 'slug') || slug);
    if (current?.status === 'draft' && wanted !== slug) {
      const taken = (await db.from('events').select('id').eq('slug', wanted).neq('id', id).maybeSingle()).data;
      if (!taken) slug = wanted;
    }
    const { error } = await db.from('events').update({ ...fields, slug }).eq('id', id);
    if (error) return { error: error.message };
  }

  await syncEventCampaigns(id);
  // If the announcement is due right now, start sending after responding.
  const due = (await db.from('email_campaigns').select('id').eq('event_id', id).eq('kind', 'announcement').eq('status', 'scheduled').lte('scheduled_at', new Date().toISOString()).maybeSingle()).data;
  if (due && process.env.SMTP_URL) after(() => dispatchCampaign(due.id).then(() => undefined));

  refresh(slug);
  if (!eventId) redirect(`/admin/events/${id}?created=1`);
  return { message: due ? 'Saved — the announcement email is going out now.' : 'Saved.' };
}

export async function deleteEvent(eventId: string): Promise<void> {
  await assertStaff('admin');
  await serviceClient().from('events').delete().eq('id', eventId);
  refresh();
  redirect('/admin/events?deleted=1');
}

export async function duplicateEvent(eventId: string): Promise<void> {
  const viewer = await assertStaff();
  const db = serviceClient();
  const e = (await db.from('events').select('*').eq('id', eventId).single()).data;
  if (!e) return;
  const base = `${e.slug}-copy`;
  let slug = base;
  for (let n = 2; (await db.from('events').select('id').eq('slug', slug).maybeSingle()).data; n++) slug = `${base}-${n}`;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- dropping fields the copy must not keep
  const { id: _id, created_at: _c, updated_at: _u, recap: _r, ...rest } = e;
  const { data } = await db
    .from('events')
    .insert({ ...rest, slug, title: `${e.title} (copy)`, status: 'draft', publish_at: null, created_by: viewer.personId })
    .select('id')
    .single();
  refresh();
  if (data) redirect(`/admin/events/${data.id}?duplicated=1`);
}

// ---------------------------------------------------------------------------
// Guests
// ---------------------------------------------------------------------------
export async function setCheckedIn(rsvpId: string, checkedIn: boolean): Promise<void> {
  const viewer = await assertStaff();
  await serviceClient()
    .from('rsvps')
    .update(checkedIn ? { checked_in_at: new Date().toISOString(), checked_in_by: viewer.personId } : { checked_in_at: null, checked_in_by: null })
    .eq('id', rsvpId);
}

export async function setRsvpStatus(rsvpId: string, eventId: string, status: 'going' | 'waitlist' | 'cancelled'): Promise<void> {
  await assertStaff();
  const db = serviceClient();
  const before = (await db.from('rsvps').select('status').eq('id', rsvpId).single()).data?.status;
  await db.from('rsvps').update({ status }).eq('id', rsvpId);
  // Moved up by hand: tell them. Cancelled: the spot goes to the next person waiting.
  if (before === 'waitlist' && status === 'going') after(() => notifyPromoted(rsvpId));
  if (before === 'going' && status === 'cancelled') after(() => promoteFromWaitlist(eventId));
  revalidatePath(`/admin/events/${eventId}/guests`);
}

export async function addWalkIn(eventId: string, _prev: EventFormState, form: FormData): Promise<EventFormState> {
  const viewer = await assertStaff();
  const email = f(form, 'email').toLowerCase();
  const firstName = plainText(f(form, 'first_name'), 80);
  const lastName = plainText(f(form, 'last_name'), 80);
  if (!firstName) return { error: 'Enter at least a first name.' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { error: 'That email doesn’t look right.' };
  const db = serviceClient();
  let personId: string | null = null;
  if (email) {
    const rows = (await db.rpc('upsert_contact', { p_email: email, p_first: firstName, p_last: lastName, p_source: 'rsvp', p_opt_in: form.get('subscribe') === 'on' ? 'implicit' : 'none' })).data;
    personId = rows?.[0]?.person_id ?? null;
  }
  const { error } = await db.from('rsvps').insert({
    event_id: eventId,
    person_id: personId,
    first_name: firstName,
    last_name: lastName || '—',
    email: email || `walk-in-${crypto.randomUUID()}@guests.austinunion.org`,
    checked_in_at: new Date().toISOString(),
    checked_in_by: viewer.personId,
  });
  if (error) return { error: error.code === '23505' ? 'That email has already RSVP’d — check them in from the list.' : error.message };
  revalidatePath(`/admin/events/${eventId}/guests`);
  return { message: `${firstName} added and checked in.` };
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------
export async function sendTestEmail(eventId: string, kind: 'announcement' | 'reminder'): Promise<{ ok: boolean; message: string }> {
  const viewer = await assertStaff();
  const db = serviceClient();
  const row = (await db.from('events').select('*').eq('id', eventId).single()).data;
  if (!row) return { ok: false, message: 'Event not found.' };
  const person = (await db.from('people').select('unsubscribe_token').eq('id', viewer.personId).single()).data;
  const settings = (await db.from('site_content').select('value').eq('key', 'settings').maybeSingle()).data?.value as { mailingAddress?: string } | undefined;
  const mail = renderFor(
    kind,
    toEvent(row),
    { email: viewer.contactEmail, firstName: viewer.firstName, unsubscribeUrl: person ? unsubscribeUrl(person.unsubscribe_token) : undefined, manageUrl: manageRsvpUrl('00000000-0000-0000-0000-000000000000') },
    settings?.mailingAddress,
  );
  try {
    await sendMail({ to: viewer.contactEmail, subject: `[Test] ${mail.subject}`, html: mail.html, text: mail.text });
    return { ok: true, message: `Test sent to ${viewer.contactEmail}.` };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Could not send.' };
  }
}

export async function sendCampaignNow(campaignId: string, eventId: string): Promise<{ ok: boolean; message: string }> {
  await assertStaff();
  const db = serviceClient();
  await db.from('email_campaigns').update({ status: 'scheduled', scheduled_at: new Date().toISOString() }).eq('id', campaignId).in('status', ['scheduled', 'draft', 'cancelled']);
  const n = await dispatchCampaign(campaignId);
  revalidatePath(`/admin/events/${eventId}`);
  return { ok: true, message: n ? `Sent to ${n} people.` : 'Nothing left to send.' };
}
