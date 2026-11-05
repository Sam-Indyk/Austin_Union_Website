'use server';

import { redirect } from 'next/navigation';
import { serviceClient } from '@/lib/supabase/clients';

const TOKEN = /^[0-9a-f-]{36}$/i;

export async function unsubscribe(form: FormData): Promise<void> {
  const t = String(form.get('t') ?? '');
  if (TOKEN.test(t)) {
    await serviceClient().from('people').update({ subscribed: false, unsubscribed_at: new Date().toISOString() }).eq('unsubscribe_token', t);
  }
  redirect(`/unsubscribe?t=${encodeURIComponent(t)}`);
}

export async function resubscribe(form: FormData): Promise<void> {
  const t = String(form.get('t') ?? '');
  if (TOKEN.test(t)) {
    await serviceClient()
      .from('people')
      .update({ subscribed: true, subscribed_at: new Date().toISOString(), unsubscribed_at: null })
      .eq('unsubscribe_token', t);
  }
  redirect(`/unsubscribe?t=${encodeURIComponent(t)}`);
}
