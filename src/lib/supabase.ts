import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * True when both public env vars are present. The app renders a configuration
 * screen instead of crashing when they are not.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

function createStubClient(): SupabaseClient<Database> {
  const message =
    'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then reload.';
  const handler: ProxyHandler<object> = {
    get() {
      throw new Error(message);
    },
  };
  return new Proxy({}, handler) as SupabaseClient<Database>;
}

export const supabase: SupabaseClient<Database> = isSupabaseConfigured
  ? createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'birthday-invite-auth',
      },
      global: { headers: { 'x-application-name': 'birthday-invitation' } },
    })
  : createStubClient();

export const MEDIA_BUCKET = 'invitation-media';

/** Normalises PostgREST / network failures into a user-facing sentence. */
export function toErrorMessage(error: unknown, fallback = 'Something went wrong. Try again.'): string {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error) {
    if (error.message.includes('Failed to fetch')) {
      return 'Cannot reach the server. Check your connection and try again.';
    }
    return error.message;
  }
  if (typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return fallback;
}
