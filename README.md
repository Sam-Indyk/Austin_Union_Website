# austinunion.org

A rebuild of the Austin Union website (currently on Wix) that looks the same but is
easy to keep current: events appear on the homepage and move to Past Events on
their own, RSVPs and sign-ups land in our own database, and announcement emails go
out automatically.

## Status

**Phase 1 — public site (done).** Every page from the Wix site, matched to it at
desktop width (within a few pixels) and with a cleaner phone layout. Content is read
from `src/lib/content/seed.ts` through `src/lib/content/repo.ts`.

Forms (mailing list, RSVPs, the "Let's Chat!" box, contact forms) work locally and
save to `.data/dev-db.json`. They refuse to run in production until the database is
connected.

**Next:** Supabase (database, logins, photo storage), the admin edit mode,
announcement and reminder emails, the Wix contact import, Swoogo registration for
UATX events, member accounts, votes, and members-only pages.

## Running it

```bash
npm install
node scripts/fetch-wix-fonts.mjs   # licensed display fonts; not committed
npm run dev                        # http://localhost:3000
```

## Where things live

| Path | What |
| --- | --- |
| `src/app/(site)/` | Pages. Wix URLs are kept (`/events-1`, `/about-4`, `/contact-8`, `/events/<slug>`) so old links still work. |
| `src/lib/content/types.ts` | The content model (mirrors the future database tables). |
| `src/lib/content/seed.ts` | Content transcribed from the Wix site. |
| `src/lib/content/repo.ts` | All reads. Cached; event data refreshes every minute. |
| `src/lib/collage-layout.ts` | Arranges the homepage banner photos automatically. |
| `src/app/actions.ts` | Form handlers (sign-up, message, RSVP). |
| `src/lib/store/` | Where submissions are saved (a local file until Supabase). |
| `scripts/import-wix-media.mjs` | One-off copy of the Wix images into `public/media`. |

## How events behave

- An event is **upcoming** until its end time, then automatically **past**.
- Upcoming events with "feature on home" show in the homepage card (several rotate).
  The card also re-checks end times in the visitor's browser, so a cached page never
  shows a finished event.
- Times are entered and shown in Austin time (America/Chicago).
- Past events can carry a recap: summary, YouTube recording, photo gallery.

## Fonts

The headings use **WF Neue Ohio Schrift** (and two ornament fonts) from Walden
Font Co., which were uploaded to Wix. Confirm the web license before the files are
committed or deployed; without them the site falls back to EB Garamond.
