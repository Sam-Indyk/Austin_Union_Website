'use client';

import { useState, useTransition } from 'react';
import { setArchived, setRead } from './actions';

export function InboxItem(p: { id: string; name: string; email: string; body: string; when: string; from: string; unread: boolean; archived: boolean }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(p.unread);
  const [gone, setGone] = useState(false);
  const [, start] = useTransition();
  if (gone) return null;
  return (
    <article className={`inbox__item panel${unread ? ' is-unread' : ''}`}>
      <button
        type="button"
        className="inbox__summary"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          if (unread) {
            setUnread(false);
            start(() => setRead(p.id));
          }
        }}
      >
        <span className="inbox__from">{p.name}</span>
        <span className="inbox__snippet">{p.body.slice(0, 110)}</span>
        <span className="inbox__when">{p.when}</span>
      </button>
      {open && (
        <div className="inbox__body step-in">
          <p className="muted small">
            {p.email} · via {p.from}
          </p>
          <p className="prose" style={{ whiteSpace: 'pre-wrap', margin: '10px 0 16px' }}>
            {p.body}
          </p>
          <div className="badge-list">
            <a className="ui-btn ui-btn--small" href={`mailto:${p.email}?subject=${encodeURIComponent('Re: your message to the Austin Union')}`}>
              Reply by email
            </a>
            <button
              type="button"
              className="ui-btn ui-btn--ghost ui-btn--small"
              onClick={() => {
                setGone(true);
                start(() => setArchived(p.id, !p.archived));
              }}
            >
              {p.archived ? 'Move to inbox' : 'Archive'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
