import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isSupabaseConfigured, toErrorMessage } from '@/lib/supabase';
import { fetchSiteContent } from '@/services/settings';
import type { AboutSettings, EventSettings, HeroSettings, SiteContent } from '@/types';

interface SiteContentValue extends SiteContent {
  isLoading: boolean;
  error: string | null;
  /** True when Supabase is reachable but no event row exists yet. */
  isUnconfigured: boolean;
  refresh: () => Promise<void>;
  applyEvent: (event: EventSettings) => void;
  applyHero: (hero: HeroSettings) => void;
  applyAbout: (about: AboutSettings) => void;
}

const SiteContentContext = createContext<SiteContentValue | null>(null);

/**
 * The public site reads content once at mount and shares it across routes, so
 * navigating between pages costs no extra queries. Admin editors push saved
 * rows back in via `apply*`, which is why the public site updates immediately
 * after a save without a refetch.
 */
export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>({ event: null, hero: null, about: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setContent(await fetchSiteContent());
    } catch (cause) {
      setError(toErrorMessage(cause, 'The invitation could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<SiteContentValue>(
    () => ({
      ...content,
      isLoading,
      error,
      isUnconfigured: !isLoading && !error && content.event === null,
      refresh,
      applyEvent: (event) => setContent((current) => ({ ...current, event })),
      applyHero: (hero) => setContent((current) => ({ ...current, hero })),
      applyAbout: (about) => setContent((current) => ({ ...current, about })),
    }),
    [content, isLoading, error, refresh],
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent(): SiteContentValue {
  const context = useContext(SiteContentContext);
  if (!context) throw new Error('useSiteContent must be used inside SiteContentProvider.');
  return context;
}
