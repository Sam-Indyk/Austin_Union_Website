# austinunion.org

A rebuild of the Austin Union website (currently on Wix) that looks the same but is
easy to keep current: events appear on the homepage and move to Past Events on
their own, RSVPs and sign-ups land in our own database, and announcement emails go
out automatically.

## Status

**Phase 1 — public site (done).** Every page from the Wix site, matched to it at
desktop width (within a few pixels) and with a cleaner phone layout. Content is read
from `src/lib/content/seed.ts` through `src/lib/content/repo.ts`.

**Phase 2 — database (in progress).** Local Supabase with the full schema; the site
reads content from it and forms (mailing list, RSVPs, contact) write to it.

**Next:** sign-in (Google for @uaustin.org + email links), the admin edit mode,
votes, members and members-only pages, announcement/reminder emails, the Wix
contact import, Swoogo registration for UATX events.

## Running it

```bash
npm install
npm run fonts:fetch   # licensed display fonts; not committed
npm run db:start      # local Supabase in Docker (first run downloads ~10 GB of images)
cp .env.example .env.local   # then paste the keys `npm run db:start` printed
npm run db:reset && npm run db:seed   # schema + the content from the Wix site
npm run dev           # http://localhost:3000
```

Without `.env.local` the site still runs, serving the built-in seed content and
saving form submissions to `.data/dev-db.json`.

Local services: Supabase Studio (browse/edit tables) at http://127.0.0.1:54323,
and Mailpit (catches every email the local site sends, e.g. sign-in links) at
http://127.0.0.1:54324.

`ADMIN_EMAILS=you@example.org npm run db:seed` makes those people admins.

## Database

The schema is in `supabase/migrations/`. Highlights:

- **people** — one row per human: subscribers, RSVP guests, members, voters, staff.
  Sign-ins are linked by email; signing in with an @uaustin.org address verifies it.
- **memberships** — a person can hold several at once: `voting` (UATX students),
  `associate` (paid/outside), `honorary` (past leadership, speakers, alumni).
  Leaving the Team page grants honorary membership automatically; voting
  membership ends on June 1 of the class year and the member becomes honorary
  alumni (daily job).
- **events / rsvps** — with members-only visibility, capacity, check-in, and
  partner (Swoogo) registration status.
- **votes / vote_options / ballots** — single-round or initial-and-final
  ("swing") votes, configurable eligibility, result visibility and anonymity.
- **messages**, **member_pages**, **email_campaigns / email_sends**, **site_content**.

Row level security is on for every table. Public pages read with the anon key;
visitor submissions are written by the server with the service role after
validation; admin screens act as the signed-in user.

## Where things live

| Path | What |
| --- | --- |
| `src/app/(site)/` | Pages. Wix URLs are kept (`/events-1`, `/about-4`, `/contact-8`, `/events/<slug>`) so old links still work. |
| `src/lib/content/types.ts` | The content model (mirrors the future database tables). |
| `src/lib/content/seed.ts` | Content transcribed from the Wix site. |
| `src/lib/content/repo.ts` | All reads. Cached; event data refreshes every minute. |
| `src/lib/collage-layout.ts` | Arranges the homepage banner photos automatically. |
| `src/lib/collage-render.ts` | Composes those photos into one banner image + blurred preview. |
| `scripts/build-media.ts` | `npm run media:build` — rebuilds the seed banner and image previews. |
| `src/app/actions.ts` | Form handlers (sign-up, message, RSVP). |
| `src/lib/store/` | Where submissions are saved (Supabase, or a local file without it). |
| `src/lib/supabase/` | Supabase clients and generated database types (`npm run db:types`). |
| `supabase/` | Local Supabase config and SQL migrations. |
| `scripts/seed-db.ts` | `npm run db:seed` — loads the Wix content into the database. |
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
