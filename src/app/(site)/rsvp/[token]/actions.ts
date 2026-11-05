'use server';

import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { promoteFromWaitlist, spotsLeft } from '@/lib/rsvps';
import { serviceClient } from '@/lib/supabase/clients';

const TOKEN = /^[0-9a-f-]{36}$/i;

function tokenOf(form: FormData): string | null {
  const token = String(form.get('token') ?? '');
  return TOKEN.test(token) ? token : null;
}

export async function cancelRsvp(form: FormData): Promise<void> {
  const token = tokenOf(form);
  if (token) {
    const { data } = await serviceClient().from('rsvps').update({ status: 'cancelled' }).eq('manage_token', token).select('event_id');
    const eventId = data?.[0]?.event_id;
    // Their spot goes to whoever has waited longest.
    if (eventId) after(() => promoteFromWaitlist(eventId));
  }
  redirect(`/rsvp/${encodeURIComponent(String(form.get('token') ?? ''))}`);
}

export async function restoreRsvp(form: FormData): Promise<void> {
  const token = tokenOf(form);
  if (token) {
    const db = serviceClient();
    const row = (await db.from('rsvps').select('event_id').eq('manage_token', token).maybeSingle()).data;
    if (row) {
      // If the event filled up in the meantime, they rejoin at the back of the waitlist.
      const full = (await spotsLeft(row.event_id)) === 0;
      await db.from('rsvps').update({ status: full ? 'waitlist' : 'going', ...(full ? { created_at: new Date().toISOString() } : {}) }).eq('manage_token', token);
    }
  }
  redirect(`/rsvp/${encodeURIComponent(String(form.get('token') ?? ''))}`);
}
