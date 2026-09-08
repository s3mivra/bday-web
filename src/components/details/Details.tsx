import type { ReactNode } from 'react';
import { CalendarDays, Clock, MapPin, Shirt } from 'lucide-react';
import { ExternalButtonLink } from '@/components/ui/Button';
import { useReveal } from '@/hooks/useReveal';
import { formatLongDate, formatTimeRange, mapsUrlFor } from '@/lib/utils';
import type { EventSettings } from '@/types';

interface DetailCardProps {
  icon: ReactNode;
  term: string;
  children: ReactNode;
}

function DetailCard({ icon, term, children }: DetailCardProps) {
  return (
    <div className="card flex flex-col gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-champagne/30 text-champagne">
        {icon}
      </span>
      <dt className="text-sm text-muted">{term}</dt>
      <dd className="font-display text-xl leading-snug text-mist">{children}</dd>
    </div>
  );
}

export function Details({ event }: { event: EventSettings }) {
  const ref = useReveal<HTMLDivElement>();
  const mapsUrl = mapsUrlFor(event);

  return (
    <section aria-labelledby="details-heading" className="py-20 sm:py-28">
      <div ref={ref} className="shell reveal">
        <p className="eyebrow">The evening</p>
        <h2 id="details-heading" className="mt-4 max-w-2xl font-display text-display-sm text-mist">
          Everything you need to know
        </h2>

        <dl className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailCard icon={<CalendarDays aria-hidden="true" className="h-4 w-4" />} term="Date">
            {formatLongDate(event.event_date)}
          </DetailCard>
          <DetailCard icon={<Clock aria-hidden="true" className="h-4 w-4" />} term="Time">
            {formatTimeRange(event.start_time, event.end_time)}
          </DetailCard>
          <DetailCard icon={<MapPin aria-hidden="true" className="h-4 w-4" />} term="Location">
            {event.venue}
            <span className="mt-1 block font-body text-sm text-muted">{event.address}</span>
          </DetailCard>
          <DetailCard icon={<Shirt aria-hidden="true" className="h-4 w-4" />} term="Dress code">
            {event.dress_code ?? 'Come as you are'}
          </DetailCard>
        </dl>

        {event.additional_info ? (
          <div className="mt-10 rounded-2xl border border-champagne/20 bg-champagne/[0.04] p-6 sm:p-8">
            <h3 className="font-display text-xl text-mist">Good to know</h3>
            <p className="body-copy mt-3 whitespace-pre-line">{event.additional_info}</p>
          </div>
        ) : null}

        {mapsUrl ? (
          <div className="mt-10">
            <ExternalButtonLink href={mapsUrl} variant="outline" size="lg">
              <MapPin aria-hidden="true" className="h-4 w-4" />
              View location on Google Maps
            </ExternalButtonLink>
          </div>
        ) : null}
      </div>
    </section>
  );
}
