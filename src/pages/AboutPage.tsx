import { About } from '@/components/about/About';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function AboutPage() {
  const { event, about } = useSiteContent();
  useDocumentTitle(event ? `About ${event.celebrant_name}` : 'About the celebrant', {
    description: about?.description ?? event?.description ?? null,
  });

  if (!event) return null;
  return <About event={event} about={about} />;
}
