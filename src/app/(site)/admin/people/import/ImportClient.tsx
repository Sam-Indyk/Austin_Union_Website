'use client';

import Link from 'next/link';
import Papa from 'papaparse';
import { useState, useTransition } from 'react';
import { importContacts, type ImportResult, type ImportRow } from './actions';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Find a column by trying header names in order (Wix's export, then common alternatives). */
function pick(headers: string[], ...tests: RegExp[]): string | undefined {
  for (const t of tests) {
    const h = headers.find((x) => t.test(x.trim()));
    if (h) return h;
  }
  return undefined;
}

function toStatus(v: string | undefined): ImportRow['status'] {
  const s = (v ?? '').toLowerCase();
  if (/unsub/.test(s)) return 'unsubscribed';
  if (/^subscribed|^yes|^true|^1$/.test(s)) return 'subscribed';
  return 'unset';
}

interface Parsed {
  filename: string;
  rows: ImportRow[];
  invalid: number;
  duplicates: number;
  columns: { email?: string; first?: string; last?: string; status?: string };
}

function parse(file: File): Promise<Parsed> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (res) => {
        const headers = res.meta.fields ?? [];
        const email = pick(headers, /^e-?mail 1$/i, /^e-?mail$/i, /^e-?mail address$/i, /e-?mail(?!.*status)/i);
        if (!email) return reject(new Error('Couldn’t find an email column in this file.'));
        const first = pick(headers, /^first name$/i, /^first$/i, /^given name$/i);
        const last = pick(headers, /^last name$/i, /^last$/i, /^surname$/i, /^family name$/i);
        const full = first ? undefined : pick(headers, /^name$/i, /^full name$/i);
        const status = pick(headers, /subscriber status/i, /^subscri/i, /marketing/i);
        const labels = pick(headers, /^labels?$/i, /^tags?$/i);
        const others = headers.filter((h) => h !== email && /^e-?mail \d+$/i.test(h.trim()));

        const seen = new Set<string>();
        let invalid = 0;
        let duplicates = 0;
        const rows: ImportRow[] = [];
        for (const r of res.data) {
          const e = (r[email] ?? '').trim().toLowerCase();
          if (!EMAIL.test(e)) {
            invalid++;
            continue;
          }
          if (seen.has(e)) {
            duplicates++;
            continue;
          }
          seen.add(e);
          const [f, ...l] = full ? (r[full] ?? '').trim().split(/\s+/) : [];
          rows.push({
            email: e,
            firstName: (first ? r[first] : f ?? '')?.trim() ?? '',
            lastName: (last ? r[last] : l.join(' '))?.trim() ?? '',
            otherEmails: others.map((h) => (r[h] ?? '').trim()).filter(Boolean),
            status: toStatus(status ? r[status] : undefined),
            labels: labels ? (r[labels] ?? '').trim() : '',
          });
        }
        resolve({ filename: file.name, rows, invalid, duplicates, columns: { email, first: first ?? full, last, status } });
      },
      error: (err) => reject(err),
    });
  });
}

export function ImportClient() {
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addUnset, setAddUnset] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, start] = useTransition();

  const load = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setError(null);
    setResult(null);
    try {
      setParsed(await parse(f));
    } catch (err) {
      setParsed(null);
      setError(err instanceof Error ? err.message : 'Couldn’t read that file.');
    }
  };

  const counts = parsed && {
    subscribed: parsed.rows.filter((r) => r.status === 'subscribed').length,
    unsubscribed: parsed.rows.filter((r) => r.status === 'unsubscribed').length,
    unset: parsed.rows.filter((r) => r.status === 'unset').length,
  };

  if (result?.ok) {
    return (
      <section className="panel step-in">
        <h2>Imported</h2>
        <div className="stat-row stat-row--four">
          <div className="stat">
            <span className="stat__num">{result.created}</span>
            <span className="stat__label">new people</span>
          </div>
          <div className="stat">
            <span className="stat__num">{result.updated}</span>
            <span className="stat__label">already here, updated</span>
          </div>
          <div className="stat">
            <span className="stat__num">{result.subscribed}</span>
            <span className="stat__label">on the mailing list</span>
          </div>
          <div className="stat">
            <span className="stat__num">{result.skipped}</span>
            <span className="stat__label">skipped</span>
          </div>
        </div>
        <p className="prose" style={{ marginBottom: 18 }}>
          Nobody was emailed. Imported contacts will get announcements for new events if they’re on the mailing list.
        </p>
        <div className="badge-list" style={{ gap: 10 }}>
          <Link href="/admin/people?filter=subscribers" className="ui-btn">
            See the mailing list
          </Link>
          <button type="button" className="ui-btn ui-btn--ghost" onClick={() => (setResult(null), setParsed(null))}>
            Import another file
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <h2>1 · Export from Wix</h2>
        <ol className="prose import-steps">
          <li>
            In the Wix dashboard, open <strong>Contacts</strong>.
          </li>
          <li>
            Click <strong>More actions → Export</strong>, choose <strong>All contacts</strong> and <strong>CSV</strong>, then download it.
          </li>
          <li>Drop the file below. Nothing is saved until you confirm.</li>
        </ol>
      </section>

      <section className="panel">
        <h2>2 · Check the file</h2>
        <div
          className={`image-field__drop import-drop${dragging ? ' is-drag' : ''}`}
          onDragOver={(e) => (e.preventDefault(), setDragging(true))}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            load(e.dataTransfer.files);
          }}
        >
          <p className="image-field__empty">{parsed ? parsed.filename : 'Drop the contacts .csv here, or choose it.'}</p>
          <label className="ui-btn ui-btn--ghost ui-btn--small image-field__choose">
            {parsed ? 'Choose a different file' : 'Choose file'}
            <input type="file" accept=".csv,text/csv" hidden onChange={(e) => load(e.target.files)} />
          </label>
        </div>
        {error && <p className="ui-error">{error}</p>}

        {parsed && counts && (
          <div className="step-in" style={{ marginTop: 22 }}>
            <div className="stat-row stat-row--four">
              <div className="stat">
                <span className="stat__num">{parsed.rows.length}</span>
                <span className="stat__label">contacts</span>
              </div>
              <div className="stat">
                <span className="stat__num">{counts.subscribed}</span>
                <span className="stat__label">subscribed on Wix</span>
              </div>
              <div className="stat">
                <span className="stat__num">{counts.unset}</span>
                <span className="stat__label">never subscribed</span>
              </div>
              <div className="stat">
                <span className="stat__num">{counts.unsubscribed}</span>
                <span className="stat__label">unsubscribed</span>
              </div>
            </div>
            <p className="muted small" style={{ marginBottom: 16 }}>
              Reading “{parsed.columns.email}” as the email{parsed.columns.first ? `, “${parsed.columns.first}” as the name` : ''}
              {parsed.columns.status ? `, and “${parsed.columns.status}” for subscriptions` : ' (no subscription column found)'}.
              {parsed.invalid > 0 && ` ${parsed.invalid} ${parsed.invalid === 1 ? 'row' : 'rows'} without a valid email will be skipped.`}
              {parsed.duplicates > 0 && ` ${parsed.duplicates} repeated ${parsed.duplicates === 1 ? 'address' : 'addresses'} will be merged.`}
            </p>

            <div className="table-wrap import-preview">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>On Wix</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 8).map((r) => (
                    <tr key={r.email}>
                      <td>{[r.firstName, r.lastName].filter(Boolean).join(' ') || <span className="muted">—</span>}</td>
                      <td>{r.email}</td>
                      <td>{r.status === 'subscribed' ? 'Subscribed' : r.status === 'unsubscribed' ? 'Unsubscribed' : 'Not subscribed'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.rows.length > 8 && <p className="muted small" style={{ padding: '10px 16px' }}>…and {parsed.rows.length - 8} more.</p>}
            </div>
          </div>
        )}
      </section>

      {parsed && counts && (
        <section className="panel step-in">
          <h2>3 · Import</h2>
          <p className="prose" style={{ marginBottom: 14 }}>
            Subscribed contacts join the mailing list. Unsubscribed contacts are kept as contacts and will never be emailed. People already here are matched by email and keep their details.
          </p>
          {counts.unset > 0 && (
            <div className="choices" style={{ marginBottom: 18 }}>
              <label className={`choice${!addUnset ? ' is-on' : ''}`}>
                <input type="radio" name="unset" checked={!addUnset} onChange={() => setAddUnset(false)} />
                <span>
                  <span className="choice__title">Keep the {counts.unset} others as contacts only</span>
                  <span className="choice__help">They never signed up for email on Wix (for example, they sent a message or RSVP’d once).</span>
                </span>
              </label>
              <label className={`choice${addUnset ? ' is-on' : ''}`}>
                <input type="radio" name="unset" checked={addUnset} onChange={() => setAddUnset(true)} />
                <span>
                  <span className="choice__title">Add them to the mailing list too</span>
                  <span className="choice__help">Every email has an unsubscribe link, but people who didn’t ask may mark it as spam.</span>
                </span>
              </label>
            </div>
          )}
          <button
            type="button"
            className="ui-btn ui-btn--lg"
            disabled={pending}
            onClick={() => start(async () => setResult(await importContacts(parsed.filename, parsed.rows, addUnset)))}
          >
            {pending ? `Importing ${parsed.rows.length} contacts…` : `Import ${parsed.rows.length} contacts`}
          </button>
          {result && !result.ok && <p className="ui-error">{result.error}</p>}
        </section>
      )}
    </>
  );
}
