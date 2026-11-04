'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertStaff } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';

export interface PersonFormState {
  ok?: boolean;
  error?: string;
  message?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const f = (form: FormData, k: string) => String(form.get(k) ?? '').trim();
const KINDS = ['voting', 'associate', 'honorary'] as const;
type Kind = (typeof KINDS)[number];

export async function createPerson(_p: PersonFormState, form: FormData): Promise<PersonFormState> {
  await assertStaff('admin');
  const email = f(form, 'email').toLowerCase();
  if (!EMAIL.test(email)) return { error: 'Enter a valid email address.' };
  const db = serviceClient();
  const existing = (await db.from('person_emails').select('person_id').eq('email', email).maybeSingle()).data;
  if (existing) redirect(`/admin/people/${existing.person_id}?existing=1`);
  const year = Number(f(form, 'class_year')) || null;
  const { data, error } = await db
    .from('people')
    .insert({ email, first_name: f(form, 'first_name') || null, last_name: f(form, 'last_name') || null, class_year: year, source: 'admin' })
    .select('id')
    .single();
  if (error || !data) return { error: error?.message ?? 'Could not add this person.' };
  const extra = f(form, 'uatx_email').toLowerCase();
  if (extra && EMAIL.test(extra) && extra !== email) await db.from('person_emails').insert({ email: extra, person_id: data.id });
  for (const kind of KINDS) {
    if (form.get(`m_${kind}`) === 'on') {
      await db.from('memberships').insert({
        person_id: data.id,
        kind,
        honorary_reason: kind === 'honorary' ? f(form, 'honorary_reason') || 'other' : null,
      });
    }
  }
  revalidatePath('/admin/people');
  redirect(`/admin/people/${data.id}?created=1`);
}

export async function updatePerson(personId: string, _p: PersonFormState, form: FormData): Promise<PersonFormState> {
  await assertStaff('admin');
  const email = f(form, 'email').toLowerCase();
  if (!EMAIL.test(email)) return { error: 'Enter a valid contact email.' };
  const db = serviceClient();
  const owner = (await db.from('person_emails').select('person_id').eq('email', email).maybeSingle()).data;
  if (owner && owner.person_id !== personId) return { error: 'That email belongs to someone else on file.' };
  const subscribed = form.get('subscribed') === 'on';
  const before = (await db.from('people').select('subscribed').eq('id', personId).single()).data;
  const { error } = await db
    .from('people')
    .update({
      email,
      first_name: f(form, 'first_name') || null,
      last_name: f(form, 'last_name') || null,
      class_year: Number(f(form, 'class_year')) || null,
      notes: f(form, 'notes') || null,
      subscribed,
      ...(before && before.subscribed !== subscribed
        ? subscribed
          ? { subscribed_at: new Date().toISOString(), unsubscribed_at: null }
          : { unsubscribed_at: new Date().toISOString() }
        : {}),
    })
    .eq('id', personId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/people/${personId}`);
  return { ok: true, message: 'Saved.' };
}

export async function addEmail(personId: string, _p: PersonFormState, form: FormData): Promise<PersonFormState> {
  await assertStaff('admin');
  const email = f(form, 'email').toLowerCase();
  if (!EMAIL.test(email)) return { error: 'Enter a valid email address.' };
  const db = serviceClient();
  const owner = (await db.from('person_emails').select('person_id').eq('email', email).maybeSingle()).data;
  if (owner) return { error: owner.person_id === personId ? 'Already listed.' : 'That email belongs to someone else on file.' };
  const { error } = await db.from('person_emails').insert({ email, person_id: personId });
  if (error) return { error: error.message };
  revalidatePath(`/admin/people/${personId}`);
  return { ok: true, message: `Added ${email}. It will count as verified once they sign in with it.` };
}

export async function removeEmail(personId: string, email: string): Promise<void> {
  await assertStaff('admin');
  const db = serviceClient();
  const person = (await db.from('people').select('email').eq('id', personId).single()).data;
  if (person?.email === email) return; // the contact address can't be removed, only changed
  await db.from('person_emails').delete().eq('email', email).eq('person_id', personId);
  revalidatePath(`/admin/people/${personId}`);
}

export async function saveMemberships(personId: string, _p: PersonFormState, form: FormData): Promise<PersonFormState> {
  const viewer = await assertStaff('admin');
  const db = serviceClient();
  const existing = (await db.from('memberships').select('id, kind').eq('person_id', personId)).data ?? [];
  for (const kind of KINDS) {
    const on = form.get(`m_${kind}`) === 'on';
    const row = existing.find((m) => m.kind === kind);
    const endsOn = f(form, `ends_${kind}`) || null;
    const fields = {
      status: (on ? 'active' : 'lapsed') as 'active' | 'lapsed',
      ends_on: kind === 'honorary' ? null : endsOn,
      honorary_reason: kind === 'honorary' ? f(form, 'honorary_reason') || 'other' : null,
      notes: f(form, `notes_${kind}`) || null,
    };
    if (row) {
      await db.from('memberships').update(fields).eq('id', row.id);
    } else if (on) {
      await db.from('memberships').insert({ person_id: personId, kind: kind as Kind, granted_by: viewer.personId, ...fields });
    }
  }
  revalidatePath(`/admin/people/${personId}`);
  revalidatePath('/admin/people');
  return { ok: true, message: 'Memberships saved.' };
}

export async function setStaffRole(personId: string, _p: PersonFormState, form: FormData): Promise<PersonFormState> {
  const viewer = await assertStaff('admin');
  const role = f(form, 'role');
  if (personId === viewer.personId && role !== 'admin') return { error: 'You can’t remove your own admin access.' };
  const db = serviceClient();
  if (role === 'none') await db.from('staff').delete().eq('person_id', personId);
  else if (role === 'admin' || role === 'editor') await db.from('staff').upsert({ person_id: personId, role });
  revalidatePath(`/admin/people/${personId}`);
  return { ok: true, message: role === 'none' ? 'Access removed.' : `Now ${role === 'admin' ? 'an admin' : 'an editor'}.` };
}

export async function deletePerson(personId: string): Promise<void> {
  const viewer = await assertStaff('admin');
  if (personId === viewer.personId) return;
  await serviceClient().from('people').delete().eq('id', personId);
  revalidatePath('/admin/people');
  redirect('/admin/people?deleted=1');
}
