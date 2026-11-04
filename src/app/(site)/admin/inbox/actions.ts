'use server';

import { revalidatePath } from 'next/cache';
import { assertStaff } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';

export async function setRead(id: string): Promise<void> {
  await assertStaff();
  await serviceClient().from('messages').update({ read_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/admin');
}

export async function setArchived(id: string, archived: boolean): Promise<void> {
  await assertStaff();
  await serviceClient()
    .from('messages')
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq('id', id);
  revalidatePath('/admin/inbox');
}
