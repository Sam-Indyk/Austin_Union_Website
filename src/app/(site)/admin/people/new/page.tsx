import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/viewer';
import { NewPersonForm } from './NewPersonForm';

export const metadata: Metadata = { title: 'Add a person' };

async function Gate() {
  await requireStaff('/admin/people/new', 'admin');
  return <NewPersonForm />;
}

export default function NewPersonPage() {
  return (
    <>
      <p className="crumbs">
        <Link href="/admin/people">People &amp; Members</Link> / Add a person
      </p>
      <header className="admin__head">
        <h1>Add a person</h1>
        <p className="muted">They don’t need an account yet — when they sign in with any of these addresses, it’s already theirs.</p>
      </header>
      <section className="panel" style={{ maxWidth: 720 }}>
        <Suspense fallback={<div style={{ minHeight: 300 }} />}>
          <Gate />
        </Suspense>
      </section>
    </>
  );
}
