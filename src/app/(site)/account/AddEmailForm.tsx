'use client';

import { useActionState, useState } from 'react';
import { sendLinkCode, verifyLinkCode, type LinkState } from '@/app/auth/actions';

/** Add another address (personal, UATX, …) so every login reaches the same account. */
export function AddEmailForm() {
  const [open, setOpen] = useState(false);
  const [sent, send, sending] = useActionState<LinkState, FormData>(sendLinkCode, { step: 'email' });
  const [done, verify, verifying] = useActionState<LinkState, FormData>(verifyLinkCode, { step: 'code' });

  if (!open) {
    return (
      <button type="button" className="ui-btn ui-btn--ghost ui-btn--small" onClick={() => setOpen(true)}>
        + Add another email
      </button>
    );
  }

  if (done.step === 'done') {
    return <p className={done.error ? 'ui-error' : 'ui-notice'}>{done.error ?? done.message}</p>;
  }

  if (sent.step === 'code') {
    return (
      <form action={verify} className="step-in">
        <input type="hidden" name="email" value={sent.email} />
        <div className="ui-field">
          <label htmlFor="link-code">Code sent to {sent.email}</label>
          <input id="link-code" name="code" className="ui-input ui-input--code" inputMode="numeric" autoComplete="one-time-code" maxLength={7} required autoFocus />
        </div>
        {(done.error || sent.error) && <p className="ui-error">{done.error ?? sent.error}</p>}
        <button className="ui-btn ui-btn--block" type="submit" disabled={verifying}>
          {verifying ? 'Checking…' : 'Verify and add'}
        </button>
      </form>
    );
  }

  return (
    <form action={send} className="step-in">
      <div className="ui-field">
        <label htmlFor="link-email">Another email address</label>
        <input id="link-email" name="email" type="email" className="ui-input" placeholder="you@student.uaustin.org" required autoFocus />
        <span className="ui-hint">We’ll send a code to confirm it’s yours.</span>
      </div>
      {sent.error && <p className="ui-error">{sent.error}</p>}
      <button className="ui-btn ui-btn--block" type="submit" disabled={sending}>
        {sending ? 'Sending…' : 'Send code'}
      </button>
    </form>
  );
}
