'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/votes', label: 'Votes' },
  { href: '/admin/people', label: 'People & Members' },
  { href: '/admin/inbox', label: 'Inbox' },
];

export function AdminNavWithPath() {
  return <AdminNav path={usePathname()} />;
}

export function AdminNav({ path }: { path: string | null }) {
  return (
    <nav className="admin__tabs" aria-label="Admin">
      {TABS.map((t) => {
        const active = path !== null && (t.exact ? path === t.href : path.startsWith(t.href));
        return (
          <Link key={t.href} href={t.href} aria-current={active ? 'page' : undefined}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
