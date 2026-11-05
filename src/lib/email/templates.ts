// Email templates in the society's house style. Email clients ignore web fonts
// and most CSS, so this is table-based HTML with inline styles and Georgia as
// the serif — the closest universally available face to the site's type.
import { googleCalendarUrl } from '@/lib/calendar';
import type { EventItem } from '@/lib/content/types';
import { formatCardDate, formatRange } from '@/lib/dates';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.austinunion.org';
const RED = '#7f1f20';
const INK = '#2f2e2e';
const GRAY = '#605e5e';
const PINK = '#f7b3b3';
const CREAM = '#ededE4';
const SERIF = "Georgia,'Times New Roman',serif";

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = (src: string) => (src.startsWith('http') ? src : `${SITE}${src}`);

export interface Recipient {
  email: string;
  firstName?: string | null;
  unsubscribeUrl?: string;
  manageUrl?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
  /** Hidden preview line shown by inboxes next to the subject. */
  preheader: string;
}

function shell({ preheader, body, footer }: { preheader: string; body: string; footer: string }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Austin Union</title></head>
<body style="margin:0;padding:0;background:${CREAM};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:28px 10px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
<tr><td align="center" style="padding:0 0 18px;">
  <a href="${SITE}" style="text-decoration:none;"><img src="${SITE}/media/site/seal.png" width="64" height="64" alt="Austin Union Society" style="display:block;margin:0 auto 8px;"></a>
  <div style="font-family:${SERIF};font-size:13px;letter-spacing:4px;color:${INK};">AUSTIN UNION</div>
</td></tr>
<tr><td style="background:#ffffff;border:3px solid ${INK};">${body}</td></tr>
<tr><td style="padding:22px 18px 0;font-family:${SERIF};font-size:12px;line-height:1.7;color:#8a8888;text-align:center;">${footer}</td></tr>
</table></td></tr></table></body></html>`;
}

function button(label: string, href: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:6px auto 4px;"><tr><td style="background:${RED};">
<a href="${esc(href)}" style="display:inline-block;padding:14px 44px;font-family:${SERIF};font-size:17px;letter-spacing:2px;color:#ffffff;text-decoration:none;">${esc(label)}</a></td></tr></table>`;
}

function eventBlock(e: EventItem, intro?: string) {
  const where = [e.locationName, e.address].filter(Boolean).join(' · ');
  const image = e.image?.src
    ? `<a href="${SITE}/events/${e.slug}"><img src="${esc(abs(e.image.src))}" width="554" alt="${esc(e.image.alt || e.title)}" style="display:block;width:100%;max-width:554px;height:auto;border-bottom:5px solid ${PINK};"></a>`
    : '';
  return `${image}
<div style="padding:30px 34px 8px;text-align:center;">
  ${intro ? `<div style="font-family:${SERIF};font-style:italic;font-size:15px;letter-spacing:1px;color:${RED};margin:0 0 12px;">${esc(intro)}</div>` : ''}
  <div style="font-family:${SERIF};font-size:27px;line-height:1.25;color:${INK};margin:0 0 14px;">${esc(e.title)}</div>
  <div style="font-family:${SERIF};font-style:italic;font-size:16px;letter-spacing:2px;color:${INK};margin:0 0 4px;">${esc(formatCardDate(e.startsAt))}</div>
  <div style="font-family:${SERIF};font-size:15px;color:${GRAY};margin:0 0 2px;">${esc(formatRange(e.startsAt, e.endsAt).split(', ').slice(-1)[0])}</div>
  <div style="font-family:${SERIF};font-size:15px;color:${GRAY};margin:0 0 20px;">${esc(where)}</div>
  <div style="border-top:1px solid rgba(127,31,32,.35);width:120px;margin:0 auto 20px;"></div>
  <div style="font-family:${SERIF};font-size:17px;line-height:1.65;color:${INK};text-align:left;margin:0 0 24px;white-space:pre-line;">${esc(e.summary)}</div>
</div>`;
}

function calendarLinks(e: EventItem) {
  return `<div style="font-family:${SERIF};font-size:14px;color:${GRAY};text-align:center;padding:4px 34px 30px;">
Add to <a href="${esc(googleCalendarUrl(e))}" style="color:${RED};">Google Calendar</a> · <a href="${SITE}/events/${e.slug}/event.ics" style="color:${RED};">Apple / Outlook</a></div>`;
}

function listFooter(r: Recipient, mailingAddress?: string) {
  return `You’re receiving this because you joined the Austin Union mailing list or RSVP’d to one of our events.<br>
${r.unsubscribeUrl ? `<a href="${esc(r.unsubscribeUrl)}" style="color:#8a8888;">Unsubscribe</a> · ` : ''}<a href="${SITE}" style="color:#8a8888;">austinunion.org</a>${mailingAddress ? `<br>${esc(mailingAddress)}` : ''}`;
}

/** Sent to the mailing list when an event is published. */
export function eventAnnouncement(e: EventItem, r: Recipient, opts: { mailingAddress?: string } = {}): RenderedEmail {
  const rsvp = e.rsvp.mode === 'native';
  const body = `${eventBlock(e, 'You are invited')}
<div style="padding:0 34px 18px;">${button(rsvp ? 'RSVP' : 'DETAILS', `${SITE}/events/${e.slug}${rsvp ? '#rsvp' : ''}`)}</div>
${calendarLinks(e)}`;
  return {
    subject: e.title,
    preheader: `${formatCardDate(e.startsAt)} · ${e.locationName}. ${e.summary}`.slice(0, 140),
    html: shell({ preheader: e.summary, body, footer: listFooter(r, opts.mailingAddress) }),
    text: `${e.title}\n${formatRange(e.startsAt, e.endsAt)}\n${e.locationName}${e.address ? `, ${e.address}` : ''}\n\n${e.summary}\n\n${rsvp ? 'RSVP' : 'Details'}: ${SITE}/events/${e.slug}\n\nUnsubscribe: ${r.unsubscribeUrl ?? ''}`,
  };
}

/** Sent right after someone RSVPs. */
export function rsvpConfirmation(e: EventItem, r: Recipient, opts: { partnerUrl?: string; promoted?: boolean } = {}): RenderedEmail {
  const partner = opts.partnerUrl
    ? `<div style="margin:0 34px 22px;padding:14px 16px;background:#f0f0e9;border-left:3px solid ${RED};font-family:${SERIF};font-size:15px;line-height:1.6;color:${INK};">
<strong>One more step:</strong> this event is hosted with UATX, which keeps its own guest list. Please also <a href="${esc(opts.partnerUrl)}" style="color:${RED};">register on their page</a>.</div>`
    : '';
  const kicker = opts.promoted ? 'A spot opened up — you’re in' : r.firstName ? `See you there, ${r.firstName}` : 'You’re on the list';
  const body = `${eventBlock(e, kicker)}
${partner}${calendarLinks(e)}
${r.manageUrl ? `<div style="font-family:${SERIF};font-size:13px;color:#8a8888;text-align:center;padding:0 34px 26px;">Can’t make it? <a href="${esc(r.manageUrl)}" style="color:#8a8888;">Cancel your RSVP</a></div>` : ''}`;
  return {
    subject: opts.promoted ? `You’re off the waitlist: ${e.title}` : `You’re going: ${e.title}`,
    preheader: `${formatRange(e.startsAt, e.endsAt)} · ${e.locationName}`,
    html: shell({ preheader: `${formatRange(e.startsAt, e.endsAt)} · ${e.locationName}`, body, footer: r.unsubscribeUrl
        ? `RSVPing also adds you to the Austin Union mailing list.<br><a href="${esc(r.unsubscribeUrl)}" style="color:#8a8888;">Unsubscribe</a> · <a href="${SITE}" style="color:#8a8888;">austinunion.org</a>`
        : `Austin Union · <a href="${SITE}" style="color:#8a8888;">austinunion.org</a>` }),
    text: `You're going to ${e.title}.\n${formatRange(e.startsAt, e.endsAt)}\n${e.locationName}${e.address ? `, ${e.address}` : ''}\n${opts.partnerUrl ? `\nAlso register with UATX: ${opts.partnerUrl}\n` : ''}\nDetails: ${SITE}/events/${e.slug}${r.manageUrl ? `\nCancel: ${r.manageUrl}` : ''}`,
  };
}

/** Sent to RSVPs shortly before the event. */
export function eventReminder(e: EventItem, r: Recipient): RenderedEmail {
  const body = `${eventBlock(e, r.firstName ? `A reminder for you, ${r.firstName}` : 'A reminder')}
<div style="padding:0 34px 18px;">${button('EVENT DETAILS', `${SITE}/events/${e.slug}`)}</div>
${calendarLinks(e)}
${r.manageUrl ? `<div style="font-family:${SERIF};font-size:13px;color:#8a8888;text-align:center;padding:0 34px 26px;">Plans changed? <a href="${esc(r.manageUrl)}" style="color:#8a8888;">Cancel your RSVP</a></div>` : ''}`;
  return {
    subject: `Reminder: ${e.title}`,
    preheader: `${formatRange(e.startsAt, e.endsAt)} · ${e.locationName}`,
    html: shell({ preheader: `${formatRange(e.startsAt, e.endsAt)} · ${e.locationName}`, body, footer: `You’re receiving this because you RSVP’d.<br><a href="${SITE}" style="color:#8a8888;">austinunion.org</a>` }),
    text: `Reminder: ${e.title}\n${formatRange(e.startsAt, e.endsAt)}\n${e.locationName}${e.address ? `, ${e.address}` : ''}\n\n${SITE}/events/${e.slug}${r.manageUrl ? `\nCancel: ${r.manageUrl}` : ''}`,
  };
}
