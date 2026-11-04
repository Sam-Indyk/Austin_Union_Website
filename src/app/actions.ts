'use server';

import { getEventBySlug } from '@/lib/content/repo';
import { getStore } from '@/lib/store';

export interface FormState {
  status: 'idle' | 'ok' | 'error';
  message?: string;
  /** For RSVPs to partner-hosted (UATX/Swoogo) events: where to finish registering. */
  partnerUrl?: string;
  duplicate?: boolean;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function field(form: FormData, name: string, max = 200) {
  return String(form.get(name) ?? '').trim().slice(0, max);
}

/** Bots fill every field; humans never see this one. */
function isBot(form: FormData) {
  return field(form, 'company') !== '';
}

export async function subscribe(_prev: FormState, form: FormData): Promise<FormState> {
  if (isBot(form)) return { status: 'ok', message: 'Thanks for signing up!' };
  const firstName = field(form, 'firstName', 80);
  const lastName = field(form, 'lastName', 80);
  const email = field(form, 'email', 254);
  if (!firstName || !lastName) return { status: 'error', message: 'Please enter your first and last name.' };
  if (!EMAIL.test(email)) return { status: 'error', message: 'Please enter a valid email address.' };

  const { created } = await getStore().upsertContact({ email, firstName, lastName, source: 'mailing_list', subscribe: true });
  return { status: 'ok', message: created ? 'Thanks for signing up!' : 'You’re already on the list — thank you!' };
}

export async function sendMessage(_prev: FormState, form: FormData): Promise<FormState> {
  if (isBot(form)) return { status: 'ok', message: 'Thanks for submitting!' };
  const firstName = field(form, 'firstName', 80);
  const lastName = field(form, 'lastName', 80);
  const name = field(form, 'name', 160) || [firstName, lastName].filter(Boolean).join(' ');
  const email = field(form, 'email', 254);
  const body = field(form, 'message', 5000);
  const page = field(form, 'page', 200) || '/';
  if (!EMAIL.test(email)) return { status: 'error', message: 'Please enter a valid email address.' };
  if (!body) return { status: 'error', message: 'Please write a message.' };

  const store = getStore();
  await store.addMessage({ name, email, body, page });
  await store.upsertContact({ email, firstName, lastName, source: 'message', subscribe: false });
  return { status: 'ok', message: 'Thanks for submitting!' };
}

export async function rsvp(_prev: FormState, form: FormData): Promise<FormState> {
  if (isBot(form)) return { status: 'ok' };
  const slug = field(form, 'event', 200);
  const firstName = field(form, 'firstName', 80);
  const lastName = field(form, 'lastName', 80);
  const email = field(form, 'email', 254);
  if (!firstName || !lastName) return { status: 'error', message: 'Please enter your first and last name.' };
  if (!EMAIL.test(email)) return { status: 'error', message: 'Please enter a valid email address.' };

  const found = await getEventBySlug(slug);
  if (!found || found.event.rsvp.mode !== 'native') return { status: 'error', message: 'This event is not taking RSVPs.' };
  const { event } = found;
  const closesAt = Date.parse(event.rsvp.closesAt ?? event.startsAt);
  if (Date.now() > closesAt) return { status: 'error', message: 'Registration is closed.' };

  const store = getStore();
  const { duplicate } = await store.addRsvp({ eventId: event.id, firstName, lastName, email });
  // Everyone who RSVPs joins the mailing list (unless they previously unsubscribed).
  await store.upsertContact({ email, firstName, lastName, source: 'rsvp', subscribe: true });

  // TODO(phase 2): send the confirmation email, and when Swoogo API credentials are
  // configured, register the guest with UATX directly instead of handing off.
  return {
    status: 'ok',
    duplicate,
    partnerUrl: event.rsvp.partner?.url,
  };
}
