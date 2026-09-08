import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Hero } from '@/components/hero/Hero';
import { About } from '@/components/about/About';
import { Details } from '@/components/details/Details';
import { Divider } from '@/components/ui/Divider';
import { ButtonLink } from '@/components/ui/Button';
import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { useReveal } from '@/hooks/useReveal';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { EventSettings } from '@/types';

function seoTitle(event: EventSettings): string {
  return event.seo_title ?? `${event.celebrant_name}'s Birthday Celebration`;
}

export default function Home() {
  const { event, hero, about } = useSiteContent();
  const rsvpRef = useReveal<HTMLDivElement>();

  useDocumentTitle(event ? seoTitle(event) : 'Birthday Invitation', {
    description:
      event?.seo_description ??
      (event ? `Join ${event.celebrant_name} at ${event.venue}. RSVP to confirm your seat.` : null),
    image: event?.og_image_url ?? hero?.image_url ?? null,
  });

  if (!event) return null;

  return (
    <>
      <Hero event={event} hero={hero} />
      <Divider />
      <About event={event} about={about} />
      <Divider />
      <Details event={event} />
      <Divider />

      <section aria-labelledby="home-gallery-heading" className="py-20 sm:py-28">
        <div className="shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Moments</p>
              <h2 id="home-gallery-heading" className="mt-4 font-display text-display-sm text-mist">
                A look back
              </h2>
            </div>
            <Link
              to="/gallery"
              className="inline-flex items-center gap-2 text-sm text-champagne transition-colors hover:text-mist"
            >
              See the full gallery
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10">
            <GalleryGrid />
          </div>
        </div>
      </section>

      <Divider />

      <section aria-labelledby="home-rsvp-heading" className="py-20 sm:py-28">
        <div ref={rsvpRef} className="shell reveal max-w-2xl text-center">
          <p className="eyebrow">RSVP</p>
          <h2 id="home-rsvp-heading" className="mt-4 font-display text-display-sm text-mist">
            We would love to celebrate with you
          </h2>
          <p className="body-copy mx-auto mt-5 text-center">
            Let {event.celebrant_name} know whether you can make it, so there is a seat waiting for you.
          </p>
          <div className="mt-8 flex justify-center">
            <ButtonLink to="/rsvp" size="lg">
              Confirm your attendance
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
