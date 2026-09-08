-- Birthday invitation template — full schema, policies and storage setup.
-- Run once in the Supabase SQL editor. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'rsvp_method') then
    create type public.rsvp_method as enum ('google_form', 'supabase');
  end if;
  if not exists (select 1 from pg_type where typname = 'attendance_status') then
    create type public.attendance_status as enum ('attending', 'not_attending');
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Settings tables are singletons: `id = 1` is enforced by a CHECK constraint so
-- the client can upsert idempotently and two admin tabs can never create
-- competing rows.

create table if not exists public.event_settings (
  id                integer primary key default 1 check (id = 1),
  celebrant_name    text        not null check (length(trim(celebrant_name)) between 1 and 80),
  age               smallint    check (age between 0 and 130),
  birthday_date     date,
  event_date        date        not null,
  start_time        time,
  end_time          time,
  venue             text        not null check (length(trim(venue)) between 1 and 120),
  address           text        not null check (length(trim(address)) between 1 and 200),
  dress_code        text        check (length(dress_code) <= 80),
  description       text        check (length(description) <= 600),
  birthday_message  text        check (length(birthday_message) <= 600),
  additional_info   text        check (length(additional_info) <= 600),
  google_maps_url   text        check (google_maps_url ~* '^https?://'),
  rsvp_url          text        check (rsvp_url ~* '^https?://'),
  rsvp_method       public.rsvp_method not null default 'google_form',
  rsvp_deadline     date,
  rsvp_note         text        check (length(rsvp_note) <= 600),
  seo_title         text        check (length(seo_title) <= 70),
  seo_description   text        check (length(seo_description) <= 200),
  og_image_url      text        check (og_image_url ~* '^https?://'),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint event_settings_time_order check (end_time is null or start_time is null or end_time > start_time)
);

-- Bring existing projects up to date (no-op on a fresh database).
alter table public.event_settings add column if not exists rsvp_note text;

create table if not exists public.hero_settings (
  id                  integer primary key default 1 check (id = 1),
  label               text    check (length(label) <= 60),
  title               text    not null check (length(trim(title)) between 1 and 80),
  subtitle            text    check (length(subtitle) <= 200),
  image_url           text    check (image_url ~* '^https?://'),
  image_path          text,
  primary_cta_text    text    not null default 'View invitation' check (length(primary_cta_text) <= 30),
  secondary_cta_text  text    not null default 'RSVP now' check (length(secondary_cta_text) <= 30),
  show_countdown      boolean not null default true,
  theme               text    not null default 'midnight' check (theme in ('midnight', 'rosewood', 'forest', 'noir', 'ocean')),
  updated_at          timestamptz not null default now()
);

-- Bring existing projects up to date (no-op on a fresh database).
alter table public.hero_settings add column if not exists theme text not null default 'midnight';

create table if not exists public.about_settings (
  id                integer primary key default 1 check (id = 1),
  title             text not null default 'About the celebrant' check (length(trim(title)) between 1 and 80),
  greeting          text check (length(greeting) <= 120),
  description       text check (length(description) <= 900),
  birthday_message  text check (length(birthday_message) <= 600),
  image_url         text check (image_url ~* '^https?://'),
  image_path        text,
  updated_at        timestamptz not null default now()
);

create table if not exists public.gallery (
  id            uuid primary key default gen_random_uuid(),
  image_url     text    not null check (image_url ~* '^https?://'),
  storage_path  text    not null unique,
  caption       text    check (length(caption) <= 200),
  display_order integer not null default 0,
  is_visible    boolean not null default true,
  width         integer check (width > 0),
  height        integer check (height > 0),
  created_at    timestamptz not null default now()
);

create index if not exists gallery_public_order_idx
  on public.gallery (is_visible, display_order, created_at);

create table if not exists public.rsvps (
  id              uuid primary key default gen_random_uuid(),
  full_name       text    not null check (length(trim(full_name)) between 2 and 80),
  guest_count     smallint not null default 0 check (guest_count between 0 and 20),
  attendance      public.attendance_status not null,
  contact_number  text    check (length(contact_number) <= 30),
  message         text    check (length(message) <= 500),
  created_at      timestamptz not null default now()
);

create index if not exists rsvps_created_at_idx on public.rsvps (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists event_settings_touch on public.event_settings;
create trigger event_settings_touch before update on public.event_settings
  for each row execute function public.touch_updated_at();

drop trigger if exists hero_settings_touch on public.hero_settings;
create trigger hero_settings_touch before update on public.hero_settings
  for each row execute function public.touch_updated_at();

drop trigger if exists about_settings_touch on public.about_settings;
create trigger about_settings_touch before update on public.about_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- Anonymous visitors: read the invitation, insert an RSVP, nothing else.
-- Authenticated users: full control over content. Any signed-in Supabase Auth
-- user is treated as an admin, so do not enable public sign-ups on this project
-- (Authentication -> Providers -> Email -> disable "Allow new users to sign up").

alter table public.event_settings enable row level security;
alter table public.hero_settings  enable row level security;
alter table public.about_settings enable row level security;
alter table public.gallery        enable row level security;
alter table public.rsvps          enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['event_settings', 'hero_settings', 'about_settings'] loop
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_write', t);

    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_public_read', t
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (true) with check (true)',
      t || '_admin_write', t
    );
  end loop;
end
$$;

drop policy if exists gallery_public_read on public.gallery;
create policy gallery_public_read on public.gallery
  for select to anon
  using (is_visible = true);

drop policy if exists gallery_admin_read on public.gallery;
create policy gallery_admin_read on public.gallery
  for select to authenticated
  using (true);

drop policy if exists gallery_admin_write on public.gallery;
create policy gallery_admin_write on public.gallery
  for all to authenticated
  using (true)
  with check (true);

-- Insert-only for anonymous guests. There is deliberately no anon SELECT
-- policy, so responses stay private; this is why the client inserts without
-- `returning`.
drop policy if exists rsvps_public_insert on public.rsvps;
create policy rsvps_public_insert on public.rsvps
  for insert to anon, authenticated
  with check (
    length(trim(full_name)) between 2 and 80
    and guest_count between 0 and 20
    and (attendance <> 'not_attending' or guest_count = 0)
  );

drop policy if exists rsvps_admin_read on public.rsvps;
create policy rsvps_admin_read on public.rsvps
  for select to authenticated
  using (true);

drop policy if exists rsvps_admin_manage on public.rsvps;
create policy rsvps_admin_manage on public.rsvps
  for delete to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'invitation-media',
  'invitation-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists invitation_media_public_read on storage.objects;
create policy invitation_media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'invitation-media');

drop policy if exists invitation_media_admin_insert on storage.objects;
create policy invitation_media_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'invitation-media');

drop policy if exists invitation_media_admin_update on storage.objects;
create policy invitation_media_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'invitation-media')
  with check (bucket_id = 'invitation-media');

drop policy if exists invitation_media_admin_delete on storage.objects;
create policy invitation_media_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'invitation-media');
