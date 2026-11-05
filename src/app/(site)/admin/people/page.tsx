import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { requireStaff } from '@/lib/auth/viewer';
import { serviceClient } from '@/lib/supabase/clients';

export const metadata: Metadata = { title: 'People' };

const FILTERS = [
  ['all', 'Everyone'],
  ['members', 'All members'],
  ['voting', 'Voting'],
  ['associate', 'Associate'],
  ['honorary', 'Honorary'],
  ['staff', 'Officers & staff'],
  ['subscribers', 'Mailing list'],
] as const;

const LABEL = { voting: 'Voting', associate: 'Associate', honorary: 'Honorary' } as const;

async function People({ searchParams }: { searchParams: PageProps<'/admin/people'>['searchParams'] }) {
  const viewer = await requireStaff('/admin/people');
  const sp = await searchParams;
  const q = (typeof sp.q === 'string' ? sp.q : '').trim().toLowerCase();
  const filter = typeof sp.filter === 'string' ? sp.filter : 'all';
  const { data } = await serviceClient()
    .from('people')
    .select('id, first_name, last_name, email, subscribed, class_year, source, created_at, memberships!memberships_person_id_fkey(kind, status, ends_on), staff(role), person_emails(email)')
    .order('last_name', { ascending: true, nullsFirst: false })
    .order('first_name', { ascending: true, nullsFirst: false });

  const today = new Date().toISOString().slice(0, 10);
  const rows = (data ?? []).map((p) => {
    const current = (p.memberships ?? []).filter((m) => m.status === 'active' && (!m.ends_on || m.ends_on >= today)).map((m) => m.kind);
    const staff = Array.isArray(p.staff) ? p.staff[0] : p.staff;
    return { ...p, current, staffRole: staff?.role as string | undefined, name: [p.first_name, p.last_name].filter(Boolean).join(' ') };
  });
  const filtered = rows.filter((p) => {
    if (q && !`${p.name} ${(p.person_emails ?? []).map((e) => e.email).join(' ')}`.toLowerCase().includes(q)) return false;
    switch (filter) {
      case 'members':
        return p.current.length > 0;
      case 'voting':
      case 'associate':
      case 'honorary':
        return p.current.includes(filter);
      case 'staff':
        return Boolean(p.staffRole);
      case 'subscribers':
        return p.subscribed;
      default:
        return true;
    }
  });
  const flash = sp.deleted ? 'Person deleted.' : null;

  return (
    <>
      <header className="admin__head admin__head--row">
        <div>
          <h1>People &amp; Members</h1>
          <p className="muted">
            {rows.length} people on file · {rows.filter((r) => r.current.length).length} current members
          </p>
        </div>
        {viewer.staffRole === 'admin' && (
          <div className="badge-list" style={{ gap: 10 }}>
            <Link href="/admin/people/import" className="ui-btn ui-btn--ghost">
              Import from Wix
            </Link>
            <Link href="/admin/people/new" className="ui-btn">
              Add a person
            </Link>
          </div>
        )}
      </header>
      {flash && <p className="ui-notice">{flash}</p>}

      <form className="toolbar" role="search">
        <input className="ui-input" name="q" defaultValue={q} placeholder="Search names and emails…" aria-label="Search" />
        <input type="hidden" name="filter" value={filter} />
        <button className="ui-btn ui-btn--ink" type="submit">
          Search
        </button>
      </form>
      <nav className="chips" aria-label="Filter">
        {FILTERS.map(([key, label]) => (
          <Link key={key} href={`/admin/people?filter=${key}${q ? `&q=${encodeURIComponent(q)}` : ''}`} aria-current={filter === key ? 'true' : undefined}>
            {label}
          </Link>
        ))}
      </nav>

      <div className="table-wrap panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Membership</th>
              <th>List</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Nobody matches.
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/people/${p.id}`} className="table__primary">
                    {p.name || <span className="muted">(no name)</span>}
                  </Link>
                  {p.staffRole && <span className={`badge badge--${p.staffRole}`}>{p.staffRole === 'admin' ? 'Admin' : 'Editor'}</span>}
                </td>
                <td className="table__email">{p.email}</td>
                <td>
                  <span className="badge-list">
                    {p.current.map((k) => (
                      <span key={k} className={`badge badge--${k}`}>
                        {LABEL[k]}
                        {k === 'voting' && p.class_year ? ` ’${String(p.class_year).slice(2)}` : ''}
                      </span>
                    ))}
                  </span>
                </td>
                <td>{p.subscribed ? '✓' : <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function PeoplePage({ searchParams }: PageProps<'/admin/people'>) {
  return (
    <Suspense fallback={<div className="admin-skeleton" />}>
      <People searchParams={searchParams} />
    </Suspense>
  );
}
