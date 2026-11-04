import type { Metadata } from 'next';
import { Suspense, type ReactNode } from 'react';
import { AdminNav, AdminNavWithPath } from './AdminNav';

export const metadata: Metadata = { title: { default: 'ADMIN', template: '%s · ADMIN | Austin Union' }, robots: { index: false } };

// Chrome only. Each admin page checks permissions itself (layouts and pages
// render in parallel, so a check here would not protect the page).
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin">
      <div className="admin__bar">
        <div className="admin__bar-inner">
          <span className="admin__brand">Officers’ Desk</span>
          <Suspense fallback={<AdminNav path={null} />}>
            <AdminNavWithPath />
          </Suspense>
        </div>
      </div>
      <div className="admin__body">{children}</div>
    </div>
  );
}
