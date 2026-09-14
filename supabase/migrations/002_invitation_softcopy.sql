-- Adds the softcopy section (an uploaded image of the invitation, shown at the
-- bottom of the page with view and save buttons). Safe to re-run.

alter table public.invitation_settings add column if not exists softcopy_title text;
alter table public.invitation_settings add column if not exists softcopy_text text;
alter table public.invitation_settings add column if not exists softcopy_image_url text;
alter table public.invitation_settings add column if not exists softcopy_image_path text;

alter table public.invitation_settings drop constraint if exists invitation_settings_softcopy_title_check;
alter table public.invitation_settings add constraint invitation_settings_softcopy_title_check
  check (length(softcopy_title) <= 60);
alter table public.invitation_settings drop constraint if exists invitation_settings_softcopy_text_check;
alter table public.invitation_settings add constraint invitation_settings_softcopy_text_check
  check (length(softcopy_text) <= 200);
alter table public.invitation_settings drop constraint if exists invitation_settings_softcopy_image_url_check;
alter table public.invitation_settings add constraint invitation_settings_softcopy_image_url_check
  check (softcopy_image_url ~* '^https?://');

-- Make the API see the new columns immediately
notify pgrst, 'reload schema';
