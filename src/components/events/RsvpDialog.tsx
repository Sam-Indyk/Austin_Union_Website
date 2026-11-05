'use client';

import { useActionState, useEffect, useRef } from 'react';
import { rsvp, type FormState } from '@/app/actions';
import { Honeypot } from '../forms/Honeypot';

const initial: FormState = { status: 'idle' };

interface Props {
  slug: string;
  title: string;
  when: string;
  calendar: { google: string; ics: string };
  label?: string;
  className?: string;
  /** Open on load when the URL ends in #rsvp (homepage card, emails). Set on one button per page. */
  autoOpen?: boolean;
}

/** RSVP button + dialog. Every RSVP is stored on our side (and joins the mailing list). */
export function RsvpButton({ slug, title, when, calendar, label = 'RSVP', className = 'btn btn--tall', autoOpen = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(rsvp, initial);

  useEffect(() => {
    if (autoOpen && window.location.hash === '#rsvp' && !ref.current?.open) ref.current?.showModal();
  }, [autoOpen]);

  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>
        {label}
      </button>
      <dialog
        ref={ref}
        className="rsvp-dialog"
        aria-labelledby={`rsvp-title-${slug}`}
        onClick={(e) => e.target === ref.current && ref.current?.close()}
      >
        <div className="rsvp-dialog__head">
          <h2 id={`rsvp-title-${slug}`}>{state.status === 'ok' ? 'Thank you!' : 'Add your details'}</h2>
          <p>
            {title} · {when}
          </p>
          <button type="button" className="rsvp-dialog__close" onClick={() => ref.current?.close()} aria-label="Close">
            ×
          </button>
        </div>
        <div className="rsvp-dialog__body">
          {state.status === 'ok' ? (
            <div className="rsvp-done">
              <h3>{state.duplicate ? 'You’re already on the list.' : state.waitlisted ? 'You’re on the waitlist.' : 'You’re going.'}</h3>
              <p>
                {state.waitlisted
                  ? 'The event is full right now. We’ll email you if a spot opens up.'
                  : 'An email with all the event info is on its way to you.'}
              </p>
              <div className="calendar-links">
                <a href={calendar.google} target="_blank" rel="noopener noreferrer">
                  Add to Google Calendar
                </a>
                <a href={calendar.ics}>Download .ics</a>
              </div>
              {state.partnerUrl && (
                <div className="partner-step">
                  <p>
                    <strong>One more step:</strong> this event is hosted with UATX, which keeps its own guest list. Please also
                    register on their page so you’re on the door list.
                  </p>
                  <a className="btn" href={state.partnerUrl} target="_blank" rel="noopener noreferrer">
                    Complete UATX registration
                  </a>
                </div>
              )}
            </div>
          ) : (
            <form className="form-grid" action={action}>
              <input type="hidden" name="event" value={slug} />
              <div className="field">
                <label htmlFor={`rsvp-first-${slug}`}>First name *</label>
                <input id={`rsvp-first-${slug}`} name="firstName" autoComplete="given-name" required maxLength={80} />
              </div>
              <div className="field">
                <label htmlFor={`rsvp-last-${slug}`}>Last name *</label>
                <input id={`rsvp-last-${slug}`} name="lastName" autoComplete="family-name" required maxLength={80} />
              </div>
              <div className="field field--full">
                <label htmlFor={`rsvp-email-${slug}`}>Email *</label>
                <input id={`rsvp-email-${slug}`} name="email" type="email" autoComplete="email" required maxLength={254} />
              </div>
              <Honeypot />
              {state.status === 'error' && <p className="form-error field--full">{state.message}</p>}
              <p className="form-note field--full">You’ll also receive Austin Union event announcements. Unsubscribe anytime.</p>
              <div className="form-actions field--full">
                <button className="btn" type="submit" disabled={pending}>
                  {pending ? 'Submitting…' : 'SUBMIT'}
                </button>
              </div>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
