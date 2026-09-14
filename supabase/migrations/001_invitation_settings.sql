-- Adds the invitation sections to a project that was set up before them.
-- Run in the Supabase SQL editor if the admin shows
-- "The invitation_settings table is missing". Safe to re-run.
-- A fresh project can run supabase/schema.sql instead; it includes all of this.

-- 1. Invitation sections table (singleton row, id = 1)
create table if not exists public.invitation_settings (
  id                    integer primary key default 1 check (id = 1),
  envelope_enabled      boolean not null default true,
  envelope_heading      text check (length(envelope_heading) <= 60),
  hero_tagline          text check (length(hero_tagline) <= 120),
  song_title            text check (length(song_title) <= 80),
  song_subtitle         text check (length(song_subtitle) <= 120),
  song_url              text check (song_url ~* '^https?://'),
  song_path             text,
  countdown_title       text check (length(countdown_title) <= 160),
  countdown_text        text check (length(countdown_text) <= 300),
  countdown_image_url   text check (countdown_image_url ~* '^https?://'),
  countdown_image_path  text,
  banner_text           text check (length(banner_text) <= 120),
  ceremony_title        text check (length(ceremony_title) <= 40),
  ceremony_time         time,
  ceremony_venue        text check (length(ceremony_venue) <= 120),
  ceremony_address      text check (length(ceremony_address) <= 200),
  ceremony_maps_url     text check (ceremony_maps_url ~* '^https?://'),
  reception_title       text check (length(reception_title) <= 40),
  fun_title             text check (length(fun_title) <= 60),
  fun_text              text check (length(fun_text) <= 400),
  ninong                text check (length(ninong) <= 2000),
  ninang                text check (length(ninang) <= 2000),
  gift_guide            text check (length(gift_guide) <= 400),
  reminders             text check (length(reminders) <= 1000),
  photo_image_url       text check (photo_image_url ~* '^https?://'),
  photo_image_path      text,
  save_date_text        text check (length(save_date_text) <= 80),
  closing_letter        text check (length(closing_letter) <= 800),
  closing_signature     text check (length(closing_signature) <= 60),
  closing_image_url     text check (closing_image_url ~* '^https?://'),
  closing_image_path    text,
  updated_at            timestamptz not null default now()
);

-- 2. updated_at maintenance
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

drop trigger if exists invitation_settings_touch on public.invitation_settings;
create trigger invitation_settings_touch before update on public.invitation_settings
  for each row execute function public.touch_updated_at();

-- 3. Row Level Security: anyone reads, signed-in admins write
alter table public.invitation_settings enable row level security;

drop policy if exists invitation_settings_public_read on public.invitation_settings;
create policy invitation_settings_public_read on public.invitation_settings
  for select to anon, authenticated
  using (true);

drop policy if exists invitation_settings_admin_write on public.invitation_settings;
create policy invitation_settings_admin_write on public.invitation_settings
  for all to authenticated
  using (true)
  with check (true);

-- Newer Supabase projects do not expose new tables to the API automatically,
-- so grant access explicitly. RLS above still decides which rows are allowed.
grant usage on schema public to anon, authenticated;
grant select on public.invitation_settings to anon, authenticated;
grant insert, update, delete on public.invitation_settings to authenticated;

-- 4. Single design: the theme column is no longer restricted
alter table public.hero_settings drop constraint if exists hero_settings_theme_check;

-- 5. Allow song uploads (MP3 / M4A, up to 15 MB) in the media bucket
update storage.buckets
set file_size_limit    = 15728640,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a']
where id = 'invitation-media';

-- 6. Make the API see the new table immediately
notify pgrst, 'reload schema';
