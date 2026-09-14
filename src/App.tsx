import { Suspense, lazy, type ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { SiteLayout } from '@/components/layout/SiteLayout';
import { SectionSkeleton } from '@/components/ui/Skeleton';
import { ConfigMissing, ErrorState, NotFound, SetupState } from '@/components/ui/States';
import { AuthProvider } from '@/hooks/useAuth';
import { SiteContentProvider, useSiteContent } from '@/hooks/useSiteContent';
import { ToastProvider } from '@/hooks/useToast';
import { isSupabaseConfigured } from '@/lib/supabase';

const Home = lazy(() => import('@/pages/Home'));
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
          <Suspense fallback={<SectionSkeleton />}>
            <Routes>
              {/* The invitation is a full-bleed page with its own envelope intro, so it skips the navbar and footer. */}
              <Route element={<PublicRoutes />}>
                <Route index element={<Home />} />
              </Route>
              <Route element={<SiteLayout />}>
                <Route element={<PublicRoutes />}>
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
