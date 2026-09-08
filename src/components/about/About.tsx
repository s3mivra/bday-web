import { useReveal } from '@/hooks/useReveal';
import { ordinal } from '@/lib/utils';
import type { AboutSettings, EventSettings } from '@/types';

interface AboutProps {
  event: EventSettings;
  about: AboutSettings | null;
}

export function About({ event, about }: AboutProps) {
  const ref = useReveal<HTMLDivElement>();
  const greeting = about?.greeting ?? `Hi, I am ${event.celebrant_name}`;
  const description = about?.description ?? event.description;
  const message = about?.birthday_message ?? event.birthday_message;

  return (
    <section aria-labelledby="about-heading" className="py-20 sm:py-28">
      <div ref={ref} className="shell reveal grid gap-12 md:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)] md:gap-16">
        <div className="mx-auto w-full max-w-xs md:mx-0 md:max-w-none">
          {about?.image_url ? (
            <img
              src={about.image_url}
              alt={event.celebrant_name}
              width={800}
              height={1000}
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full rounded-2xl object-cover shadow-frame"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl border border-ink-line bg-ink-soft"
            >
              <span className="font-display text-6xl text-champagne/25">
                {event.celebrant_name.trim().charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="eyebrow">{about?.title ?? 'About the celebrant'}</p>
          <h2 id="about-heading" className="mt-4 break-words font-display text-display-sm text-mist">
            {greeting}
          </h2>

          {event.age !== null ? (
            <p className="mt-4 font-display text-lg italic text-champagne">
              Turning {ordinal(event.age)} this year
            </p>
          ) : null}

          {description ? <p className="body-copy mt-6 whitespace-pre-line">{description}</p> : null}

          {message ? (
            <blockquote className="mt-8 border-l-2 border-champagne/50 pl-5 font-display text-lg italic leading-relaxed text-mist sm:text-xl">
              {message}
            </blockquote>
          ) : null}
        </div>
      </div>
    </section>
  );
}
