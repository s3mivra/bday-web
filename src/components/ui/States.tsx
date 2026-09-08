import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, ImageOff, RefreshCw, TriangleAlert } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'This did not load', message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="shell flex flex-col items-center gap-4 py-24 text-center">
      <TriangleAlert aria-hidden="true" className="h-8 w-8 text-rose-300" />
      <h2 className="text-2xl text-mist">{title}</h2>
      <p className="body-copy text-center">{message}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw aria-hidden="true" className="h-4 w-4" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyGallery() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink-line px-6 py-16 text-center">
      <ImageOff aria-hidden="true" className="h-7 w-7 text-muted" />
      <p className="text-lg text-mist">No photos yet.</p>
      <p className="max-w-sm text-sm text-muted">Photos will appear here once they are added.</p>
    </div>
  );
}

/** Shown on the public site when Supabase has no event row yet. */
export function SetupState() {
  return (
    <div className="shell flex min-h-[70vh] flex-col items-center justify-center gap-5 py-24 text-center">
      <CalendarPlus aria-hidden="true" className="h-9 w-9 text-champagne" />
      <h1 className="text-3xl text-mist sm:text-4xl">This invitation is not set up yet</h1>
      <p className="body-copy text-center">
        Sign in to the admin area and fill in the event details to publish the invitation.
      </p>
      <ButtonLink to="/admin">Open the admin area</ButtonLink>
    </div>
  );
}

export function ConfigMissing() {
  return (
    <div className="shell flex min-h-screen flex-col items-center justify-center gap-5 py-24 text-center">
      <TriangleAlert aria-hidden="true" className="h-9 w-9 text-champagne" />
      <h1 className="text-3xl text-mist">Supabase connection is missing</h1>
      <p className="body-copy text-center">
        Copy <code className="text-champagne">.env.example</code> to{' '}
        <code className="text-champagne">.env</code>, fill in{' '}
        <code className="text-champagne">VITE_SUPABASE_URL</code> and{' '}
        <code className="text-champagne">VITE_SUPABASE_ANON_KEY</code>, then restart the dev server.
      </p>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="shell flex min-h-[70vh] flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="text-4xl text-mist">This page is not part of the invitation</h1>
      <Link to="/" className="text-champagne underline underline-offset-4 hover:text-mist">
        Back to the invitation
      </Link>
    </div>
  );
}

export function InfoPanel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-champagne/25 bg-champagne/5 px-4 py-3 text-sm text-muted">
      {children}
    </div>
  );
}
