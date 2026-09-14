import { StarlightInvitation } from '@/components/starlight/StarlightInvitation';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { EventSettings } from '@/types';

function seoTitle(event: EventSettings): string {
  return event.seo_title ?? `${event.celebrant_name}'s Celebration`;
}

export default function Home() {
  const { event, hero, invitation } = useSiteContent();

  useDocumentTitle(event ? seoTitle(event) : 'Invitation', {
    description:
      event?.seo_description ??
      (event ? `Join ${event.celebrant_name} at ${event.venue}. RSVP to confirm your seat.` : null),
    image: event?.og_image_url ?? hero?.image_url ?? null,
  });

  if (!event) return null;

  return <StarlightInvitation event={event} hero={hero} invitation={invitation} />;
}
