import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AdminPage, FormActions } from '@/components/layout/AdminPage';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { InfoPanel } from '@/components/ui/States';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useToast } from '@/hooks/useToast';
import { toErrorMessage } from '@/lib/supabase';
import { eventSettingsSchema, fieldErrors, type EventSettingsInput } from '@/lib/validation';
import { saveEventSettings } from '@/services/settings';
import type { EventSettings } from '@/types';

const BLANK: EventSettingsInput = {
  celebrant_name: '',
  age: '',
  birthday_date: '',
  event_date: '',
  start_time: '',
  end_time: '',
  venue: '',
  address: '',
  dress_code: '',
  description: '',
  birthday_message: '',
  additional_info: '',
  google_maps_url: '',
  rsvp_url: '',
  rsvp_method: 'google_form',
  rsvp_deadline: '',
  seo_title: '',
  seo_description: '',
};

function toFormValues(event: EventSettings | null): EventSettingsInput {
  if (!event) return BLANK;
  return {
    celebrant_name: event.celebrant_name,
    age: event.age ?? '',
    birthday_date: event.birthday_date ?? '',
    event_date: event.event_date,
    start_time: event.start_time?.slice(0, 5) ?? '',
    end_time: event.end_time?.slice(0, 5) ?? '',
    venue: event.venue,
    address: event.address,
    dress_code: event.dress_code ?? '',
    description: event.description ?? '',
    birthday_message: event.birthday_message ?? '',
    additional_info: event.additional_info ?? '',
    google_maps_url: event.google_maps_url ?? '',
    rsvp_url: event.rsvp_url ?? '',
    rsvp_method: event.rsvp_method,
    rsvp_deadline: event.rsvp_deadline ?? '',
    seo_title: event.seo_title ?? '',
    seo_description: event.seo_description ?? '',
  };
}

export default function EventEditor() {
  const { event, applyEvent } = useSiteContent();
  const { notify } = useToast();

  const initial = useMemo(() => toFormValues(event), [event]);
  const [values, setValues] = useState<EventSettingsInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initial);

  function update<K extends keyof EventSettingsInput>(key: K, value: EventSettingsInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  async function onSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (isSaving) return;

    const parsed = eventSettingsSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      notify('Fix the highlighted fields before saving.', 'error');
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const saved = await saveEventSettings(parsed.data);
      applyEvent(saved);
      setValues(toFormValues(saved));
      notify('Event details saved.', 'success');
    } catch (cause) {
      notify(toErrorMessage(cause, 'The event details could not be saved.'), 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminPage
      title="Event details"
      description="This is the source of every date, time and location shown on the public invitation."
    >
      <form onSubmit={onSubmit} noValidate className="space-y-8">
        <section className="card space-y-6">
          <h2 className="font-display text-xl text-mist">The celebrant</h2>
          <TextField
            label="Celebrant name"
            required
            maxLength={80}
            value={values.celebrant_name}
            error={errors['celebrant_name']}
            onChange={(e) => update('celebrant_name', e.target.value)}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField
              label="Age"
              type="number"
              min={0}
              max={130}
              inputMode="numeric"
              hint="Used for the 'turning 18th' line. Leave blank to hide it."
              value={String(values.age ?? '')}
              error={errors['age']}
              onChange={(e) => update('age', e.target.value)}
            />
            <TextField
              label="Birthday date"
              type="date"
              hint="The actual birthday, if it differs from the party date."
              value={values.birthday_date ?? ''}
              error={errors['birthday_date']}
              onChange={(e) => update('birthday_date', e.target.value)}
            />
          </div>
        </section>

        <section className="card space-y-6">
          <h2 className="font-display text-xl text-mist">When and where</h2>
          <TextField
            label="Event date"
            type="date"
            required
            value={values.event_date}
            error={errors['event_date']}
            onChange={(e) => update('event_date', e.target.value)}
          />
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField
              label="Start time"
              type="time"
              value={values.start_time ?? ''}
              error={errors['start_time']}
              onChange={(e) => update('start_time', e.target.value)}
            />
            <TextField
              label="End time"
              type="time"
              value={values.end_time ?? ''}
              error={errors['end_time']}
              onChange={(e) => update('end_time', e.target.value)}
            />
          </div>
          <TextField
            label="Venue"
            required
            value={values.venue}
            error={errors['venue']}
            onChange={(e) => update('venue', e.target.value)}
          />
          <TextField
            label="Address"
            required
            value={values.address}
            error={errors['address']}
            onChange={(e) => update('address', e.target.value)}
          />
          <TextField
            label="Google Maps URL"
            type="url"
            inputMode="url"
            placeholder="https://maps.app.goo.gl/..."
            hint="Leave blank to generate a Maps search from the venue and address."
            value={values.google_maps_url ?? ''}
            error={errors['google_maps_url']}
            onChange={(e) => update('google_maps_url', e.target.value)}
          />
          <TextField
            label="Dress code"
            placeholder="Formal / Smart casual"
            value={values.dress_code ?? ''}
            error={errors['dress_code']}
            onChange={(e) => update('dress_code', e.target.value)}
          />
        </section>

        <section className="card space-y-6">
          <h2 className="font-display text-xl text-mist">Words</h2>
          <TextAreaField
            label="Description"
            hint="Shown in the about section when no separate about description is set."
            value={values.description ?? ''}
            error={errors['description']}
            onChange={(e) => update('description', e.target.value)}
          />
          <TextAreaField
            label="Birthday message"
            rows={3}
            value={values.birthday_message ?? ''}
            error={errors['birthday_message']}
            onChange={(e) => update('birthday_message', e.target.value)}
          />
          <TextAreaField
            label="Additional information"
            rows={3}
            hint="Parking, gift notes, arrival time — anything guests should know."
            value={values.additional_info ?? ''}
            error={errors['additional_info']}
            onChange={(e) => update('additional_info', e.target.value)}
          />
        </section>

        <section className="card space-y-6">
          <h2 className="font-display text-xl text-mist">Search and sharing</h2>
          <TextField
            label="Page title"
            maxLength={70}
            hint="Defaults to “<Name>'s Birthday Celebration”."
            value={values.seo_title ?? ''}
            error={errors['seo_title']}
            onChange={(e) => update('seo_title', e.target.value)}
          />
          <TextAreaField
            label="Meta description"
            rows={2}
            maxLength={200}
            value={values.seo_description ?? ''}
            error={errors['seo_description']}
            onChange={(e) => update('seo_description', e.target.value)}
          />
          <InfoPanel>
            RSVP method, form URL and deadline are on the{' '}
            <Link to="/admin/rsvp" className="text-champagne underline underline-offset-4">
              RSVP page
            </Link>
            , where you can set the link and preview the QR code together.
          </InfoPanel>
        </section>

        <FormActions
          isSaving={isSaving}
          isDirty={isDirty}
          onCancel={() => {
            setValues(initial);
            setErrors({});
          }}
        />
      </form>
    </AdminPage>
  );
}
