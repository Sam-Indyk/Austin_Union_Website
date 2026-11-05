'use client';

import { useActionState, useState } from 'react';
import { ImageField } from '@/components/admin/ImageField';
import { RichEditor } from '@/components/admin/RichEditor';
import type { ImageRef } from '@/lib/content/types';
import { saveEvent, type EventFormState } from './actions';

export interface EventFormValues {
  title: string;
  slug: string;
  summary: string;
  description: string;
  date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  location_name: string;
  address: string;
  image: ImageRef | null;
  status: 'draft' | 'published' | 'cancelled';
  publish_date: string;
  publish_time: string;
  visibility: 'public' | 'members' | 'unlisted';
  member_kinds: string[];
  rsvp_mode: 'native' | 'none';
  capacity: string;
  closes_date: string;
  closes_time: string;
  partner_url: string;
  swoogo_event_id: string;
  feature_on_home: boolean;
  card_title: string;
  card_subtitle: string;
  announce: boolean;
  reminder_hours: string;
  recap_summary: string;
  recap_youtube: string;
  recap_photos: ImageRef[];
}

export const NEW_EVENT: EventFormValues = {
  title: '',
  slug: '',
  summary: '',
  description: '',
  date: '',
  start_time: '18:00',
  end_date: '',
  end_time: '20:00',
  location_name: '',
  address: '',
  image: null,
  status: 'published',
  publish_date: '',
  publish_time: '',
  visibility: 'public',
  member_kinds: [],
  rsvp_mode: 'native',
  capacity: '',
  closes_date: '',
  closes_time: '',
  partner_url: '',
  swoogo_event_id: '',
  feature_on_home: true,
  card_title: '',
  card_subtitle: '',
  announce: true,
  reminder_hours: '24',
  recap_summary: '',
  recap_youtube: '',
  recap_photos: [],
};

function Choice({ name, value, checked, onChange, title, help }: { name: string; value: string; checked: boolean; onChange: (v: string) => void; title: string; help: string }) {
  return (
    <label className={`choice${checked ? ' is-on' : ''}`}>
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} />
      <span>
        <span className="choice__title">{title}</span>
        <span className="choice__help">{help}</span>
      </span>
    </label>
  );
}

export function EventForm({ eventId, values, isPast, published }: { eventId: string | null; values: EventFormValues; isPast: boolean; published: boolean }) {
  const [state, action, pending] = useActionState<EventFormState, FormData>(saveEvent.bind(null, eventId), {});
  const [status, setStatus] = useState(values.status);
  const [visibility, setVisibility] = useState(values.visibility);
  const [rsvp, setRsvp] = useState(values.rsvp_mode);
  const [schedule, setSchedule] = useState(Boolean(values.publish_date));
  const [multiDay, setMultiDay] = useState(Boolean(values.end_date && values.end_date !== values.date));
  const [recapPhotos, setRecapPhotos] = useState(values.recap_photos);
  const [showRecap, setShowRecap] = useState(isPast || values.recap_photos.length > 0 || Boolean(values.recap_youtube || values.recap_summary));
  const [title, setTitle] = useState(values.title);

  return (
    <form action={action} className="vote-form">
      <section className="panel">
        <h2>The event</h2>
        <div className="ui-field">
          <label htmlFor="title">Title</label>
          <input id="title" name="title" className="ui-input ui-input--lg" defaultValue={values.title} onChange={(e) => setTitle(e.target.value)} placeholder="Open Forum: Is America Still a Republic?" required />
        </div>
        <div className="ui-field">
          <label htmlFor="summary">Summary</label>
          <textarea id="summary" name="summary" className="ui-textarea" style={{ minHeight: 90 }} defaultValue={values.summary} placeholder="One or two sentences. Shown under the title, on the Events page and in the announcement email." maxLength={600} />
        </div>
        <div className="ui-field">
          <span className="ui-label">Full description</span>
          <RichEditor name="description" defaultValue={values.description} placeholder="Schedule, dress code, speakers, image credit…" />
        </div>
        <details className="disclose">
          <summary>Homepage card wording &amp; link</summary>
          <div className="ui-row" style={{ marginTop: 14 }}>
            <div className="ui-field">
              <label htmlFor="card_title">Card title</label>
              <input id="card_title" name="card_title" className="ui-input" defaultValue={values.card_title} placeholder={title || 'Defaults to the event title'} />
            </div>
            <div className="ui-field">
              <label htmlFor="card_subtitle">Card subtitle</label>
              <input id="card_subtitle" name="card_subtitle" className="ui-input" defaultValue={values.card_subtitle} placeholder="e.g. A Debate between …" />
            </div>
          </div>
          <div className="ui-field">
            <label htmlFor="slug">Web address</label>
            <div className="slug-field">
              <span>austinunion.org/events/</span>
              <input id="slug" name="slug" className="ui-input" defaultValue={values.slug} placeholder="made from the title" disabled={published} />
            </div>
            {published && <span className="ui-hint">Fixed once published, so shared links keep working.</span>}
          </div>
        </details>
      </section>

      <section className="panel">
        <h2>When &amp; where</h2>
        <div className="ui-row">
          <div className="ui-field">
            <label htmlFor="date">Date</label>
            <input id="date" name="date" type="date" className="ui-input" defaultValue={values.date} required />
          </div>
          <div className="ui-field">
            <label htmlFor="start_time">Starts</label>
            <input id="start_time" name="start_time" type="time" className="ui-input" defaultValue={values.start_time} required />
          </div>
          {multiDay && (
            <div className="ui-field step-in">
              <label htmlFor="end_date">End date</label>
              <input id="end_date" name="end_date" type="date" className="ui-input" defaultValue={values.end_date} />
            </div>
          )}
          <div className="ui-field">
            <label htmlFor="end_time">Ends</label>
            <input id="end_time" name="end_time" type="time" className="ui-input" defaultValue={values.end_time} required />
          </div>
        </div>
        <p className="ui-hint" style={{ marginTop: -8, marginBottom: 14 }}>
          Austin time. The event moves to Past Events when it ends.{' '}
          <button type="button" className="ui-link small" onClick={() => setMultiDay(!multiDay)}>
            {multiDay ? 'Single day' : 'Runs over several days?'}
          </button>
        </p>
        <div className="ui-row">
          <div className="ui-field">
            <label htmlFor="location_name">Place</label>
            <input id="location_name" name="location_name" className="ui-input" defaultValue={values.location_name} placeholder="The Mansion · Private Location · UATX campus" />
          </div>
          <div className="ui-field">
            <label htmlFor="address">Address (optional)</label>
            <input id="address" name="address" className="ui-input" defaultValue={values.address} placeholder="Leave blank to share it only by email" />
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Picture</h2>
        <ImageField value={values.image} aspect={3 / 2} label="Event photo" required />
        <div className="ui-field" style={{ marginTop: 14 }}>
          <label htmlFor="image_alt">Describe the photo (for screen readers)</label>
          <input id="image_alt" name="image_alt" className="ui-input" defaultValue={values.image?.alt ?? ''} placeholder="e.g. Speaker at the podium in front of a packed room" />
        </div>
      </section>

      <section className="panel">
        <h2>RSVPs</h2>
        <div className="choices">
          <Choice name="rsvp_mode" value="native" checked={rsvp === 'native'} onChange={(v) => setRsvp(v as 'native')} title="RSVP on our site" help="Guests join the mailing list; you get the guest list and check-in." />
          <Choice name="rsvp_mode" value="none" checked={rsvp === 'none'} onChange={(v) => setRsvp(v as 'none')} title="No RSVP needed" help="Just an announcement." />
        </div>
        {rsvp === 'native' && (
          <div className="step-in" style={{ marginTop: 18 }}>
            <div className="ui-row">
              <div className="ui-field">
                <label htmlFor="capacity">Capacity (optional)</label>
                <input id="capacity" name="capacity" className="ui-input" inputMode="numeric" defaultValue={values.capacity} placeholder="No limit" />
                <span className="ui-hint">Later RSVPs go on a waitlist.</span>
              </div>
              <div className="ui-field">
                <label htmlFor="closes_date">RSVPs close (optional)</label>
                <div className="ui-row" style={{ gap: 8 }}>
                  <input id="closes_date" name="closes_date" type="date" className="ui-input" defaultValue={values.closes_date} />
                  <input name="closes_time" type="time" className="ui-input" defaultValue={values.closes_time} aria-label="RSVP closing time" />
                </div>
                <span className="ui-hint">Default: when the event starts.</span>
              </div>
            </div>
            <div className="ui-field">
              <label htmlFor="partner_url">UATX registration link (optional)</label>
              <input id="partner_url" name="partner_url" className="ui-input" defaultValue={values.partner_url} placeholder="https://uaustin.swoogo.com/…" />
              <span className="ui-hint">For events hosted with UATX: after RSVPing here, guests are sent on to register with UATX too.</span>
            </div>
            <input type="hidden" name="swoogo_event_id" value={values.swoogo_event_id} />
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Publishing</h2>
        <div className="choices">
          <Choice name="status" value="published" checked={status === 'published'} onChange={(v) => setStatus(v as 'published')} title="Published" help={schedule ? 'Goes live at the scheduled time below.' : 'Live on the site.'} />
          <Choice name="status" value="draft" checked={status === 'draft'} onChange={(v) => setStatus(v as 'draft')} title="Draft" help="Only officers can see it." />
          <Choice name="status" value="cancelled" checked={status === 'cancelled'} onChange={(v) => setStatus(v as 'cancelled')} title="Cancelled" help="Removed from the site." />
        </div>
        {status === 'published' && (
          <div className="step-in" style={{ marginTop: 16 }}>
            <label className="ui-check">
              <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} /> Schedule it to go live later
            </label>
            {schedule && (
              <div className="ui-row step-in" style={{ marginTop: 12, maxWidth: 420 }}>
                <input name="publish_date" type="date" className="ui-input" defaultValue={values.publish_date} aria-label="Go-live date" required />
                <input name="publish_time" type="time" className="ui-input" defaultValue={values.publish_time || '09:00'} aria-label="Go-live time" required />
              </div>
            )}
          </div>
        )}

        <p className="ui-label" style={{ margin: '24px 0 10px' }}>
          Who can see it
        </p>
        <div className="choices">
          <Choice name="visibility" value="public" checked={visibility === 'public'} onChange={(v) => setVisibility(v as 'public')} title="Everyone" help="Homepage, Events page and the announcement email." />
          <Choice name="visibility" value="members" checked={visibility === 'members'} onChange={(v) => setVisibility(v as 'members')} title="Members only" help="Visible to signed-in members; the email goes to members." />
          <Choice name="visibility" value="unlisted" checked={visibility === 'unlisted'} onChange={(v) => setVisibility(v as 'unlisted')} title="Link only" help="Not listed anywhere; share the link yourself." />
        </div>
        {visibility === 'members' && (
          <div className="badge-list step-in" style={{ gap: 18, margin: '14px 0 0 4px' }}>
            {(['voting', 'associate', 'honorary'] as const).map((k) => (
              <label key={k} className="ui-check">
                <input type="checkbox" name="member_kinds" value={k} defaultChecked={values.member_kinds.length === 0 || values.member_kinds.includes(k)} />
                <span className={`badge badge--${k}`}>{k[0].toUpperCase() + k.slice(1)}</span>
              </label>
            ))}
          </div>
        )}
        <div className="toggles">
          <label className="ui-check">
            <input type="checkbox" name="feature_on_home" defaultChecked={values.feature_on_home} />
            <span>
              Show on the homepage card<span className="ui-hint" style={{ display: 'block' }}>While it’s upcoming. Several featured events take turns.</span>
            </span>
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>Email</h2>
        <div className="toggles" style={{ marginTop: 0 }}>
          <label className="ui-check">
            <input type="checkbox" name="announce" defaultChecked={values.announce} />
            <span>
              Email the announcement when it goes live
              <span className="ui-hint" style={{ display: 'block' }}>To the mailing list (or members, for members-only events). Sent once.</span>
            </span>
          </label>
        </div>
        <div className="ui-field" style={{ maxWidth: 360, marginTop: 18 }}>
          <label htmlFor="reminder_hours">Reminder to guests</label>
          <select id="reminder_hours" name="reminder_hours" className="ui-select" defaultValue={values.reminder_hours}>
            <option value="24">The day before (24 hours)</option>
            <option value="48">Two days before</option>
            <option value="3">Three hours before</option>
            <option value="none">No reminder</option>
          </select>
        </div>
      </section>

      {showRecap ? (
        <section className="panel step-in">
          <h2>Recap</h2>
          <p className="prose small" style={{ marginBottom: 14 }}>
            Shown on the event page once it’s over.
          </p>
          <div className="ui-field">
            <span className="ui-label">Summary</span>
            <RichEditor name="recap_summary" defaultValue={values.recap_summary} minHeight={100} placeholder="How it went, who won the vote, thanks…" />
          </div>
          <div className="ui-field">
            <label htmlFor="recap_youtube">YouTube recording</label>
            <input id="recap_youtube" name="recap_youtube" className="ui-input" defaultValue={values.recap_youtube} placeholder="https://youtu.be/…" />
          </div>
          <span className="ui-label">Photos</span>
          <ul className="thumb-grid">
            {recapPhotos.map((p) => (
              <li key={p.src}>
                {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
                <img src={p.src} alt="" />
                <button type="button" onClick={() => setRecapPhotos(recapPhotos.filter((x) => x.src !== p.src))} aria-label="Remove photo">
                  ×
                </button>
              </li>
            ))}
          </ul>
          <input type="hidden" name="recap_photos" value={JSON.stringify(recapPhotos)} />
          <label className="ui-btn ui-btn--ghost ui-btn--small">
            Add photos
            <input type="file" name="recap_files" accept="image/*" multiple hidden />
          </label>
        </section>
      ) : (
        <>
          <input type="hidden" name="recap_photos" value="[]" />
          <button type="button" className="ui-link" style={{ margin: '18px 0 0 4px' }} onClick={() => setShowRecap(true)}>
            + Add a recap (photos, recording)
          </button>
        </>
      )}

      {state.error && <p className="ui-error">{state.error}</p>}
      {state.message && <p className="ui-notice">{state.message}</p>}
      <div className="form-bar">
        <button className="ui-btn ui-btn--lg" type="submit" disabled={pending}>
          {pending ? 'Saving…' : eventId ? 'Save changes' : status === 'draft' ? 'Save draft' : 'Create event'}
        </button>
      </div>
    </form>
  );
}
