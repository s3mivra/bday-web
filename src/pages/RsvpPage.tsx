import { RsvpForm } from '@/components/rsvp/RsvpForm';
import { RsvpQr } from '@/components/rsvp/RsvpQr';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatLongDate } from '@/lib/utils';

export default function RsvpPage() {
  const { event } = useSiteContent();
  useDocumentTitle(event ? `RSVP · ${event.celebrant_name}` : 'RSVP', {
    description: event ? `Confirm your attendance for ${event.celebrant_name}'s birthday celebration.` : null,
  });

  if (!event) return null;

  const deadline = event.rsvp_deadline ? formatLongDate(event.rsvp_deadline) : null;

  return (
    <section aria-labelledby="rsvp-heading" className="py-16 sm:py-24">
      <div className="shell max-w-2xl">
        <div className="text-center">
          <p className="eyebrow">RSVP</p>
          <h1 id="rsvp-heading" className="mt-4 font-display text-display-sm text-mist">
            Will you be there?
          </h1>
          <p className="body-copy mx-auto mt-5 text-center">
            {event.celebrant_name} is counting seats for {formatLongDate(event.event_date)} at {event.venue}.
          </p>
          {deadline ? <p className="mt-3 text-sm text-champagne">Please reply by {deadline}.</p> : null}
        </div>

        <div className="mt-12">
          {event.rsvp_method === 'google_form' ? (
            <RsvpQr url={event.rsvp_url} celebrantName={event.celebrant_name} />
          ) : (
            <RsvpForm celebrantName={event.celebrant_name} />
          )}
        </div>
      </div>
    </section>
  );
}
