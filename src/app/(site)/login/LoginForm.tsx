'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { sendSignInCode, signInWithGoogle, verifySignInCode, type AuthState } from '@/app/auth/actions';

const GoogleMark = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
  </svg>
);

export function LoginForm({ next, initialError, googleEnabled }: { next: string; initialError?: string; googleEnabled: boolean }) {
  const [sent, send, sending] = useActionState<AuthState, FormData>(sendSignInCode, { step: 'email', error: initialError });
  const [verified, verify, verifying] = useActionState<AuthState, FormData>(verifySignInCode, { step: 'code' });
  const [editingEmail, setEditingEmail] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const onCodeStep = sent.step === 'code' && !editingEmail;
  useEffect(() => {
    if (onCodeStep) codeRef.current?.focus();
  }, [onCodeStep, sent]);

  if (onCodeStep) {
    const error = verified.error;
    return (
      <div className="step-in" key="code">
        <h2>Check your email</h2>
        <p className="prose" style={{ marginBottom: 20 }}>
          {sent.message} Enter it below — or tap the link in that email to sign in on this device.
        </p>
        <form action={verify}>
          <input type="hidden" name="email" value={sent.email} />
          <input type="hidden" name="next" value={next} />
          <div className="ui-field">
            <label htmlFor="code">6-digit code</label>
            <input
              ref={codeRef}
              id="code"
              name="code"
              className="ui-input ui-input--code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]{6,7}"
              maxLength={7}
              required
            />
          </div>
          {error && <p className="ui-error">{error}</p>}
          <button className="ui-btn ui-btn--block" type="submit" disabled={verifying}>
            {verifying ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <div className="prose small" style={{ marginTop: 18, textAlign: 'center' }}>
          <button type="button" className="ui-link" onClick={() => setEditingEmail(true)}>
            Use a different email
          </button>
          {'  ·  '}
          <form action={send} style={{ display: 'inline' }}>
            <input type="hidden" name="email" value={sent.email} />
            <button type="submit" className="ui-link" disabled={sending}>
              {sending ? 'Sending…' : 'Send a new code'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="step-in" key="email">
      {googleEnabled && (
        <>
          <form action={signInWithGoogle}>
            <input type="hidden" name="next" value={next} />
            <button type="submit" className="ui-btn ui-btn--google ui-btn--block">
              <GoogleMark /> Continue with Google
            </button>
          </form>
          <p className="ui-hint" style={{ marginTop: 8, textAlign: 'center' }}>
            UATX students: use your uaustin.org Google account to verify your student status.
          </p>
          <div className="or-rule">or</div>
        </>
      )}
      <form action={(f) => { setEditingEmail(false); send(f); }}>
        <div className="ui-field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            className="ui-input"
            autoComplete="email"
            defaultValue={sent.email}
            placeholder="you@example.com"
            required
            autoFocus={!googleEnabled}
          />
          <span className="ui-hint">We’ll email you a 6-digit code. No password needed.</span>
        </div>
        {sent.error && <p className="ui-error">{sent.error}</p>}
        <button className="ui-btn ui-btn--block" type="submit" disabled={sending}>
          {sending ? 'Sending…' : 'Email me a code'}
        </button>
      </form>
    </div>
  );
}
