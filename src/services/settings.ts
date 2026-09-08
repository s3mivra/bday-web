import { supabase } from '@/lib/supabase';
import type { AboutSettings, EventSettings, HeroSettings, SiteContent } from '@/types';

/**
 * Every settings table is a singleton keyed on `id = 1` (enforced by a CHECK
 * constraint), which makes reads index-only and writes an idempotent upsert
 * with no read-modify-write race between concurrent admin tabs.
 */
export const SETTINGS_ID = 1;

export const DEFAULT_HERO: Omit<HeroSettings, 'updated_at'> = {
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

export const DEFAULT_ABOUT: Omit<AboutSettings, 'updated_at'> = {
  id: SETTINGS_ID,
  title: 'About the celebrant',
  greeting: null,
  description: null,
  birthday_message: null,
  image_url: null,
  image_path: null,
};

/** `maybeSingle` so a fresh database returns `null` instead of throwing. */
export async function fetchSiteContent(): Promise<SiteContent> {
  const [eventResult, heroResult, aboutResult] = await Promise.all([
    supabase.from('event_settings').select('*').eq('id', SETTINGS_ID).maybeSingle(),
    supabase.from('hero_settings').select('*').eq('id', SETTINGS_ID).maybeSingle(),
    supabase.from('about_settings').select('*').eq('id', SETTINGS_ID).maybeSingle(),
  ]);

  const failure = eventResult.error ?? heroResult.error ?? aboutResult.error;
  if (failure) throw failure;

  return {
    event: eventResult.data as EventSettings | null,
    hero: heroResult.data as HeroSettings | null,
    about: aboutResult.data as AboutSettings | null,
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

export async function saveHeroSettings(values: Partial<HeroSettings>): Promise<HeroSettings> {
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

export async function saveAboutSettings(values: Partial<AboutSettings>): Promise<AboutSettings> {
  const { data, error } = await supabase
    .from('about_settings')
    .upsert(
      { ...DEFAULT_ABOUT, ...values, id: SETTINGS_ID, updated_at: new Date().toISOString() },
      { onConflict: 'id' },
    )
    .select()
    .single();
  if (error) throw error;
  return data as AboutSettings;
}
