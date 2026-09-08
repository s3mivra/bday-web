import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { SectionSkeleton } from '@/components/ui/Skeleton';
import { ConfigMissing, ErrorState, NotFound, SetupState } from '@/components/ui/States';
import { AuthProvider } from '@/hooks/useAuth';
import { SiteContentProvider, useSiteContent } from '@/hooks/useSiteContent';
import { ToastProvider } from '@/hooks/useToast';
import { isSupabaseConfigured } from '@/lib/supabase';
import { applyTheme } from '@/lib/themes';

const Home = lazy(() => import('@/pages/Home'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const DetailsPage = lazy(() => import('@/pages/DetailsPage'));
const GalleryPage = lazy(() => import('@/pages/GalleryPage'));
const RsvpPage = lazy(() => import('@/pages/RsvpPage'));
const AdminApp = lazy(() => import('@/pages/admin/AdminApp'));

/**
 * Public routes never render half-loaded content: the gate resolves loading,
 * transport errors and the fresh-database case before children mount, so page
 * components can assume `event` is present.
 */
function PublicGate({ children }: { children: ReactNode }) {
  const { isLoading, error, isUnconfigured, refresh } = useSiteContent();

  if (isLoading) return <SectionSkeleton />;
  if (error) return <ErrorState message={error} onRetry={() => void refresh()} />;
  if (isUnconfigured) return <SetupState />;
  return <>{children}</>;
}

/** Keeps <html data-theme> in sync with the saved hero theme. */
function ThemeSync() {
  const { hero } = useSiteContent();
  useEffect(() => {
    applyTheme(hero?.theme);
  }, [hero?.theme]);
  return null;
}

function PublicRoutes() {
  return (
    <PublicGate>
      <Outlet />
    </PublicGate>
  );
}

export default function App() {
  if (!isSupabaseConfigured) return <ConfigMissing />;

  return (
    <ToastProvider>
      <AuthProvider>
        <SiteContentProvider>
          <ThemeSync />
          <Suspense fallback={<SectionSkeleton />}>
            <Routes>
              <Route element={<SiteLayout />}>
                <Route element={<PublicRoutes />}>
                  <Route index element={<Home />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="details" element={<DetailsPage />} />
                  <Route path="gallery" element={<GalleryPage />} />
                  <Route path="rsvp" element={<RsvpPage />} />
                </Route>
                <Route path="404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Route>
              <Route path="/admin/*" element={<AdminApp />} />
            </Routes>
          </Suspense>
        </SiteContentProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
