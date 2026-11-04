'use client';

import { useActionState } from 'react';
import { sendMessage, type FormState } from '@/app/actions';
import { Honeypot } from './Honeypot';

const initial: FormState = { status: 'idle' };

/**
 * Message form. Two layouts match the two Wix forms:
 *  - "page": the Contact page (three fields in a row, wide message box, red Send button)
 *  - "mission": the Mission page footer form (two columns, transparent Send link)
 */
export function ContactForm({ variant, page }: { variant: 'page' | 'mission'; page: string }) {
  const [state, action, pending] = useActionState(sendMessage, initial);
  const id = (n: string) => `${variant}-${n}`;
  const status = (
    <p className="form-status" role="status" aria-live="polite">
      {state.status === 'error' ? <span className="form-error">{state.message}</span> : state.message}
    </p>
  );

  if (variant === 'mission') {
    return (
      <form className="contact-form" action={action}>
        <input type="hidden" name="page" value={page} />
        <div className="col">
          <div className="field">
            <label htmlFor={id('first')}>First Name</label>
            <input id={id('first')} name="firstName" autoComplete="given-name" maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor={id('last')}>Last Name</label>
            <input id={id('last')} name="lastName" autoComplete="family-name" maxLength={80} />
          </div>
          <div className="field">
            <label htmlFor={id('email')}>Email *</label>
            <input id={id('email')} name="email" type="email" autoComplete="email" required maxLength={254} />
          </div>
        </div>
        <div className="col">
          <div className="field">
            <label htmlFor={id('message')}>Message</label>
            <textarea id={id('message')} name="message" required maxLength={5000} />
          </div>
        </div>
        <Honeypot />
        <button className="contact-form__send" type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send'}
        </button>
        {status}
      </form>
    );
  }

  return (
    <form className="form-grid" action={action}>
      <input type="hidden" name="page" value={page} />
      <div className="field">
        <label htmlFor={id('first')}>First Name</label>
        <input id={id('first')} name="firstName" autoComplete="given-name" maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor={id('last')}>Last Name</label>
        <input id={id('last')} name="lastName" autoComplete="family-name" maxLength={80} />
      </div>
      <div className="field">
        <label htmlFor={id('email')}>Email *</label>
        <input id={id('email')} name="email" type="email" autoComplete="email" required maxLength={254} />
      </div>
      <div className="field field--full">
        <label htmlFor={id('message')}>Message</label>
        <textarea id={id('message')} name="message" required maxLength={5000} />
      </div>
      <Honeypot />
      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send'}
        </button>
      </div>
      {status}
    </form>
  );
}
