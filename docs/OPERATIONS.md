# Running austinunion.org

How the website is set up so it keeps working year after year, as officers
graduate and their email accounts are shut down. Written for the President and
whoever looks after the website.

**The rule:** every service the site depends on is owned by a permanent
society account, never by a person. People get access as *members* of those
services, and that access is removed when they hand over.

---

## 1. The permanent account: `austinunion@austinunion.org`

Create one Google Workspace user that belongs to the society itself, not to any
officer. It uses one of the paid seats (about $7–8.40 a month).

- **Name:** `austinunion@austinunion.org`. Any lasting name works (`admin@`,
  `web@`), as long as it isn't a person's name or a year.
- **Role:** make it a Workspace **super admin**. Keep the President's account
  as the second super admin. Google recommends at least two, so one can recover
  the other.
- **Sign-in security:** use 2-step verification with **two hardware security
  keys** (about $25 each), not a phone number. One key goes to the President;
  the other is stored by a second person who stays around, such as the
  Treasurer or the faculty advisor. Print the **backup codes** and store them
  with the second key.
- **Recovery email:** a long-lived address outside the domain, for example the
  faculty advisor's, rather than a student's personal Gmail.
- **The password** lives in the shared password manager (below), not in
  anyone's head.

Use this account to sign up for every service in section 2. Then invite the
current officers to each one with their own logins.

### Officer addresses that survive handover

Make officer titles into **Google Groups** (free): `president@`, `treasurer@`,
`events@`, `hello@`. Each group delivers to whoever holds the role now. On
handover you change who is in the group, and the address stays the same. Print
these addresses on flyers and in the Swoogo and UATX contacts, rather than
personal addresses.

Optionally, the paid leadership seats themselves can be role accounts
(`president@` as a real mailbox instead of a personal one like `jane@`). The mail history and
Drive files then pass to the successor along with the password. Either
approach works; the permanent account above is what matters.

### Shared password manager

Use a shared password manager: Bitwarden (free for two people, or Teams at
about $4 per user per month) or 1Password Teams. Create one vault, "Austin
Union — Web", that holds:

- the permanent account's password and backup codes;
- the registrar, GitHub, Vercel, Supabase, Google Cloud and Stripe logins;
- the website's secrets: `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`,
  `VOTE_SECRET`, the Google client secret and the SMTP password.

Outgoing officers are removed from the vault on handover.

---

## 2. Who owns what

| Service | What it does | Owner | Officers' access | Cost |
|---|---|---|---|---|
| **Domain registrar** | `austinunion.org` itself | permanent account | none needed | about $10–20 a year |
| **Google Workspace** | email, groups, sign-in | permanent account (super admin) | their own accounts | the seats you already pay for |
| **GitHub** | the website's code | an organisation, e.g. `austin-union` | members | free |
| **Vercel** | runs the website | team owned by the permanent account | members | free (Hobby) or $20 a month (Pro) |
| **Supabase** | database, sign-in, photo storage | organisation owned by the permanent account | members | free, or $25 a month (Pro) |
| **Google Cloud** | the "Continue with Google" button only | project under the austinunion.org organisation | none needed | free |
| **Stripe** (later) | dues and donations | permanent account | team members | per transaction |

Prices are as of November 2026; check before signing up.

**Recommended at launch:**

- **Supabase:** use Pro ($25 a month). Free projects are paused after about a
  week without activity, which would take the site down during summer. Pro
  also includes daily backups.
- **Vercel:** the free Hobby plan is meant for personal, non-commercial
  projects. A society site that takes donations is a grey area, so move to Pro
  once Stripe is added.
- **Total:** $25–45 a month, against the $50 Wix costs now, before counting
  the Workspace seats you already pay for.

**Before cancelling Wix**, find out where the domain is registered. If it was
bought through Wix, transfer it out first, to Cloudflare Registrar, Porkbun or
Squarespace, and register it under the permanent account. Turn on auto-renew,
renew for several years, and turn on registrar lock. Losing the domain is the
one mistake that can't be fixed.

**Move the code.** Create the GitHub organisation, then transfer
`Sam-Indyk/Austin_Union_Website` to it (Settings → Transfer). GitHub redirects
the old URL, and Vercel reconnects to the new location.

---

## 3. Getting into the website itself

Admin access on the site belongs to **people**, not to email accounts. Every
person has a record with any number of email addresses, and can sign in with
any of them. Two consequences:

- **Before an officer's `@austinunion.org` or `@student.uaustin.org` mailbox is
  shut down,** they should add a personal address under **Account → Add
  another email**. They keep their membership, honorary status and vote
  history.
- **Grant admin to the incoming officers** in **Officers' Desk → People &
  Members → (person) → Staff access**. Then remove the outgoing ones.

**Break-glass access.** The hosting setting `ADMIN_EMAILS` (kept in Vercel,
not in the database) lists the addresses that are *always* admins. Signing in
with one of them restores admin access, even if every officer was removed in
the app by mistake.

- Put the permanent account there:
  `ADMIN_EMAILS=austinunion@austinunion.org`.
- An address in this list can't be demoted from inside the app; it is restored
  at the next sign-in. That is deliberate, so keep the list short.

Sign-in codes go to whatever inbox the address belongs to, so whoever controls
`austinunion@` can always get in.

---

## 4. Email the site sends

The site sends:

- sign-in codes;
- RSVP confirmations;
- event announcements to the mailing list;
- reminders to guests.

**Use the permanent account's Google Workspace mail to send them.** There's no
new service to pay for, Google sends up to about 2,000 messages a day per
account, and mail from your own domain is trusted.

1. In Workspace Admin → Apps → Gmail → **Authenticate email**, turn on
   **DKIM** for austinunion.org. Make sure the domain's DNS also has SPF
   (`v=spf1 include:_spf.google.com ~all`) and a DMARC record
   (`v=DMARC1; p=none; rua=mailto:austinunion@austinunion.org` to start).
2. Signed in as `austinunion@`, create an **App password** (Google Account →
   Security → 2-Step Verification → App passwords). If that option is missing
   (some Workspace security settings turn it off), use Workspace's **SMTP
   relay** instead (Admin → Apps → Gmail → Routing → SMTP relay service,
   server `smtp-relay.gmail.com`), or a sending service such as Resend.
3. Optional: add `events@austinunion.org` as a "Send mail as" address so
   emails come from the events address.
4. Set these in Vercel:
   ```
   SMTP_URL=smtps://austinunion%40austinunion.org:<app-password>@smtp.gmail.com:465
   EMAIL_FROM="Austin Union <events@austinunion.org>"
   ```
5. In Supabase → Authentication → **SMTP Settings**, enter the same server,
   user and app password. Supabase sends the sign-in codes, and its built-in
   mailer only allows a couple of messages an hour.
6. Fill in the **mailing address** (click the footer in edit mode). US law
   (CAN-SPAM) requires a postal address in announcement emails; a PO box or the
   campus address is fine.

If the list grows past about 1,500, or Google starts rate-limiting, switch to a
sending service such as Resend (free for 100 a day; $20 a month for 50,000) by
changing `SMTP_URL`. Nothing else changes.

### Scheduled emails

Reminders, and announcements for events scheduled to publish later, are sent
by `/api/cron/dispatch`. Something has to call it every few minutes. (An
announcement for an event that goes live right away is sent as soon as it's
saved.) Vercel's free plan only allows daily jobs, so use the database's own
scheduler. In Supabase → SQL Editor, run this once, with your own values:

```sql
create extension if not exists pg_net;

select vault.create_secret('https://austinunion.org', 'site_url');
select vault.create_secret('<the CRON_SECRET from Vercel>', 'cron_secret');

select cron.schedule('send-scheduled-email', '*/5 * * * *', $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'site_url') || '/api/cron/dispatch',
    headers := jsonb_build_object('Authorization', 'Bearer ' ||
      (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    timeout_milliseconds := 120000
  );
$$);
```

To check it's working, look in Supabase → Integrations → Cron → job history,
or at the Emails panel on an event, which shows "Sent · N sent".

---

## 5. "Continue with Google" (optional)

Email codes work for everyone, so this is a convenience. It also lets UATX
students verify their `@student.uaustin.org` address in one click. Do this
while signed in as the permanent account.

1. **Create the project.** Go to console.cloud.google.com and create a project
   called "Austin Union Website" under the **austinunion.org** organisation.
2. **Set up the consent screen.** Open **Google Auth Platform**
   (APIs & Services → OAuth consent screen).
   - **Branding:** app name "Austin Union", support email
     `austinunion@austinunion.org`, the seal as the logo, homepage
     `https://austinunion.org`, and a privacy policy link. Add a short
     `/privacy` page before this step.
   - **Authorized domains:** add `austinunion.org` and `<project-ref>.supabase.co`.
   - **Audience:** choose **External**, so Gmail and `@student.uaustin.org`
     accounts can sign in, not only austinunion.org accounts. Then press
     **Publish app**, which sets it to "In production". The site only asks for
     name and email (openid, email, profile), so Google doesn't need to review
     it.
3. **Create the client.** Under **Clients → Create client**, choose **Web
   application**.
   - Authorized JavaScript origins: `https://austinunion.org` and
     `http://localhost:3000`.
   - Authorized redirect URIs:
     `https://<project-ref>.supabase.co/auth/v1/callback`, plus
     `http://127.0.0.1:54321/auth/v1/callback` for local development.
   - Copy the **client secret** into the password manager straight away.
     Google only shows it once.
4. **Turn it on in Supabase.** Go to Authentication → Sign In / Providers →
   **Google**: enable it and paste the client ID and secret. Under
   Authentication → URL Configuration, set the Site URL to
   `https://austinunion.org` and add `https://austinunion.org/auth/callback` to
   the redirect URLs.
5. **Show the button.** Set `NEXT_PUBLIC_GOOGLE_SIGNIN=on` in Vercel and
   redeploy.
6. **Test with a `@student.uaustin.org` account.** UATX's own Google admin
   controls whether students may use outside apps. If students see "Access
   blocked by your administrator", ask UATX IT to trust this app's client ID.
   Until then, students can sign in with an email code to the same address,
   which verifies it just as well.

For local development, put the ID and secret in `supabase/.env` as
`SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` / `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`,
set `enabled = true` under `[auth.external.google]` in `supabase/config.toml`,
and restart with `npm run db:stop && npm run db:start`.

Optional: Supabase's custom-domain add-on (`auth.austinunion.org`) makes the
Google screen say "continue to austinunion.org" instead of the supabase.co
address.

---

## 6. Handover checklist (each spring)

**Outgoing officers**
- [ ] Add a personal email under Account → Add another email.
- [ ] Get removed from the password-manager vault, GitHub, Vercel, Supabase and
      Stripe teams.
- [ ] Have their Workspace seat renamed (if role-based) or deleted. Move their
      Drive files to the shared drive first.

**Incoming officers**
- [ ] Staff access in People & Members (admin for the President and webmaster,
      editor for others).
- [ ] Added to the officer Google Groups (`president@`, …) and the vault.
- [ ] Team page updated: click a card in edit mode. Leaving the team makes
      someone an honorary member automatically.

**The President**
- [ ] Change the permanent account's password. Pass on the security key and
      check where the second one is.
- [ ] Confirm `ADMIN_EMAILS` in Vercel still lists `austinunion@austinunion.org`.
- [ ] Check the domain's renewal date and the card that pays for it and for
      Supabase and Vercel.
- [ ] Update Stripe's account representative (it must be a real person).

---

## 7. If something breaks

- **Site down.** Check Vercel → Deployments. Redeploying the last good
  deployment takes a minute.
- **Pages load but show nothing new, or forms fail.** Check whether the Supabase
  project is paused (free plan) or over its limits.
- **Emails not arriving.**
  - Look at the event's Emails panel for errors.
  - Look at Supabase → Cron job history.
  - In Google Admin → Reporting → Email log search, check whether Google
    rejected the app password (it stops working when the account's password
    changes).
- **Locked out of the admin.** Sign in with `austinunion@austinunion.org` (see
  section 3).
- **A bad edit.** Every page has **Undo last change** in its edit panel, and
  each save is kept in `site_content_revisions`.
