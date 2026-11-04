'use client';

import { useActionState, useState } from 'react';
import { createPerson, type PersonFormState } from '../actions';

export function NewPersonForm() {
  const [state, action, pending] = useActionState<PersonFormState, FormData>(createPerson, {});
  const [honorary, setHonorary] = useState(false);
  return (
    <form action={action}>
      <div className="ui-row">
        <div className="ui-field">
          <label htmlFor="first_name">First name</label>
          <input id="first_name" name="first_name" className="ui-input" autoFocus />
        </div>
        <div className="ui-field">
          <label htmlFor="last_name">Last name</label>
          <input id="last_name" name="last_name" className="ui-input" />
        </div>
      </div>
      <div className="ui-row">
        <div className="ui-field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" className="ui-input" required placeholder="Their main address" />
        </div>
        <div className="ui-field">
          <label htmlFor="uatx_email">UATX email (optional)</label>
          <input id="uatx_email" name="uatx_email" type="email" className="ui-input" placeholder="name@student.uaustin.org" />
        </div>
      </div>
      <div className="ui-field" style={{ maxWidth: 240 }}>
        <label htmlFor="class_year">UATX class of (optional)</label>
        <input id="class_year" name="class_year" className="ui-input" inputMode="numeric" placeholder="e.g. 2028" />
      </div>
      <p className="ui-label" style={{ margin: '6px 0 10px' }}>
        Membership
      </p>
      <div className="badge-list" style={{ gap: 18, marginBottom: 18 }}>
        <label className="ui-check">
          <input type="checkbox" name="m_voting" /> <span className="badge badge--voting">Voting</span>
        </label>
        <label className="ui-check">
          <input type="checkbox" name="m_associate" /> <span className="badge badge--associate">Associate</span>
        </label>
        <label className="ui-check">
          <input type="checkbox" name="m_honorary" onChange={(e) => setHonorary(e.target.checked)} /> <span className="badge badge--honorary">Honorary</span>
        </label>
      </div>
      {honorary && (
        <div className="ui-field step-in" style={{ maxWidth: 320 }}>
          <label htmlFor="honorary_reason">Honorary because</label>
          <select id="honorary_reason" name="honorary_reason" className="ui-select" defaultValue="past_leadership">
            <option value="past_leadership">Past leadership</option>
            <option value="speaker">Speaker</option>
            <option value="alumni">Alumnus / alumna</option>
            <option value="other">Other</option>
          </select>
        </div>
      )}
      {state.error && <p className="ui-error">{state.error}</p>}
      <button className="ui-btn" type="submit" disabled={pending}>
        {pending ? 'Adding…' : 'Add person'}
      </button>
    </form>
  );
}
