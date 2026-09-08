import { Details } from '@/components/details/Details';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatLongDate } from '@/lib/utils';

export default function DetailsPage() {
  const { event } = useSiteContent();
  useDocumentTitle(event ? `Event details · ${event.celebrant_name}` : 'Event details', {
    description: event ? `${formatLongDate(event.event_date)} at ${event.venue}, ${event.address}.` : null,
  });

  if (!event) return null;
  return <Details event={event} />;
}
