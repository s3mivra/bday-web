import { supabase } from '@/lib/supabase';

/** The project ref (the subdomain of VITE_SUPABASE_URL), shown in setup errors so a wrong project is easy to spot. */
function projectRef(): string {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split('.')[0] ?? 'unknown';
  } catch {
    return 'unknown';
  }
}
import type { EventSettings, HeroSettings, InvitationSettings, SiteContent } from '@/types';

/**
 * Every settings table is a singleton keyed on `id = 1` (enforced by a CHECK
 * constraint), which makes reads index-only and writes an idempotent upsert
 * with no read-modify-write race between concurrent admin tabs.
 */
export const SETTINGS_ID = 1;

/** `theme` is left out on purpose: there is a single design, so saves never write it. */
export const DEFAULT_HERO: Omit<HeroSettings, 'updated_at' | 'theme'> = {
  id: SETTINGS_ID,
  label: 'You are invited',
  title: 'A night to celebrate',
  subtitle: null,
  image_url: null,
  image_path: null,
  primary_cta_text: 'View invitation',
  secondary_cta_text: 'RSVP now',
  show_countdown: true,
};

export const DEFAULT_INVITATION: Omit<InvitationSettings, 'updated_at'> = {
  id: SETTINGS_ID,
  envelope_enabled: true,
  envelope_heading: 'A berry sweet letter',
  hero_tagline: null,
  song_title: null,
  song_subtitle: null,
  song_url: null,
  song_path: null,
  countdown_title: 'The countdown to our berry sweet day has begun!',
  countdown_text: null,
  countdown_image_url: null,
  countdown_image_path: null,
  banner_text: 'We can’t wait to celebrate with you!',
  ceremony_title: 'Ceremony',
  ceremony_time: null,
  ceremony_venue: null,
  ceremony_address: null,
  ceremony_maps_url: null,
  reception_title: 'Reception',
  fun_title: null,
  fun_text: null,
  ninong: null,
  ninang: null,
  gift_guide: null,
  reminders: null,
  photo_image_url: null,
  photo_image_path: null,
  save_date_text: null,
  closing_letter: null,
  closing_signature: null,
  closing_image_url: null,
  closing_image_path: null,
  softcopy_title: 'Your copy of the invitation',
  softcopy_text: null,
  softcopy_image_url: null,
  softcopy_image_path: null,
};

/**
 * PostgREST reports a table that has not been created yet as PGRST205 (or
 * 42P01 from Postgres). Projects that have not re-run schema.sql since the
 * Starlight sections were added should keep rendering, not fail outright.
 */
function isMissingTable(error: { code?: string; message?: string } | null): boolean {
  return error?.code === 'PGRST205' || error?.code === '42P01';
}

/** `maybeSingle` so a fresh database returns `null` instead of throwing. */
export async function fetchSiteContent(): Promise<SiteContent> {
  const [eventResult, heroResult, invitationResult] = await Promise.all([
    supabase.from('event_settings').select('*').eq('id', SETTINGS_ID).maybeSingle(),
    supabase.from('hero_settings').select('*').eq('id', SETTINGS_ID).maybeSingle(),
    supabase.from('invitation_settings').select('*').eq('id', SETTINGS_ID).maybeSingle(),
  ]);

  const invitationError = isMissingTable(invitationResult.error) ? null : invitationResult.error;
  const failure = eventResult.error ?? heroResult.error ?? invitationError;
  if (failure) throw failure;

  return {
    event: eventResult.data as EventSettings | null,
    hero: heroResult.data as HeroSettings | null,
    invitation: invitationResult.error ? null : (invitationResult.data as InvitationSettings | null),
  };
}

export async function saveEventSettings(values: Partial<EventSettings>): Promise<EventSettings> {
  const { data, error } = await supabase
    .from('event_settings')
    .upsert({ ...values, id: SETTINGS_ID, updated_at: new Date().toISOString() }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data as EventSettings;
}

export async function saveHeroSettings(values: Partial<Omit<HeroSettings, 'theme'>>): Promise<HeroSettings> {
  const { data, error } = await supabase
    .from('hero_settings')
    .upsert(
      { ...DEFAULT_HERO, ...values, id: SETTINGS_ID, updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data as HeroSettings;
}

export async function saveInvitationSettings(values: Partial<InvitationSettings>): Promise<InvitationSettings> {
  const { data, error } = await supabase
    .from('invitation_settings')
    .upsert(
      { ...DEFAULT_INVITATION, ...values, id: SETTINGS_ID, updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    )
    .select()
    .single();
  if (error) {
    // PGRST204: a column in the payload is not in the schema cache (a newer migration was not run).
    if (error.code === 'PGRST204') {
      throw new Error(
        `Supabase project "${projectRef()}" is missing a newer invitation column. ` +
          'Run the files in supabase/migrations in order (001, then 002) in the SQL editor, then reload this page.',
      );
    }
    if (isMissingTable(error)) {
      throw new Error(
        `Supabase project "${projectRef()}" cannot see the invitation_settings table (${error.code}). ` +
          'Run supabase/migrations/001_invitation_settings.sql in the SQL editor of that same project, then reload this page.',
      );
    }
    throw error;
  }
  return data as InvitationSettings;
}
