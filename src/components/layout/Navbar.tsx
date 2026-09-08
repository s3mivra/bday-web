import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSiteContent } from '@/hooks/useSiteContent';

const LINKS = [
  { to: '/', label: 'Invitation' },
  { to: '/about', label: 'The celebrant' },
  { to: '/details', label: 'Details' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/rsvp', label: 'RSVP' },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { event } = useSiteContent();
  const location = useLocation();
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    panelRef.current?.querySelector<HTMLElement>('a')?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const monogram = (event?.celebrant_name ?? 'Invitation').trim().charAt(0).toUpperCase() || 'B';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors duration-300',
        scrolled || open ? 'border-ink-line/70 bg-ink/90 backdrop-blur-md' : 'border-transparent bg-transparent',
      )}
    >
      <nav aria-label="Primary" className="shell flex h-16 items-center justify-between gap-4 sm:h-20">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-md py-1 text-mist transition-colors hover:text-champagne"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-champagne/40 font-display text-base text-champagne">
            {monogram}
          </span>
          <span className="hidden max-w-[16rem] truncate font-display text-lg sm:block">
            {event?.celebrant_name ?? 'The invitation'}
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm transition-colors duration-200',
                    isActive ? 'text-champagne' : 'text-muted hover:text-mist',
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-line text-mist md:hidden"
        >
          {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </nav>

      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="border-t border-ink-line/60 bg-ink/95 backdrop-blur-md md:hidden"
      >
        <ul className="shell flex flex-col py-2">
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-[52px] items-center border-b border-ink-line/40 text-base transition-colors',
                    isActive ? 'text-champagne' : 'text-mist',
                  )
                }
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
