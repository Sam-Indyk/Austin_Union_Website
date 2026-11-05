'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { loadEditorData, type EditorData } from '@/app/(site)/edit/actions';
import { EditorPanel } from './editors';

const hasSession = () => /(?:^|;\s*)sb-[^=]+-auth-token(?:\.0)?=/.test(document.cookie);

/**
 * On-page editing for officers. Public pages carry `data-edit` markers on the
 * blocks that can be changed; in edit mode they light up on hover, and clicking
 * one opens a panel for exactly that block. Nothing here loads for visitors.
 */
export function EditMode() {
  const [staff, setStaff] = useState(false);
  const [editing, setEditing] = useState(false);
  const [active, setActive] = useState<{ key: string; label: string; path: string } | null>(null);
  const [data, setData] = useState<EditorData | null>(null);
  const [, startLoad] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  // Only ask the server if there's a session cookie at all.
  useEffect(() => {
    if (!hasSession()) return;
    let alive = true;
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => r.json())
      .then((me) => alive && setStaff(Boolean(me.staff)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const reload = useCallback(() => startLoad(async () => setData(await loadEditorData())), []);

  useEffect(() => {
    document.documentElement.classList.toggle('is-editing', editing);
    if (!editing) return;
    if (!data) reload();
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>('[data-edit]');
      if (!target || (e.target as HTMLElement).closest('.edit-ui')) return;
      e.preventDefault();
      e.stopPropagation();
      setActive({ key: target.dataset.edit!, label: target.dataset.editLabel ?? 'Edit', path: location.pathname });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive((a) => (a ? null : (setEditing(false), null)));
    };
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [editing, data, reload]);

  if (!staff || pathname.startsWith('/admin')) return null;

  return (
    <div className="edit-ui">
      <div className={`edit-bar${editing ? ' is-on' : ''}`} role="toolbar" aria-label="Officer tools">
        <button type="button" className="edit-bar__main" onClick={() => setEditing(!editing)} aria-pressed={editing}>
          <span aria-hidden="true">✎</span> {editing ? 'Done editing' : 'Edit this page'}
        </button>
        {editing && <span className="edit-bar__hint">Click any outlined block to change it.</span>}
        <Link href="/admin" className="edit-bar__link">
          Officers’ Desk
        </Link>
      </div>
      {/* A panel belongs to the page it was opened on; navigating away closes it. */}
      {editing && active && active.path === pathname && (
        <EditorPanel
          key={active.key}
          target={active}
          data={data}
          onClose={() => setActive(null)}
          onSaved={() => {
            router.refresh();
            reload();
          }}
        />
      )}
    </div>
  );
}
