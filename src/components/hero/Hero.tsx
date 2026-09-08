import { CalendarDays, Clock, MapPin } from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Countdown } from '@/components/countdown/Countdown';
import { formatLongDate, formatTimeRange, ordinal, toLocalDateTime } from '@/lib/utils';
import type { EventSettings, HeroSettings } from '@/types';

interface HeroProps {
  event: EventSettings;
  hero: HeroSettings | null;
}

export function Hero({ event, hero }: HeroProps) {
  const label = hero?.label ?? 'You are invited';
  const title = hero?.title ?? 'A night to celebrate';
  const subtitle =
    hero?.subtitle ??
    (event.age !== null ? `to celebrate the ${ordinal(event.age)} birthday` : 'to celebrate a birthday');
  const target = toLocalDateTime(event.event_date, event.start_time);

  return (
    <section className="relative overflow-hidden pb-16 pt-10 sm:pb-24 sm:pt-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[-18rem] h-[38rem] bg-[radial-gradient(60%_60%_at_50%_50%,rgba(228,194,133,0.16),transparent_70%)]"
      />

      <div className="shell relative grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16">
        <div className="animate-rise">
          <p className="eyebrow">{label}</p>

          <h1 className="mt-5 break-words font-display text-display-lg text-mist [hyphens:auto]">{event.celebrant_name}</h1>

          <p className="mt-6 max-w-md font-display text-xl italic text-champagne sm:text-2xl">{title}</p>
          <p className="mt-2 max-w-md text-base text-muted sm:text-lg">{subtitle}</p>

          <dl className="mt-10 space-y-3 text-sm sm:text-base">
            <div className="flex items-start gap-3">
              <dt className="sr-only">Date</dt>
              <CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />
              <dd className="text-mist">{formatLongDate(event.event_date)}</dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="sr-only">Time</dt>
              <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />
              <dd className="text-mist">{formatTimeRange(event.start_time, event.end_time)}</dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="sr-only">Location</dt>
              <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-champagne" />
              <dd className="text-mist">
                {event.venue}
                <span className="block text-muted">{event.address}</span>
              </dd>
            </div>
          </dl>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/details" variant="outline" size="lg" className="w-full sm:w-auto">
              {hero?.primary_cta_text ?? 'View invitation'}
            </ButtonLink>
            <ButtonLink to="/rsvp" size="lg" className="w-full sm:w-auto">
              {hero?.secondary_cta_text ?? 'RSVP now'}
            </ButtonLink>
          </div>

          {hero?.show_countdown !== false ? (
            <div className="mt-12">
              <Countdown target={target} />
            </div>
          ) : null}
        </div>

        <div className="relative order-first lg:order-last">
          {hero?.image_url ? (
            <img
              src={hero.image_url}
              alt={`${event.celebrant_name} celebrating`}
              width={900}
              height={1200}
              fetchPriority="high"
              decoding="async"
              className="arch mx-auto h-[22rem] w-full max-w-sm object-cover shadow-frame sm:h-[30rem] lg:h-[34rem] lg:max-w-none"
            />
          ) : (
            <div
              aria-hidden="true"
              className="arch mx-auto flex h-[22rem] w-full max-w-sm items-center justify-center border border-ink-line bg-gradient-to-b from-ink-veil to-ink-soft sm:h-[30rem] lg:h-[34rem] lg:max-w-none"
            >
              <span className="font-display text-7xl text-champagne/25">
                {event.celebrant_name.trim().charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
