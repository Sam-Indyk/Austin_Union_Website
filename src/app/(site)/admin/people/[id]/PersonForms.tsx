'use client';

import { useActionState, useState, useTransition } from 'react';
import { addEmail, deletePerson, removeEmail, saveMemberships, setStaffRole, updatePerson, type PersonFormState } from '../actions';

const init: PersonFormState = {};

function Status({ state }: { state: PersonFormState }) {
  if (state.error) return <p className="ui-error">{state.error}</p>;
  if (state.message) return <p className="ui-notice">{state.message}</p>;
  return null;
}

export function PersonDetailsForm({
  personId,
  person,
  disabled,
}: {
  personId: string;
  person: { first_name: string; last_name: string; email: string; class_year: string; subscribed: boolean; notes: string };
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(updatePerson.bind(null, personId), init);
  return (
    <form action={action}>
      <fieldset disabled={disabled} className="bare">
        <div className="ui-row">
          <div className="ui-field">
            <label htmlFor="first_name">First name</label>
            <input id="first_name" name="first_name" className="ui-input" defaultValue={person.first_name} />
          </div>
          <div className="ui-field">
            <label htmlFor="last_name">Last name</label>
            <input id="last_name" name="last_name" className="ui-input" defaultValue={person.last_name} />
          </div>
        </div>
        <div className="ui-row">
          <div className="ui-field">
            <label htmlFor="email">Contact email</label>
            <input id="email" name="email" type="email" className="ui-input" defaultValue={person.email} required />
            <span className="ui-hint">Where announcements are sent.</span>
          </div>
          <div className="ui-field">
            <label htmlFor="class_year">UATX class of</label>
            <input id="class_year" name="class_year" className="ui-input" inputMode="numeric" placeholder="e.g. 2028" defaultValue={person.class_year} />
            <span className="ui-hint">Voting membership ends June 1 of this year.</span>
          </div>
        </div>
        <label className="ui-check" style={{ marginBottom: 16 }}>
          <input type="checkbox" name="subscribed" defaultChecked={person.subscribed} /> On the mailing list
        </label>
        <div className="ui-field">
          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" className="ui-textarea" defaultValue={person.notes} placeholder="Only officers can see this." />
        </div>
        <Status state={state} />
        <button className="ui-btn" type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save details'}
        </button>
      </fieldset>
    </form>
  );
}

interface M {
  kind: 'voting' | 'associate' | 'honorary';
  status: string;
  ends_on: string;
  honorary_reason: string;
  notes: string;
}

export function MembershipEditor({
  personId,
  memberships,
  disabled,
  verifiedStudent,
  classYear,
}: {
  personId: string;
  memberships: M[];
  disabled: boolean;
  verifiedStudent: boolean;
  classYear: number | null;
}) {
  const [state, action, pending] = useActionState(saveMemberships.bind(null, personId), init);
  const get = (k: M['kind']) => memberships.find((m) => m.kind === k);
  const [on, setOn] = useState({
    voting: get('voting')?.status === 'active',
    associate: get('associate')?.status === 'active',
    honorary: get('honorary')?.status === 'active',
  });
  const KINDS: { kind: M['kind']; title: string; help: string }[] = [
    { kind: 'voting', title: 'Voting member', help: 'UATX student. Votes in Union elections.' },
    { kind: 'associate', title: 'Associate member', help: 'Paid or outside member. Access to members’ events.' },
    { kind: 'honorary', title: 'Honorary member', help: 'Past leadership, speakers and alumni. Never expires.' },
  ];
  return (
    <form action={action}>
      <fieldset disabled={disabled} className="bare">
        {KINDS.map(({ kind, title, help }) => {
          const m = get(kind);
          return (
            <div key={kind} className={`member-kind${on[kind] ? ' is-on' : ''}`}>
              <label className="ui-check">
                <input type="checkbox" name={`m_${kind}`} checked={on[kind]} onChange={(e) => setOn({ ...on, [kind]: e.target.checked })} />
                <span>
                  <span className={`badge badge--${on[kind] ? kind : 'muted'}`}>{title}</span>
                  <span className="ui-hint" style={{ display: 'block', marginTop: 6 }}>
                    {help}
                  </span>
                </span>
              </label>
              {on[kind] && (
                <div className="member-kind__fields step-in">
                  {kind === 'voting' && !verifiedStudent && (
                    <p className="ui-notice small">No verified UATX email yet — they can add one from their account page (or sign in with Google).</p>
                  )}
                  {kind === 'honorary' ? (
                    <div className="ui-field">
                      <label htmlFor="honorary_reason">Reason</label>
                      <select id="honorary_reason" name="honorary_reason" className="ui-select" defaultValue={m?.honorary_reason || 'past_leadership'}>
                        <option value="past_leadership">Past leadership</option>
                        <option value="speaker">Speaker</option>
                        <option value="alumni">Alumnus / alumna</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  ) : (
                    <div className="ui-field">
                      <label htmlFor={`ends_${kind}`}>{kind === 'voting' ? 'Ends on' : 'Renews / ends on'}</label>
                      <input id={`ends_${kind}`} name={`ends_${kind}`} type="date" className="ui-input" defaultValue={m?.ends_on} />
                      <span className="ui-hint">
                        {kind === 'voting'
                          ? classYear
                            ? `Leave blank to end June 1, ${classYear} (class year).`
                            : 'Leave blank if unknown; set a class year above to end it automatically.'
                          : 'Leave blank for no end date.'}
                      </span>
                    </div>
                  )}
                  <div className="ui-field">
                    <label htmlFor={`notes_${kind}`}>Note</label>
                    <input id={`notes_${kind}`} name={`notes_${kind}`} className="ui-input" defaultValue={m?.notes} placeholder="Optional" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <Status state={state} />
        <button className="ui-btn" type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save memberships'}
        </button>
      </fieldset>
    </form>
  );
}

export function EmailsEditor({
  personId,
  contactEmail,
  emails,
  disabled,
}: {
  personId: string;
  contactEmail: string;
  emails: { email: string; verified: boolean }[];
  disabled: boolean;
}) {
  const [state, action, pending] = useActionState(addEmail.bind(null, personId), init);
  const [removing, startRemove] = useTransition();
  return (
    <>
      <p className="prose small" style={{ marginBottom: 8 }}>
        They can sign in with any of these. Verified means they’ve signed in with it or confirmed a code.
      </p>
      <ul className="email-list">
        {emails.map((e) => (
          <li key={e.email}>
            <span>
              {e.email}
              {e.email === contactEmail && <span className="muted small"> · contact</span>}
            </span>
            <span>
              {e.verified ? <span className="verified">✓ Verified</span> : <span className="unverified">Unverified</span>}
              {!disabled && e.email !== contactEmail && (
                <button
                  type="button"
                  className="ui-link small"
                  style={{ marginLeft: 12 }}
                  disabled={removing}
                  onClick={() => confirm(`Remove ${e.email}?`) && startRemove(() => removeEmail(personId, e.email))}
                >
                  Remove
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      {!disabled && (
        <form action={action} className="inline-form">
          <input name="email" type="email" className="ui-input" placeholder="Add another address" required aria-label="Add another email address" />
          <button className="ui-btn ui-btn--ink" type="submit" disabled={pending}>
            Add
          </button>
        </form>
      )}
      <Status state={state} />
    </>
  );
}

export function StaffEditor({ personId, role, disabled, self }: { personId: string; role: 'admin' | 'editor' | 'none'; disabled: boolean; self: boolean }) {
  const [state, action, pending] = useActionState(setStaffRole.bind(null, personId), init);
  return (
    <form action={action}>
      <fieldset disabled={disabled} className="bare">
        {(
          [
            ['none', 'No admin access', 'A regular member or guest.'],
            ['editor', 'Editor', 'Can edit pages, events, votes and read the inbox.'],
            ['admin', 'Admin', 'Everything, including people, memberships and access.'],
          ] as const
        ).map(([value, title, help]) => (
          <label key={value} className="ui-check" style={{ marginBottom: 10 }}>
            <input type="radio" name="role" value={value} defaultChecked={role === value} disabled={self && value !== 'admin'} />
            <span>
              <strong style={{ fontWeight: 500 }}>{title}</strong>
              <span className="ui-hint" style={{ display: 'block' }}>
                {help}
              </span>
            </span>
          </label>
        ))}
        <Status state={state} />
        <button className="ui-btn ui-btn--ink" type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Update access'}
        </button>
      </fieldset>
    </form>
  );
}

export function DeletePerson({ personId, name }: { personId: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="ui-btn ui-btn--ghost ui-btn--block"
      style={{ marginTop: 22 }}
      disabled={pending}
      onClick={() => confirm(`Delete ${name}? This removes their record, memberships and RSVP history.`) && start(() => deletePerson(personId))}
    >
      Delete this person
    </button>
  );
}
