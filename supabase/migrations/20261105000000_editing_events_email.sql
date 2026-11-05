-- Edit mode history, event email settings, campaign bookkeeping.

-- ---------------------------------------------------------------------------
-- Every change to a page's content keeps the previous version, so any edit can
-- be undone from the editor.
-- ---------------------------------------------------------------------------
create table public.site_content_revisions (
  id bigint generated always as identity primary key,
  key text not null,
  value jsonb not null,
  saved_by uuid references public.people (id) on delete set null,
  created_at timestamptz not null default now()
);
create index site_content_revisions_key_idx on public.site_content_revisions (key, created_at desc);
alter table public.site_content_revisions enable row level security;
create policy revisions_staff_read on public.site_content_revisions for select to authenticated using (public.is_staff());

-- Team members and collage photos are rows, not documents; their edits are
-- tracked with the same table under keys 'team_members' / 'collage_photos'
-- (value = the full list before the change).

-- ---------------------------------------------------------------------------
-- Events: announcement + reminder settings
-- ---------------------------------------------------------------------------
alter table public.events
  add column announce boolean not null default true,      -- email the list when it goes live
  add column reminder_hours smallint default 24            -- remind RSVPs this many hours before (null = never)
    check (reminder_hours is null or reminder_hours between 1 and 336);

-- ---------------------------------------------------------------------------
-- Campaign bookkeeping
-- ---------------------------------------------------------------------------
alter table public.email_campaigns
  add column sent_count int not null default 0,
  add column failed_count int not null default 0,
  add column last_error text,
  add column started_at timestamptz;

-- One automatic campaign of each kind per event (announcement, reminder).
create unique index email_campaigns_event_kind_idx on public.email_campaigns (event_id, kind)
  where event_id is not null and kind in ('announcement', 'reminder');

-- ---------------------------------------------------------------------------
-- Contact imports (e.g. the Wix contact export)
-- ---------------------------------------------------------------------------
create table public.contact_imports (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  total int not null default 0,
  created int not null default 0,
  updated int not null default 0,
  skipped int not null default 0,
  imported_by uuid references public.people (id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.contact_imports enable row level security;
create policy contact_imports_staff_read on public.contact_imports for select to authenticated using (public.is_staff());
