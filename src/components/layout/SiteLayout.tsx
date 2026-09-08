import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useSiteContent } from '@/hooks/useSiteContent';
import { formatShortDate } from '@/lib/utils';

function Footer() {
  const { event } = useSiteContent();

  return (
    <footer className="mt-24 border-t border-ink-line/60 py-12">
      <div className="shell flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="break-words font-display text-2xl text-mist">{event?.celebrant_name ?? 'The invitation'}</p>
          {event ? (
            <p className="mt-1 text-sm text-muted">
              {formatShortDate(event.event_date)} · {event.venue}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 text-sm text-muted sm:items-end">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link to="/rsvp" className="transition-colors hover:text-champagne">
              RSVP
            </Link>
            <Link to="/gallery" className="transition-colors hover:text-champagne">
              Gallery
            </Link>
            <Link to="/admin" className="transition-colors hover:text-champagne">
              Admin
            </Link>
          </div>
          <p className="text-xs text-muted">
            Powered by{' '}
            <a
              href="https://semivra.asia"
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-champagne"
            >
              Semivra Asia
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Manual scroll reset: `ScrollRestoration` requires a data router. */
function useScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    window.scrollTo({ top: 0, behavior });
  }, [pathname]);
}

export function SiteLayout() {
  useScrollToTop();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-full focus:bg-champagne focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
