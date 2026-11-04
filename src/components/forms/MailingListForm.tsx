'use client';

import { useActionState } from 'react';
import { subscribe, type FormState } from '@/app/actions';
import { Honeypot } from './Honeypot';

const initial: FormState = { status: 'idle' };

export function MailingListForm() {
  const [state, action, pending] = useActionState(subscribe, initial);
  return (
    <section className="mailing" id="mailing-list" aria-labelledby="mailing-title">
      <form className="mailing__form" action={action}>
        <h2 className="mailing__title" id="mailing-title">
          JOIN OUR MAILING LIST
        </h2>
        <div className="field">
          <label htmlFor="ml-first">
            First Name<span className="req">*</span>
          </label>
          <input id="ml-first" name="firstName" autoComplete="given-name" required maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="ml-last">
            Last Name<span className="req">*</span>
          </label>
          <input id="ml-last" name="lastName" autoComplete="family-name" required maxLength={80} />
        </div>
        <div className="field field--full">
          <label htmlFor="ml-email">
            Email<span className="req">*</span>
          </label>
          <input id="ml-email" name="email" type="email" autoComplete="email" required maxLength={254} />
        </div>
        <Honeypot />
        <button className="mailing__submit" type="submit" disabled={pending}>
          {pending ? 'Signing Up…' : 'Sign Up'}
        </button>
        <p className={`form-status${state.status === 'error' ? ' form-status--error' : ''}`} role="status" aria-live="polite">
          {state.message}
        </p>
      </form>
    </section>
  );
}
