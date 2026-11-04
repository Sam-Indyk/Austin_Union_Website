'use client';

import { usePathname } from 'next/navigation';
import { useActionState, useEffect, useRef, useState } from 'react';
import { sendMessage, type FormState } from '@/app/actions';
import { ChatIcon } from '../icons';
import { Honeypot } from './Honeypot';

const initial: FormState = { status: 'idle' };

/** Replaces the Wix "Let's Chat!" widget: a small message box that lands in the admin inbox. */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(sendMessage, initial);
  const pathname = usePathname();
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) firstField.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <button type="button" className="chat-launcher" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <ChatIcon />
        <span>Let&apos;s Chat!</span>
      </button>
    );
  }

  return (
    <div className="chat-panel" role="dialog" aria-label="Send us a message" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <div className="chat-panel__head">
        <span>Let&apos;s Chat!</span>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close">
          ×
        </button>
      </div>
      <div className="chat-panel__body">
        {state.status === 'ok' ? (
          <p>Thanks for your message — we&apos;ll get back to you by email soon.</p>
        ) : (
          <>
            <p>Leave us a message and we&apos;ll reply by email.</p>
            <form className="form-grid" action={action}>
              <input type="hidden" name="page" value={pathname} />
              <div className="field">
                <label htmlFor="chat-name">Name</label>
                <input ref={firstField} id="chat-name" name="name" autoComplete="name" maxLength={160} />
              </div>
              <div className="field">
                <label htmlFor="chat-email">Email *</label>
                <input id="chat-email" name="email" type="email" autoComplete="email" required maxLength={254} />
              </div>
              <div className="field">
                <label htmlFor="chat-message">Message *</label>
                <textarea id="chat-message" name="message" required maxLength={5000} />
              </div>
              <Honeypot />
              {state.status === 'error' && <p className="form-error">{state.message}</p>}
              <div className="form-actions">
                <button className="btn" type="submit" disabled={pending}>
                  {pending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
