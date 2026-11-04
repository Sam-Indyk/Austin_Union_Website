-- Austin Union — initial schema
--
-- People are the centre of everything: a mailing-list subscriber, an RSVP guest,
-- a member, a voter and an admin are all rows in `people`, so one person never
-- ends up as five disconnected records.
--
-- Access model
--   * Public pages read published content with the anon key (RLS policies below).
--   * Everything visitors submit (sign-ups, RSVPs, ballots, messages) is written
--     by the Next.js server after it validates the request, using the service role.
--   * Admin screens run as the signed-in user; staff policies grant them access.

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- People, staff and memberships
-- ---------------------------------------------------------------------------
create table public.people (
  id uuid primary key default gen_random_uuid(),
  -- Where we send mail. Every address the person uses (including this one)
  -- is listed in person_emails, and any of them can be used to sign in.
  email citext not null unique,
  first_name text,
  last_name text,
  -- Expected UATX graduation year, if known. Used to retire voting membership.
  class_year smallint check (class_year between 2020 and 2100),
  -- Mailing list
  subscribed boolean not null default false,
  subscribed_at timestamptz,
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null unique default gen_random_uuid(),
  source text not null default 'admin'
    check (source in ('mailing_list', 'rsvp', 'message', 'vote', 'wix_import', 'admin', 'signin')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger people_updated before update on public.people for each row execute function public.set_updated_at();
create index people_subscribed_idx on public.people (subscribed) where subscribed;

-- True for UATX addresses, including subdomains (e.g. @student.uaustin.org).
create or replace function public.is_uatx_email(e text) returns boolean
language sql immutable as $$ select lower(e) ~ '@([a-z0-9-]+\.)*uaustin\.org$' $$;

-- All addresses a person uses. Signing in with any verified address reaches the
-- same person, so someone with a Google account, a UATX account and a personal
-- address has one record, not three.
create table public.person_emails (
  email citext primary key,
  person_id uuid not null references public.people (id) on delete cascade,
  -- Set once they have proven they control it (signed in with it, or entered a code sent to it).
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create index person_emails_person_idx on public.person_emails (person_id);

-- Keep the contact address listed among the person's addresses.
create or replace function public.sync_primary_email() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.person_emails (email, person_id) values (new.email, new.id)
  on conflict (email) do nothing;
  return new;
end $$;
create trigger people_primary_email after insert or update of email on public.people
  for each row execute function public.sync_primary_email();

-- A person can have several logins (e.g. Google with one address, an email code
-- with another); each login belongs to exactly one person.
create table public.auth_links (
  user_id uuid primary key references auth.users (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index auth_links_person_idx on public.auth_links (person_id);

-- Short-lived codes for verifying an extra address (and other email checks).
create table public.email_codes (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  purpose text not null check (purpose in ('link_email', 'vote')),
  person_id uuid references public.people (id) on delete cascade,
  code_hash text not null,
  attempts smallint not null default 0,
  expires_at timestamptz not null default now() + interval '15 minutes',
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index email_codes_lookup_idx on public.email_codes (email, purpose) where used_at is null;

-- Is this person a verified UATX student address holder?
create or replace function public.has_verified_uatx(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.person_emails where person_id = p and verified_at is not null and public.is_uatx_email(email))
$$;

create type public.staff_role as enum ('editor', 'admin');

-- Who can use the admin. Editors manage content, events, votes and the inbox;
-- admins can also manage members, staff and settings.
create table public.staff (
  person_id uuid primary key references public.people (id) on delete cascade,
  role public.staff_role not null default 'editor',
  created_at timestamptz not null default now()
);

create type public.membership_kind as enum (
  'voting',    -- UATX student; votes in Union elections
  'associate', -- paid / outside member; access to member events
  'honorary'   -- past leadership, speakers, alumni; never expires
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  kind public.membership_kind not null,
  status text not null default 'active' check (status in ('active', 'lapsed', 'revoked')),
  honorary_reason text check (honorary_reason in ('past_leadership', 'speaker', 'alumni', 'other')),
  starts_on date not null default current_date,
  -- Paid memberships: renewal date. Voting: derived from class_year.
  ends_on date,
  granted_by uuid references public.people (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (person_id, kind),
  check (kind = 'honorary' or honorary_reason is null)
);
create trigger memberships_updated before update on public.memberships for each row execute function public.set_updated_at();

-- A membership counts if it is active and not past its end date.
create or replace function public.membership_is_current(m public.memberships) returns boolean
language sql stable as $$
  select m.status = 'active' and (m.ends_on is null or m.ends_on >= current_date)
$$;

-- ---------------------------------------------------------------------------
-- Auth helpers (used by RLS policies)
-- ---------------------------------------------------------------------------
create or replace function public.current_person_id() returns uuid
language sql stable security definer set search_path = public as $$
  select person_id from public.auth_links where user_id = auth.uid()
$$;

create or replace function public.is_staff(min_role public.staff_role default 'editor') returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff s join public.auth_links a on a.person_id = s.person_id
    where a.user_id = auth.uid() and s.role >= min_role
  )
$$;

-- True if the signed-in user holds a current membership of one of `kinds`
-- (any kind when `kinds` is null).
create or replace function public.has_membership(kinds public.membership_kind[] default null) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.memberships m join public.auth_links a on a.person_id = m.person_id
    where a.user_id = auth.uid()
      and public.membership_is_current(m)
      and (kinds is null or m.kind = any (kinds))
  )
$$;

-- When a login is created (first Google sign-in or email code), attach it to the
-- person who owns that address, or create a person. Either way the address is
-- now verified: they just proved they control it.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_email citext := lower(new.email);
  v_person uuid;
  v_first text := coalesce(new.raw_user_meta_data ->> 'given_name', split_part(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ' ', 1));
  v_last text := coalesce(new.raw_user_meta_data ->> 'family_name', nullif(regexp_replace(coalesce(new.raw_user_meta_data ->> 'full_name', ''), '^\S+\s*', ''), ''));
begin
  if v_email is null or v_email = '' then
    return new;
  end if;
  select person_id into v_person from public.person_emails where email = v_email;
  if v_person is null then
    insert into public.people (email, first_name, last_name, source)
    values (v_email, nullif(v_first, ''), nullif(v_last, ''), 'signin')
    returning id into v_person;
  else
    update public.people
       set first_name = coalesce(first_name, nullif(v_first, '')),
           last_name = coalesce(last_name, nullif(v_last, ''))
     where id = v_person;
  end if;
  update public.person_emails set verified_at = coalesce(verified_at, now()) where email = v_email;
  insert into public.auth_links (user_id, person_id) values (new.id, v_person)
  on conflict (user_id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Voting membership follows the student's class year: it ends on June 1 of
-- their graduation year unless an admin sets another date.
create or replace function public.default_voting_end() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_year smallint;
begin
  if new.kind = 'voting' and new.ends_on is null then
    select class_year into v_year from public.people where id = new.person_id;
    if v_year is not null then
      new.ends_on := make_date(v_year, 6, 1);
    end if;
  end if;
  return new;
end $$;

create trigger memberships_voting_end before insert or update on public.memberships
  for each row execute function public.default_voting_end();

-- Daily: graduates' voting membership lapses and they become honorary alumni.
create or replace function public.retire_graduates() returns int
language plpgsql security definer set search_path = public as $$
declare
  v_count int;
begin
  with lapsed as (
    update public.memberships set status = 'lapsed'
     where kind = 'voting' and status = 'active' and ends_on < current_date
    returning person_id
  )
  insert into public.memberships (person_id, kind, honorary_reason, notes)
  select person_id, 'honorary', 'alumni', 'Automatically granted on graduation' from lapsed
  on conflict (person_id, kind) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

create extension if not exists pg_cron;
select cron.schedule('retire-graduates', '15 6 * * *', 'select public.retire_graduates()');

-- ---------------------------------------------------------------------------
-- Site content (fixed-structure pages are JSON documents validated by the app)
-- ---------------------------------------------------------------------------
create table public.site_content (
  key text primary key check (key in ('settings', 'home', 'mission', 'team_page', 'donate', 'contact', 'collage_banner')),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.people (id) on delete set null
);
create trigger site_content_updated before update on public.site_content for each row execute function public.set_updated_at();

-- Leadership shown on the Team page.
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references public.people (id) on delete set null,
  name text not null,
  role text not null,
  email text,
  photo jsonb not null,
  x_url text,
  linkedin_url text,
  sort_order int not null default 0,
  active boolean not null default true,
  started_on date,
  ended_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger team_members_updated before update on public.team_members for each row execute function public.set_updated_at();

-- Everyone who has served in leadership becomes an honorary member when they
-- leave the Team page (removed, or marked inactive).
create or replace function public.grant_past_leadership() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_person uuid := coalesce(old.person_id, new.person_id);
begin
  if v_person is null then
    return coalesce(new, old);
  end if;
  if tg_op = 'DELETE' or (old.active and not new.active) then
    insert into public.memberships (person_id, kind, honorary_reason, notes)
    values (v_person, 'honorary', 'past_leadership', 'Former ' || old.role)
    on conflict (person_id, kind) do update
      set status = 'active', ends_on = null,
          honorary_reason = coalesce(public.memberships.honorary_reason, 'past_leadership');
  end if;
  return coalesce(new, old);
end $$;

create trigger team_members_past_leadership after update or delete on public.team_members
  for each row execute function public.grant_past_leadership();

-- Homepage banner photos (composed into one image whenever they change).
create table public.collage_photos (
  id uuid primary key default gen_random_uuid(),
  src text not null,
  width int not null,
  height int not null,
  focal_x real not null default 50,
  focal_y real not null default 50,
  emphasis real not null default 1 check (emphasis between 0.3 and 4),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Events and RSVPs
-- ---------------------------------------------------------------------------
create type public.event_status as enum ('draft', 'published', 'cancelled');
create type public.event_visibility as enum ('public', 'members', 'unlisted');

create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  status public.event_status not null default 'draft',
  publish_at timestamptz,
  visibility public.event_visibility not null default 'public',
  -- For members-only events: which kinds may see/RSVP (null = any member).
  member_kinds public.membership_kind[],
  title text not null,
  summary text not null default '',
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location_name text not null default '',
  address text,
  image jsonb not null,
  rsvp_mode text not null default 'native' check (rsvp_mode in ('native', 'none')),
  rsvp_closes_at timestamptz,
  capacity int check (capacity > 0),
  -- {"kind":"swoogo","url":"…","swoogoEventId":"…"}
  partner jsonb,
  feature_on_home boolean not null default true,
  home_card jsonb,
  recap jsonb,
  created_by uuid references public.people (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create trigger events_updated before update on public.events for each row execute function public.set_updated_at();
create index events_starts_idx on public.events (starts_at desc);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  person_id uuid references public.people (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email citext not null,
  status text not null default 'going' check (status in ('going', 'waitlist', 'cancelled')),
  guests smallint not null default 0 check (guests between 0 and 10),
  checked_in_at timestamptz,
  checked_in_by uuid references public.people (id) on delete set null,
  -- Registration with the partner (UATX / Swoogo) for co-hosted events.
  partner_status text not null default 'not_needed'
    check (partner_status in ('not_needed', 'handoff', 'pending', 'registered', 'failed')),
  partner_ref text,
  partner_error text,
  manage_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, email)
);
create trigger rsvps_updated before update on public.rsvps for each row execute function public.set_updated_at();
create index rsvps_event_idx on public.rsvps (event_id);

-- ---------------------------------------------------------------------------
-- Inbox
-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references public.people (id) on delete set null,
  name text not null default '',
  email citext not null,
  body text not null,
  page text not null default '/',
  read_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_open_idx on public.messages (created_at desc) where archived_at is null;

-- ---------------------------------------------------------------------------
-- Members-only pages
-- ---------------------------------------------------------------------------
create table public.member_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  body text not null default '',
  -- Which membership kinds may read it (null = any current member).
  member_kinds public.membership_kind[],
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger member_pages_updated before update on public.member_pages for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Email
-- ---------------------------------------------------------------------------
create table public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('announcement', 'reminder', 'recap', 'custom')),
  event_id uuid references public.events (id) on delete cascade,
  vote_id uuid,
  subject text not null,
  -- Editable content blocks rendered into the shared email template.
  content jsonb not null default '{}',
  -- {"type":"subscribers"} | {"type":"rsvps","eventId":…} | {"type":"members","kinds":[…]}
  audience jsonb not null default '{"type":"subscribers"}',
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_by uuid references public.people (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger email_campaigns_updated before update on public.email_campaigns for each row execute function public.set_updated_at();
create index email_campaigns_due_idx on public.email_campaigns (scheduled_at) where status = 'scheduled';

create table public.email_sends (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.email_campaigns (id) on delete cascade,
  person_id uuid references public.people (id) on delete set null,
  email citext not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'bounced', 'complained')),
  provider_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, email)
);

-- ---------------------------------------------------------------------------
-- Votes
-- ---------------------------------------------------------------------------
-- single:   one round of voting.
-- pre_post: an initial vote, results, a final vote, final results — all from the
--           same link. With winner_rule = 'swing' the side that gained the most
--           support between rounds wins (the usual debate-society rule).
create type public.vote_format as enum ('single', 'pre_post');
create type public.vote_phase as enum ('draft', 'initial_open', 'initial_closed', 'final_open', 'closed');
create type public.vote_eligibility as enum ('anyone', 'signed_in', 'uaustin', 'members');
create type public.results_visibility as enum ('live', 'after_round', 'after_close', 'admins_only');
create type public.winner_rule as enum ('plurality', 'swing', 'none');

create table public.votes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null,
  resolution text not null,
  description text not null default '',
  event_id uuid references public.events (id) on delete set null,
  format public.vote_format not null default 'single',
  -- For pre_post votes the default is 'swing': the side whose share of the vote grew most.
  winner_rule public.winner_rule not null default 'plurality',
  phase public.vote_phase not null default 'draft',
  phase_changed_at timestamptz,
  eligibility public.vote_eligibility not null default 'anyone',
  member_kinds public.membership_kind[],
  results_visibility public.results_visibility not null default 'after_round',
  -- When true, admins see totals only — never who voted for what.
  is_anonymous boolean not null default true,
  allow_change boolean not null default true,
  feature_on_home boolean not null default false,
  -- Optional automatic schedule (otherwise the phase is advanced by hand, live).
  opens_at timestamptz,
  closes_at timestamptz,
  created_by uuid references public.people (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (format = 'pre_post' or winner_rule <> 'swing')
);
create trigger votes_updated before update on public.votes for each row execute function public.set_updated_at();

alter table public.email_campaigns
  add constraint email_campaigns_vote_fk foreign key (vote_id) references public.votes (id) on delete cascade;

create table public.vote_options (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes (id) on delete cascade,
  label text not null,
  description text,
  color text check (color ~ '^#[0-9a-fA-F]{6}$'),
  -- 'side' options can win; 'neutral' ones (e.g. Undecided) are counted but never win.
  role text not null default 'side' check (role in ('side', 'neutral')),
  sort_order int not null default 0
);
create index vote_options_vote_idx on public.vote_options (vote_id, sort_order);

create table public.ballots (
  id bigint generated always as identity primary key,
  vote_id uuid not null references public.votes (id) on delete cascade,
  round smallint not null check (round in (1, 2)),
  option_id uuid not null references public.vote_options (id) on delete cascade,
  -- Stable per voter: an HMAC of their signed-in person id, or of a device token
  -- for open ('anyone') votes. Lets a voter's initial and final ballots be paired
  -- without storing who they are.
  voter_key text not null,
  -- Only recorded for non-anonymous votes.
  person_id uuid references public.people (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vote_id, round, voter_key)
);
create trigger ballots_updated before update on public.ballots for each row execute function public.set_updated_at();
create index ballots_vote_idx on public.ballots (vote_id, round);

-- Totals per option per round, plus how voters moved between rounds.
create or replace function public.vote_tally(p_vote uuid)
returns table (round smallint, option_id uuid, ballots bigint)
language sql stable security definer set search_path = public as $$
  select b.round, b.option_id, count(*) from public.ballots b
  where b.vote_id = p_vote group by b.round, b.option_id
$$;

create or replace function public.vote_transitions(p_vote uuid)
returns table (from_option uuid, to_option uuid, voters bigint)
language sql stable security definer set search_path = public as $$
  select i.option_id, f.option_id, count(*)
  from public.ballots i
  join public.ballots f on f.vote_id = i.vote_id and f.voter_key = i.voter_key and f.round = 2
  where i.vote_id = p_vote and i.round = 1
  group by i.option_id, f.option_id
$$;

revoke execute on function public.vote_tally(uuid) from anon, authenticated;
revoke execute on function public.vote_transitions(uuid) from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.people enable row level security;
alter table public.person_emails enable row level security;
alter table public.auth_links enable row level security;
alter table public.email_codes enable row level security;
alter table public.staff enable row level security;
alter table public.memberships enable row level security;
alter table public.site_content enable row level security;
alter table public.team_members enable row level security;
alter table public.collage_photos enable row level security;
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.messages enable row level security;
alter table public.member_pages enable row level security;
alter table public.email_campaigns enable row level security;
alter table public.email_sends enable row level security;
alter table public.votes enable row level security;
alter table public.vote_options enable row level security;
alter table public.ballots enable row level security;

-- People: staff manage; everyone can read their own record.
create policy people_self_read on public.people for select to authenticated using (id = public.current_person_id());
create policy person_emails_self_read on public.person_emails for select to authenticated using (person_id = public.current_person_id());
create policy person_emails_staff_all on public.person_emails for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy auth_links_self_read on public.auth_links for select to authenticated using (user_id = auth.uid());
create policy auth_links_staff_read on public.auth_links for select to authenticated using (public.is_staff());
-- email_codes: no policies — only the server (service role) touches them.
create policy people_staff_all on public.people for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Staff list: staff can see it; only admins change it.
create policy staff_read on public.staff for select to authenticated using (public.is_staff());
create policy staff_admin_write on public.staff for all to authenticated using (public.is_staff('admin')) with check (public.is_staff('admin'));

-- Memberships: own rows readable; admins manage.
create policy memberships_self_read on public.memberships for select to authenticated using (person_id = public.current_person_id());
create policy memberships_staff_read on public.memberships for select to authenticated using (public.is_staff());
create policy memberships_admin_write on public.memberships for all to authenticated using (public.is_staff('admin')) with check (public.is_staff('admin'));

-- Public site content.
create policy site_content_public_read on public.site_content for select to anon, authenticated using (true);
create policy site_content_staff_write on public.site_content for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy team_public_read on public.team_members for select to anon, authenticated using (active or public.is_staff());
create policy team_staff_write on public.team_members for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy collage_public_read on public.collage_photos for select to anon, authenticated using (true);
create policy collage_staff_write on public.collage_photos for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- Events: published public events for everyone; members-only for the right members; staff see all.
create policy events_public_read on public.events for select to anon, authenticated
  using (status <> 'draft' and (publish_at is null or publish_at <= now()) and visibility in ('public', 'unlisted'));
create policy events_member_read on public.events for select to authenticated
  using (status <> 'draft' and (publish_at is null or publish_at <= now()) and visibility = 'members' and public.has_membership(member_kinds));
create policy events_staff_all on public.events for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy rsvps_self_read on public.rsvps for select to authenticated using (person_id = public.current_person_id());
create policy rsvps_staff_all on public.rsvps for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy messages_staff_all on public.messages for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy member_pages_member_read on public.member_pages for select to authenticated
  using (published and public.has_membership(member_kinds));
create policy member_pages_staff_all on public.member_pages for all to authenticated using (public.is_staff()) with check (public.is_staff());

create policy campaigns_staff_all on public.email_campaigns for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy sends_staff_read on public.email_sends for select to authenticated using (public.is_staff());

-- Votes: anything past draft is publicly visible (results are filtered by the app
-- according to results_visibility); ballots are written only by the server.
create policy votes_public_read on public.votes for select to anon, authenticated using (phase <> 'draft');
create policy votes_staff_all on public.votes for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy vote_options_public_read on public.vote_options for select to anon, authenticated
  using (exists (select 1 from public.votes v where v.id = vote_id and v.phase <> 'draft'));
create policy vote_options_staff_all on public.vote_options for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy ballots_staff_read on public.ballots for select to authenticated
  using (public.is_staff() and exists (select 1 from public.votes v where v.id = vote_id and not v.is_anonymous));

-- ---------------------------------------------------------------------------
-- Storage: public bucket for site images (uploads go through the server)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Server-side write helpers (service role only)
-- ---------------------------------------------------------------------------
-- Adds or updates a contact. p_opt_in:
--   'explicit' — they asked to join the list (re-subscribes even after unsubscribing)
--   'implicit' — e.g. an RSVP: subscribes unless they previously unsubscribed
--   'none'     — e.g. a message: never changes their subscription
create or replace function public.upsert_contact(
  p_email text, p_first text, p_last text, p_source text, p_opt_in text default 'none'
) returns table (person_id uuid, created boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_created boolean := false;
begin
  select person_id into v_id from public.person_emails where email = lower(p_email);
  if v_id is null then
    insert into public.people (email, first_name, last_name, source, subscribed, subscribed_at)
    values (lower(p_email), nullif(p_first, ''), nullif(p_last, ''), p_source, p_opt_in <> 'none', case when p_opt_in <> 'none' then now() end)
    on conflict (email) do nothing
    returning id into v_id;
    v_created := v_id is not null;
    if v_id is null then
      select id into v_id from public.people where email = lower(p_email);
    end if;
  end if;
  if not v_created then
    update public.people set
      first_name = coalesce(first_name, nullif(p_first, '')),
      last_name = coalesce(last_name, nullif(p_last, '')),
      subscribed = case
        when p_opt_in = 'explicit' then true
        when p_opt_in = 'implicit' and unsubscribed_at is null then true
        else subscribed end,
      subscribed_at = case
        when not subscribed and (p_opt_in = 'explicit' or (p_opt_in = 'implicit' and unsubscribed_at is null)) then now()
        else subscribed_at end,
      unsubscribed_at = case when p_opt_in = 'explicit' then null else unsubscribed_at end
    where id = v_id;
  end if;
  return query select v_id, v_created;
end $$;

revoke execute on function public.upsert_contact(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.upsert_contact(text, text, text, text, text) to service_role;
