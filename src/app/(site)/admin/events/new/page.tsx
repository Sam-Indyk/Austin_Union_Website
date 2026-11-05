import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/viewer';
import { EventForm, NEW_EVENT } from '../EventForm';

export const metadata: Metadata = { title: 'Create an event' };

async function Form() {
  await requireStaff('/admin/events/new');
  return <EventForm eventId={null} values={NEW_EVENT} isPast={false} published={false} />;
}

export default function NewEventPage() {
  return (
    <>
      <p className="crumbs">
        <Link href="/admin/events">Events</Link> / New
      </p>
      <header className="admin__head">
        <h1>Create an event</h1>
        <p className="muted">A photo, a description, a time and a place — the website does the rest.</p>
      </header>
      <Suspense fallback={<div className="admin-skeleton" />}>
        <Form />
      </Suspense>
    </>
  );
}
