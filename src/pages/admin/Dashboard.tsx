import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Images, MapPin, Send } from 'lucide-react';
import { AdminPage } from '@/components/layout/AdminPage';
import { ButtonLink } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { InfoPanel } from '@/components/ui/States';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useCountdown } from '@/hooks/useCountdown';
import { formatLongDate, formatTimeRange, toLocalDateTime } from '@/lib/utils';
import { countGalleryImages } from '@/services/gallery';
import { fetchRsvps, summariseRsvps } from '@/services/rsvp';

interface Stats {
  gallery: number | null;
  responses: number | null;
  headcount: number | null;
}

function StatCard({ icon, label, value, hint }: { icon: ReactNode; label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="card">
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-champagne/30 text-champagne">
        {icon}
      </span>
      <p className="mt-4 text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl leading-tight text-mist">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export default function Dashboard() {
  const { event, isLoading } = useSiteContent();
  const [stats, setStats] = useState<Stats>({ gallery: null, responses: null, headcount: null });

  const countdown = useCountdown(event ? toLocalDateTime(event.event_date, event.start_time) : null);

  useEffect(() => {
    let active = true;

    async function load() {
      const gallery = await countGalleryImages().catch(() => null);
      if (active) setStats((current) => ({ ...current, gallery }));

      if (event?.rsvp_method !== 'supabase') return;
      const rows = await fetchRsvps().catch(() => null);
      if (!active || !rows) return;
      const totals = summariseRsvps(rows);
      setStats((current) => ({ ...current, responses: totals.responses, headcount: totals.headcount }));
    }

    void load();
    return () => {
      active = false;
    };
  }, [event?.rsvp_method]);

  if (isLoading) {
    return (
      <AdminPage title="Dashboard">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
      </AdminPage>
    );
  }

  if (!event) {
    return (
      <AdminPage title="Dashboard" description="No event is configured yet.">
        <InfoPanel>
          The public invitation shows a setup notice until the event details exist. Add the celebrant, date and
          venue to publish it.
        </InfoPanel>
        <div className="mt-6">
          <ButtonLink to="/admin/event">Create the event</ButtonLink>
        </div>
      </AdminPage>
    );
  }

  const countdownLabel = countdown.isPast
    ? 'The celebration has passed'
    : `${countdown.days} days, ${countdown.hours} hours to go`;

  return (
    <AdminPage title="Dashboard" description={`Everything for ${event.celebrant_name}'s celebration.`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={<CalendarDays aria-hidden="true" className="h-4 w-4" />}
          label="Event date"
          value={formatLongDate(event.event_date)}
          hint={`${formatTimeRange(event.start_time, event.end_time)} · ${countdownLabel}`}
        />
        <StatCard
          icon={<MapPin aria-hidden="true" className="h-4 w-4" />}
          label="Venue"
          value={event.venue}
          hint={event.address}
        />
        <StatCard
          icon={<Images aria-hidden="true" className="h-4 w-4" />}
          label="Gallery photos"
          value={stats.gallery ?? '—'}
          hint="Includes photos hidden from the public gallery."
        />
        <StatCard
          icon={<Send aria-hidden="true" className="h-4 w-4" />}
          label="RSVPs"
          value={event.rsvp_method === 'supabase' ? (stats.responses ?? '—') : 'Google Form'}
          hint={
            event.rsvp_method === 'supabase'
              ? `${stats.headcount ?? 0} expected heads including guests`
              : 'Responses are collected in your own form.'
          }
        />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl text-mist">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink to="/admin/event" variant="outline" size="sm">
            Edit event details
          </ButtonLink>
          <ButtonLink to="/admin/gallery" variant="outline" size="sm">
            Manage gallery
          </ButtonLink>
          <ButtonLink to="/admin/rsvp" variant="outline" size="sm">
            RSVP settings
          </ButtonLink>
          <Link
            to="/"
            className="inline-flex min-h-[44px] items-center rounded-full px-4 text-sm text-muted transition-colors hover:text-champagne"
          >
            View the public invitation
          </Link>
        </div>
      </section>
    </AdminPage>
  );
}
