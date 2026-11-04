import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';
import { NEW_VOTE, VoteForm } from '../VoteForm';

export const metadata: Metadata = { title: 'Create a vote' };

async function Form() {
  await requireStaff('/admin/votes/new');
  const { data } = await serviceClient().from('events').select('id, title').order('starts_at', { ascending: false }).limit(30);
  return <VoteForm voteId={null} values={NEW_VOTE} events={data ?? []} locked={false} />;
}

export default function NewVotePage() {
  return (
    <>
      <p className="crumbs">
        <Link href="/admin/votes">Votes</Link> / New
      </p>
      <header className="admin__head">
        <h1>Create a vote</h1>
        <p className="muted">Set it up now; it stays hidden until you open it.</p>
      </header>
      <Suspense fallback={<div className="admin-skeleton" />}>
        <Form />
      </Suspense>
    </>
  );
}
