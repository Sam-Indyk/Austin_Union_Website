'use client';

import Link from 'next/link';
import { useState, useTransition, type ReactNode } from 'react';
import {
  addCollagePhotos,
  moveTeamMember,
  saveDoc,
  saveTeamMember,
  setTeamMemberActive,
  undoDoc,
  updateCollagePhoto,
  type EditorData,
  type Result,
} from '@/app/(site)/edit/actions';
import { ImageField } from '@/components/admin/ImageField';
import { RichEditor } from '@/components/admin/RichEditor';
import { Ornament, ORNAMENT_BY_CHAR } from '@/components/Ornament';
import type { DocKey } from '@/lib/content/edit';
import type { MissionContent, MissionSection } from '@/lib/content/types';

interface PanelProps {
  target: { key: string; label: string };
  data: EditorData | null;
  onClose: () => void;
  onSaved: () => void;
}

/** The slide-in editing panel; picks the right editor for the clicked block. */
export function EditorPanel({ target, data, onClose, onSaved }: PanelProps) {
  const [status, setStatus] = useState<Result | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<Result>, close = false) =>
    start(async () => {
      const r = await fn();
      setStatus(r);
      if (r.ok) {
        onSaved();
        if (close) setTimeout(onClose, 500);
      }
    });

  const ctx: Ctx = { data: data!, run, pending };
  const [kind, ...rest] = target.key.split(':');
  const arg = rest.join(':');

  let body: ReactNode = <p className="prose">Loading…</p>;
  let undoKey: DocKey | null = null;
  if (data) {
    switch (kind) {
      case 'home':
        undoKey = 'home';
        body = arg === 'epigraph' ? <EpigraphEditor {...ctx} /> : <EssayEditor {...ctx} />;
        break;
      case 'mission':
        undoKey = 'mission';
        body = arg === 'title' ? <MissionTitleEditor {...ctx} /> : arg === 'contact' ? <MissionContactEditor {...ctx} /> : <MissionSectionEditor {...ctx} id={arg.replace(/^section:/, '')} />;
        break;
      case 'team':
        if (arg === 'header') {
          undoKey = 'team_page';
          body = <TeamHeaderEditor {...ctx} />;
        } else body = <TeamMemberEditor {...ctx} id={arg.replace(/^member:/, '')} />;
        break;
      case 'donate':
        undoKey = 'donate';
        body = <DonateEditor {...ctx} />;
        break;
      case 'contact':
        undoKey = 'contact';
        body = <ContactEditor {...ctx} />;
        break;
      case 'settings':
        undoKey = 'settings';
        body = <SettingsEditor {...ctx} />;
        break;
      case 'collage':
        body = <CollageEditor {...ctx} />;
        break;
      case 'event':
        body = (
          <div>
            <p className="prose" style={{ marginBottom: 18 }}>Events are edited in the Officers’ Desk, where you can also see RSVPs and emails.</p>
            <Link className="ui-btn ui-btn--block" href={`/admin/events/${arg}`}>
              Edit this event
            </Link>
          </div>
        );
        break;
      case 'events':
        body = (
          <div>
            <p className="prose" style={{ marginBottom: 18 }}>
              This shows upcoming events automatically — the next featured event appears on the homepage card, and events move to Past Events when they end.
            </p>
            <Link className="ui-btn ui-btn--block" href="/admin/events">
              Manage events
            </Link>
            <Link className="ui-btn ui-btn--ghost ui-btn--block" style={{ marginTop: 10 }} href="/admin/events/new">
              Create an event
            </Link>
          </div>
        );
        break;
    }
  }

  return (
    <aside className="edit-panel" role="dialog" aria-label={`Edit: ${target.label}`}>
      <header className="edit-panel__head">
        <div>
          <p className="edit-panel__kicker">Editing</p>
          <h2>{target.label}</h2>
        </div>
        <button type="button" className="edit-panel__close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </header>
      <div className="edit-panel__body">
        {body}
        {status && <p className={status.ok ? 'ui-notice' : 'ui-error'}>{status.ok ? status.message ?? 'Saved.' : status.error}</p>}
      </div>
      {undoKey && data && data.revisions[undoKey] > 0 && (
        <footer className="edit-panel__foot">
          <button type="button" className="ui-link small" disabled={pending} onClick={() => confirm('Undo the most recent change to this page?') && run(() => undoDoc(undoKey!))}>
            ↶ Undo last change to this page
          </button>
        </footer>
      )}
    </aside>
  );
}

interface Ctx {
  data: EditorData;
  run: (fn: () => Promise<Result>, close?: boolean) => void;
  pending: boolean;
}

const Save = ({ pending, label = 'Save' }: { pending: boolean; label?: string }) => (
  <button className="ui-btn ui-btn--block" type="submit" disabled={pending}>
    {pending ? 'Saving…' : label}
  </button>
);

// ---------------------------------------------------------------------------
// Home
// ---------------------------------------------------------------------------
function EpigraphEditor({ data, run, pending }: Ctx) {
  const [lines, setLines] = useState(data.home.epigraph);
  return (
    <form onSubmit={(e) => (e.preventDefault(), run(() => saveDoc('home', { epigraph: lines }), true))}>
      {lines.map((l, i) => (
        <div className="ui-field" key={i}>
          <label htmlFor={`ep-${i}`}>Line {i + 1}</label>
          <input id={`ep-${i}`} className="ui-input" value={l} onChange={(e) => setLines(lines.map((x, j) => (j === i ? e.target.value : x)))} />
        </div>
      ))}
      <Save pending={pending} />
    </form>
  );
}

function EssayEditor({ data, run, pending }: Ctx) {
  const [html, setHtml] = useState(data.home.essay.join(''));
  return (
    <form onSubmit={(e) => (e.preventDefault(), run(() => saveDoc('home', { essayHtml: html }), true))}>
      <p className="ui-hint" style={{ marginBottom: 10 }}>
        The first word becomes the large red drop cap automatically.
      </p>
      <RichEditor defaultValue={html} onChange={setHtml} minHeight={420} variant="essay" />
      <div style={{ height: 14 }} />
      <Save pending={pending} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Mission
// ---------------------------------------------------------------------------
const THEMES: { value: MissionSection['theme']; label: string; swatch: string }[] = [
  { value: 'red', label: 'Red', swatch: '#7f1f20' },
  { value: 'cream', label: 'Cream', swatch: '#ededE4' },
  { value: 'maroon', label: 'Maroon', swatch: '#401718' },
  { value: 'charcoal', label: 'Charcoal', swatch: '#2f2e2e' },
  { value: 'navy', label: 'Navy', swatch: '#324158' },
];
const ORNAMENT_CHARS = ['x', 'W', '&', '(', '4', 'k', 'B'];

function OrnamentPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="orn-picker" role="radiogroup" aria-label="Ornament">
      {ORNAMENT_CHARS.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={value === c} className={value === c ? 'is-on' : ''} onClick={() => onChange(c)}>
          <Ornament name={ORNAMENT_BY_CHAR[c]} />
        </button>
      ))}
    </div>
  );
}

function ThemePicker({ value, onChange }: { value: string; onChange: (v: MissionSection['theme']) => void }) {
  return (
    <div className="theme-picker" role="radiogroup" aria-label="Background">
      {THEMES.map((t) => (
        <button key={t.value} type="button" role="radio" aria-checked={value === t.value} className={value === t.value ? 'is-on' : ''} onClick={() => onChange(t.value)}>
          <i style={{ background: t.swatch }} /> {t.label}
        </button>
      ))}
    </div>
  );
}

function MissionTitleEditor({ data, run, pending }: Ctx) {
  const [title, setTitle] = useState(data.mission.title);
  return (
    <form onSubmit={(e) => (e.preventDefault(), run(() => saveDoc('mission', { title }), true))}>
      <div className="ui-field">
        <label htmlFor="m-title">Page title</label>
        <input id="m-title" className="ui-input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <Save pending={pending} />
    </form>
  );
}

function MissionSectionEditor({ data, run, pending, id }: Ctx & { id: string }) {
  const sections = data.mission.sections;
  const index = sections.findIndex((s) => s.id === id);
  const [s, setS] = useState<MissionSection>(sections[index] ?? sections[0]);
  const save = (next: MissionContent['sections'], close = true) => run(() => saveDoc('mission', { sections: next }), close);
  const replace = (list: MissionSection[]) => list.map((x) => (x.id === s.id ? s : x));

  return (
    <form onSubmit={(e) => (e.preventDefault(), save(replace(sections)))}>
      <div className="ui-field">
        <label htmlFor="s-heading">Heading</label>
        <input id="s-heading" className="ui-input" value={s.heading} onChange={(e) => setS({ ...s, heading: e.target.value })} />
      </div>
      <div className="ui-field">
        <span className="ui-label">Ornament</span>
        <OrnamentPicker value={s.ornament} onChange={(ornament) => setS({ ...s, ornament })} />
        <div className="theme-picker" style={{ marginTop: 8 }}>
          {(['gold', 'red'] as const).map((c) => (
            <button key={c} type="button" className={s.ornamentColor === c ? 'is-on' : ''} onClick={() => setS({ ...s, ornamentColor: c })}>
              <i style={{ background: c === 'gold' ? '#dabb3a' : '#7f1f20' }} /> {c === 'gold' ? 'Gold' : 'Red'}
            </button>
          ))}
        </div>
      </div>
      <div className="ui-field">
        <span className="ui-label">Background</span>
        <ThemePicker value={s.theme} onChange={(theme) => setS({ ...s, theme })} />
      </div>
      <div className="ui-field">
        <span className="ui-label">Text</span>
        <RichEditor defaultValue={s.body} onChange={(body) => setS({ ...s, body })} minHeight={260} />
      </div>
      <Save pending={pending} />
      <div className="edit-panel__ops">
        <button type="button" className="ui-link small" disabled={index <= 0} onClick={() => { const l = replace(sections); [l[index - 1], l[index]] = [l[index], l[index - 1]]; save(l, false); }}>
          ↑ Move up
        </button>
        <button type="button" className="ui-link small" disabled={index >= sections.length - 1} onClick={() => { const l = replace(sections); [l[index + 1], l[index]] = [l[index], l[index + 1]]; save(l, false); }}>
          ↓ Move down
        </button>
        <button
          type="button"
          className="ui-link small"
          onClick={() => {
            const fresh: MissionSection = { id: `section-${Date.now().toString(36)}`, heading: 'New section', ornament: 'x', ornamentColor: 'gold', theme: s.theme === 'red' ? 'cream' : 'red', body: '<p>Write here.</p>' };
            const l = replace(sections);
            l.splice(index + 1, 0, fresh);
            save(l, false);
          }}
        >
          + Add a section below
        </button>
        <button type="button" className="ui-link small" disabled={sections.length <= 1} onClick={() => confirm(`Delete the “${s.heading}” section?`) && save(sections.filter((x) => x.id !== s.id))}>
          Delete section
        </button>
      </div>
    </form>
  );
}

function MissionContactEditor({ data, run, pending }: Ctx) {
  const [c, setC] = useState(data.mission.contactSection);
  return (
    <form onSubmit={(e) => (e.preventDefault(), run(() => saveDoc('mission', { contactSection: c }), true))}>
      <div className="ui-field">
        <label htmlFor="mc-h">Heading</label>
        <input id="mc-h" className="ui-input" value={c.heading} onChange={(e) => setC({ ...c, heading: e.target.value })} />
      </div>
      <div className="ui-field">
        <label htmlFor="mc-i">Line under the heading</label>
        <input id="mc-i" className="ui-input" value={c.intro} onChange={(e) => setC({ ...c, intro: e.target.value })} />
      </div>
      <div className="ui-field">
        <span className="ui-label">Ornament</span>
        <OrnamentPicker value={c.ornament} onChange={(ornament) => setC({ ...c, ornament })} />
      </div>
      <p className="ui-hint" style={{ marginBottom: 14 }}>
        The social links here come from the footer settings.
      </p>
      <Save pending={pending} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------
function TeamHeaderEditor({ data, run, pending }: Ctx) {
  const [t, setT] = useState(data.team_page);
  const past = data.team.filter((m) => !m.active);
  return (
    <>
      <form onSubmit={(e) => (e.preventDefault(), run(() => saveDoc('team_page', t), true))}>
        <div className="ui-field">
          <label htmlFor="t-title">Title</label>
          <input id="t-title" className="ui-input" value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} />
        </div>
        <div className="ui-field">
          <label htmlFor="t-motto">Motto</label>
          <input id="t-motto" className="ui-input" value={t.motto} onChange={(e) => setT({ ...t, motto: e.target.value })} />
        </div>
        <div className="ui-field">
          <span className="ui-label">Introduction</span>
          <RichEditor defaultValue={t.intro} onChange={(intro) => setT({ ...t, intro })} minHeight={120} />
        </div>
        <Save pending={pending} />
      </form>
      <hr className="rule" />
      <h3 className="edit-panel__h3">Add a team member</h3>
      <TeamMemberForm run={run} pending={pending} />
      {past.length > 0 && (
        <>
          <hr className="rule" />
          <h3 className="edit-panel__h3">Past members</h3>
          <ul className="email-list">
            {past.map((m) => (
              <li key={m.id}>
                <span>
                  {m.name} <span className="muted small">· {m.role}</span>
                </span>
                <button type="button" className="ui-link small" onClick={() => run(() => setTeamMemberActive(m.id, true))}>
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function TeamMemberForm({ member, run, pending }: { member?: EditorData['team'][number]; run: Ctx['run']; pending: boolean }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        run(() => saveTeamMember(member?.id ?? null, form), true);
      }}
    >
      <ImageField value={member?.photo ?? null} aspect={1} label="Photo" required={!member} />
      <div className="ui-row" style={{ marginTop: 14 }}>
        <div className="ui-field">
          <label htmlFor="tm-name">Name</label>
          <input id="tm-name" name="name" className="ui-input" defaultValue={member?.name} required />
        </div>
        <div className="ui-field">
          <label htmlFor="tm-role">Role</label>
          <input id="tm-role" name="role" className="ui-input" defaultValue={member?.role} placeholder="e.g. Treasurer" required />
        </div>
      </div>
      <div className="ui-field">
        <label htmlFor="tm-email">Email</label>
        <input id="tm-email" name="email" type="email" className="ui-input" defaultValue={member?.email} />
      </div>
      <div className="ui-row">
        <div className="ui-field">
          <label htmlFor="tm-x">X / Twitter link</label>
          <input id="tm-x" name="x" className="ui-input" defaultValue={member?.x} placeholder="https://x.com/…" />
        </div>
        <div className="ui-field">
          <label htmlFor="tm-li">LinkedIn link</label>
          <input id="tm-li" name="linkedin" className="ui-input" defaultValue={member?.linkedin} placeholder="https://linkedin.com/in/…" />
        </div>
      </div>
      <Save pending={pending} label={member ? 'Save' : 'Add to the team'} />
    </form>
  );
}

function TeamMemberEditor({ data, run, pending, id }: Ctx & { id: string }) {
  const member = data.team.find((m) => m.id === id);
  if (!member) return <p className="prose">This person isn’t on the team list any more.</p>;
  return (
    <>
      <TeamMemberForm member={member} run={run} pending={pending} />
      <div className="edit-panel__ops">
        <button type="button" className="ui-link small" onClick={() => run(() => moveTeamMember(id, -1))}>
          ↑ Earlier
        </button>
        <button type="button" className="ui-link small" onClick={() => run(() => moveTeamMember(id, 1))}>
          ↓ Later
        </button>
        <button type="button" className="ui-link small" onClick={() => confirm(`Remove ${member.name} from the Team page? They’ll become an honorary member.`) && run(() => setTeamMemberActive(id, false), true)}>
          Remove from the team
        </button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Donate, Contact, Footer
// ---------------------------------------------------------------------------
function DonateEditor({ data, run, pending }: Ctx) {
  const [title, setTitle] = useState(data.donate.title);
  const [body, setBody] = useState(data.donate.body.join(''));
  const [label, setLabel] = useState(data.donate.buttonLabel);
  const [donateUrl, setUrl] = useState(data.settings.donateUrl);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const a = await saveDoc('donate', { title, bodyHtml: body, buttonLabel: label });
          return a.ok ? saveDoc('settings', { donateUrl }) : a;
        }, true);
      }}
    >
      <div className="ui-field">
        <label htmlFor="d-title">Title</label>
        <input id="d-title" className="ui-input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="ui-field">
        <span className="ui-label">Text</span>
        <RichEditor defaultValue={body} onChange={setBody} minHeight={160} />
      </div>
      <div className="ui-row">
        <div className="ui-field">
          <label htmlFor="d-label">Button</label>
          <input id="d-label" className="ui-input" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="ui-field">
          <label htmlFor="d-url">Button goes to</label>
          <input id="d-url" className="ui-input" value={donateUrl} onChange={(e) => setUrl(e.target.value)} />
        </div>
      </div>
      <Save pending={pending} />
    </form>
  );
}

function ContactEditor({ data, run, pending }: Ctx) {
  const [c, setC] = useState(data.contact);
  const [phone, setPhone] = useState(data.settings.contact.phone);
  const [email, setEmail] = useState(data.settings.contact.email);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run(async () => {
          const a = await saveDoc('contact', { ...c });
          return a.ok ? saveDoc('settings', { contact: { phone, email } }) : a;
        }, true);
      }}
    >
      <div className="ui-field">
        <label htmlFor="c-title">Title</label>
        <input id="c-title" className="ui-input" value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} />
      </div>
      <div className="ui-field">
        <label htmlFor="c-intro">Introduction</label>
        <input id="c-intro" className="ui-input" value={c.intro} onChange={(e) => setC({ ...c, intro: e.target.value })} />
      </div>
      <div className="ui-field">
        <label htmlFor="c-h">Form heading</label>
        <input id="c-h" className="ui-input" value={c.formHeading} onChange={(e) => setC({ ...c, formHeading: e.target.value })} />
      </div>
      <div className="ui-row">
        <div className="ui-field">
          <label htmlFor="c-phone">Phone</label>
          <input id="c-phone" className="ui-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="ui-field">
          <label htmlFor="c-email">Email</label>
          <input id="c-email" className="ui-input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <Save pending={pending} />
    </form>
  );
}

function SettingsEditor({ data, run, pending }: Ctx) {
  const [s, setS] = useState(data.settings);
  const social = (k: keyof typeof s.social, label: string) => (
    <div className="ui-field">
      <label htmlFor={`soc-${k}`}>{label}</label>
      <input id={`soc-${k}`} className="ui-input" value={s.social[k] ?? ''} placeholder="https://… (blank hides the icon)" onChange={(e) => setS({ ...s, social: { ...s.social, [k]: e.target.value } })} />
    </div>
  );
  return (
    <form onSubmit={(e) => (e.preventDefault(), run(() => saveDoc('settings', s as unknown as Record<string, unknown>), true))}>
      {social('x', 'X / Twitter')}
      {social('instagram', 'Instagram')}
      {social('youtube', 'YouTube')}
      {social('linkedin', 'LinkedIn')}
      {social('facebook', 'Facebook')}
      <div className="ui-field">
        <label htmlFor="s-copy">Copyright line name</label>
        <input id="s-copy" className="ui-input" value={s.copyrightHolder} onChange={(e) => setS({ ...s, copyrightHolder: e.target.value })} />
        <span className="ui-hint">The year updates itself.</span>
      </div>
      <div className="ui-field">
        <label htmlFor="s-addr">Mailing address (shown in email footers)</label>
        <input id="s-addr" className="ui-input" value={s.mailingAddress ?? ''} placeholder="e.g. 522 Congress Ave, Austin, TX 78701" onChange={(e) => setS({ ...s, mailingAddress: e.target.value })} />
      </div>
      <Save pending={pending} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Banner photos
// ---------------------------------------------------------------------------
function CollageEditor({ data, run, pending }: Ctx) {
  return (
    <>
      <p className="prose small" style={{ marginBottom: 14 }}>
        Photos are turned black-and-white and arranged automatically. Bigger photos get more room; use the size buttons to give one more or less.
      </p>
      <form
        className="collage-add"
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          run(() => addCollagePhotos(form));
          e.currentTarget.reset();
        }}
      >
        <label className="ui-btn ui-btn--block">
          {pending ? 'Working… (rebuilding the banner)' : '+ Add photos'}
          <input type="file" name="photos" accept="image/*" multiple hidden disabled={pending} onChange={(e) => e.currentTarget.form?.requestSubmit()} />
        </label>
      </form>
      <ul className="collage-list">
        {data.collage.map((p, i) => (
          <li key={p.id}>
            {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail */}
            <img src={p.src} alt="" style={{ objectPosition: `${p.focalX}% ${p.focalY}%` }} />
            <div className="collage-list__tools">
              <span className="muted small">Size {p.emphasis.toFixed(1)}×</span>
              <button type="button" className="ui-link small" disabled={pending} onClick={() => run(() => updateCollagePhoto(p.id, { emphasis: p.emphasis + 0.4 }))} aria-label="Bigger">
                Bigger
              </button>
              <button type="button" className="ui-link small" disabled={pending} onClick={() => run(() => updateCollagePhoto(p.id, { emphasis: p.emphasis - 0.4 }))} aria-label="Smaller">
                Smaller
              </button>
              <button type="button" className="ui-link small" disabled={pending || i === 0} onClick={() => run(() => updateCollagePhoto(p.id, { move: -1 }))} aria-label="Move earlier">
                ↑
              </button>
              <button type="button" className="ui-link small" disabled={pending || i === data.collage.length - 1} onClick={() => run(() => updateCollagePhoto(p.id, { move: 1 }))} aria-label="Move later">
                ↓
              </button>
              <button type="button" className="ui-link small" disabled={pending || data.collage.length <= 1} onClick={() => confirm('Remove this photo from the banner?') && run(() => updateCollagePhoto(p.id, { remove: true }))}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
