import { Suspense, lazy, useState, type ReactNode } from 'react';
import { Link, NavLink, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import {
  CalendarCog,
  ExternalLink,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Send,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { SectionSkeleton, Skeleton } from '@/components/ui/Skeleton';
import { ErrorState, NotFound } from '@/components/ui/States';
import { useAuth } from '@/hooks/useAuth';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useToast } from '@/hooks/useToast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import { toErrorMessage } from '@/lib/supabase';

const Login = lazy(() => import('@/pages/admin/Login'));
const Dashboard = lazy(() => import('@/pages/admin/Dashboard'));
const EventEditor = lazy(() => import('@/pages/admin/EventEditor'));
const HeroEditor = lazy(() => import('@/pages/admin/HeroEditor'));
const AboutEditor = lazy(() => import('@/pages/admin/AboutEditor'));
const GalleryManager = lazy(() => import('@/pages/admin/GalleryManager'));
const RsvpSettings = lazy(() => import('@/pages/admin/RsvpSettings'));

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/event', label: 'Event details', icon: CalendarCog, end: false },
  { to: '/admin/hero', label: 'Hero', icon: Sparkles, end: false },
  { to: '/admin/about', label: 'About', icon: UserRound, end: false },
  { to: '/admin/gallery', label: 'Gallery', icon: Images, end: false },
  { to: '/admin/rsvp', label: 'RSVP', icon: Send, end: false },
] as const;

/**
 * Client-side gate for navigation only. Every write is additionally guarded by
 * Row Level Security, so a forged session cannot mutate content.
 *
 * It also blocks on the content fetch. `getSession()` resolves from local
 * storage and normally wins the race against the network, so without this an
 * editor would mount while its row is still null, seed its form state from the
 * defaults, and overwrite real content on the next save.
 */
function RequireAuth({ children }: { children: ReactNode }) {
  const { session, isLoading: isAuthLoading } = useAuth();
  const { isLoading: isContentLoading, error, refresh } = useSiteContent();

  if (isAuthLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  if (!session) return <Navigate to="/admin/login" replace />;

  if (isContentLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Editing against content that failed to load risks writing defaults over
  // rows that exist but were not read.
  if (error) {
    return (
      <div className="p-8">
        <ErrorState
          title="Content did not load"
          message={`${error} Editing is disabled until it loads, so nothing is overwritten.`}
          onRetry={() => void refresh()}
        />
      </div>
    );
  }

  return <>{children}</>;
}

function AdminShell() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  useDocumentTitle('Admin · Birthday invitation');

  async function onSignOut() {
    try {
      await signOut();
      notify('Signed out.', 'success');
      navigate('/admin/login', { replace: true });
    } catch (cause) {
      notify(toErrorMessage(cause, 'Sign out failed.'), 'error');
    }
  }

  const nav = (
    <nav aria-label="Admin sections" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex min-h-[44px] items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-200',
              isActive ? 'bg-champagne/12 text-champagne' : 'text-muted hover:bg-ink-veil/50 hover:text-mist',
            )
          }
        >
          <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-ink">
      <header className="sticky top-0 z-40 border-b border-ink-line/70 bg-ink/95 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <p className="font-display text-lg text-mist">Admin</p>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="admin-nav"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-line text-mist"
          >
            {open ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}
            <span className="sr-only">{open ? 'Close admin menu' : 'Open admin menu'}</span>
          </button>
        </div>
        <div id="admin-nav" hidden={!open} className="border-t border-ink-line/60 px-4 py-3">
          {nav}
          <Button variant="ghost" onClick={onSignOut} className="mt-2 w-full justify-start px-3">
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>

      <div className="lg:flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-line/70 p-5 lg:flex">
          <Link to="/" className="font-display text-xl text-mist transition-colors hover:text-champagne">
            Invitation admin
          </Link>
          <p className="mt-1 truncate text-xs text-muted">{user?.email}</p>

          <div className="mt-8 flex-1">{nav}</div>

          <Link
            to="/"
            className="mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:text-champagne"
          >
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            View public site
          </Link>
          <Button variant="ghost" onClick={onSignOut} className="w-full justify-start px-3">
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Sign out
          </Button>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function AdminApp() {
  return (
    <Suspense fallback={<SectionSkeleton />}>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route
          element={
            <RequireAuth>
              <AdminShell />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="event" element={<EventEditor />} />
          <Route path="hero" element={<HeroEditor />} />
          <Route path="about" element={<AboutEditor />} />
          <Route path="gallery" element={<GalleryManager />} />
          <Route path="rsvp" element={<RsvpSettings />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
