import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AdminPage, FormActions } from '@/components/layout/AdminPage';
import { AudioUploadField } from '@/components/ui/AudioUploadField';
import { TextAreaField, TextField, ToggleField } from '@/components/ui/Field';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { InfoPanel } from '@/components/ui/States';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useToast } from '@/hooks/useToast';
import { toErrorMessage } from '@/lib/supabase';
import { fieldErrors, invitationSettingsSchema } from '@/lib/validation';
import { DEFAULT_INVITATION, saveInvitationSettings } from '@/services/settings';
import type { InvitationSettings } from '@/types';

type TextKey = Exclude<
  keyof InvitationSettings,
  'id' | 'updated_at' | 'envelope_enabled' | 'song_path' | 'countdown_image_path' | 'photo_image_path' | 'closing_image_path'
>;

type FormState = Record<TextKey, string> & {
  envelope_enabled: boolean;
  song_path: string | null;
  countdown_image_path: string | null;
  photo_image_path: string | null;
  closing_image_path: string | null;
};

const TEXT_KEYS = Object.keys(DEFAULT_INVITATION).filter(
  (key) => !['id', 'envelope_enabled'].includes(key) && !key.endsWith('_path'),
) as TextKey[];

function toFormValues(row: InvitationSettings | null): FormState {
  const source = { ...DEFAULT_INVITATION, ...row };
  const text = Object.fromEntries(
    TEXT_KEYS.map((key) => {
      const value = source[key];
      // Postgres returns `time` as HH:MM:SS; the input wants HH:MM.
      if (key === 'ceremony_time' && typeof value === 'string') return [key, value.slice(0, 5)];
      return [key, value ?? ''];
    }),
  ) as Record<TextKey, string>;
  return {
    ...text,
    envelope_enabled: source.envelope_enabled,
    song_path: source.song_path,
    countdown_image_path: source.countdown_image_path,
    photo_image_path: source.photo_image_path,
    closing_image_path: source.closing_image_path,
  };
}

function Card({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="card space-y-6">
      <div>
        <h2 className="font-display text-xl text-mist">{title}</h2>
        {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function InvitationEditor() {
  const { hero, invitation, applyInvitation } = useSiteContent();
  const { notify } = useToast();

  const initial = useMemo(() => toFormValues(invitation), [invitation]);
  const [values, setValues] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initial);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  /** Text input bound to one column. */
  function text(key: TextKey, label: string, options: { hint?: string; max?: number; type?: string } = {}) {
    return (
      <TextField
        label={label}
        type={options.type ?? 'text'}
        hint={options.hint}
        maxLength={options.max}
        value={values[key]}
        error={errors[key]}
        onChange={(e) => update(key, e.target.value)}
      />
    );
  }

  function area(key: TextKey, label: string, options: { hint?: string; max?: number; rows?: number } = {}) {
    return (
      <TextAreaField
        label={label}
        rows={options.rows ?? 3}
        hint={options.hint}
        maxLength={options.max}
        value={values[key]}
        error={errors[key]}
        onChange={(e) => update(key, e.target.value)}
      />
    );
  }

  function image(urlKey: TextKey, pathKey: keyof FormState, label: string, hint?: string) {
    return (
      <ImageUploadField
        label={label}
        folder="invitation"
        hint={hint ?? 'JPG, PNG, WebP or AVIF up to 5 MB.'}
        value={{ url: values[urlKey] || null, path: values[pathKey] as string | null }}
        onChange={(next) => {
          update(urlKey, next.url ?? '');
          update(pathKey, next.path as never);
        }}
      />
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const parsed = invitationSettingsSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      notify('Fix the highlighted fields before saving.', 'error');
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const saved = await saveInvitationSettings({
        ...parsed.data,
        song_path: values.song_path,
        countdown_image_path: values.countdown_image_path,
        photo_image_path: values.photo_image_path,
        closing_image_path: values.closing_image_path,
      });
      applyInvitation(saved);
      setValues(toFormValues(saved));
      notify('Invitation sections saved.', 'success');
    } catch (cause) {
      notify(toErrorMessage(cause, 'The invitation sections could not be saved.'), 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminPage
      title="Invitation sections"
      description="Extra sections for the Starlight theme: the envelope, music, ceremony, godparents, reminders, save the date and closing letter."
    >
      {hero?.theme !== 'starlight' ? (
        <div className="mb-8">
          <InfoPanel>
            These sections only show with the Starlight theme. Pick it under{' '}
            <Link to="/admin/hero" className="text-champagne underline-offset-4 hover:underline">
              Hero, Site theme
            </Link>
            .
          </InfoPanel>
        </div>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="space-y-8">
        <Card title="Envelope intro" description="Guests tap a wax seal to open the invitation. Add ?to=Name to a link to address the envelope to someone.">
          <ToggleField
            label="Show the envelope when the invitation opens"
            checked={values.envelope_enabled}
            onChange={(checked) => update('envelope_enabled', checked)}
          />
          {text('envelope_heading', 'Envelope heading', { max: 60 })}
          {text('hero_tagline', 'Tagline under the main photo', {
            max: 120,
            hint: 'The name, occasion (Hero headline) and main photo come from Event details and Hero.',
          })}
        </Card>

        <Card title="Music" description="Starts when the seal is tapped. Guests can pause it from the player.">
          <div className="grid gap-6 sm:grid-cols-2">
            {text('song_title', 'Song title', { max: 80 })}
            {text('song_subtitle', 'Subtitle', { max: 120 })}
          </div>
          <AudioUploadField
            label="Song file"
            hint="MP3 or M4A up to 15 MB."
            value={{ url: values.song_url || null, path: values.song_path }}
            onChange={(next) => {
              update('song_url', next.url ?? '');
              update('song_path', next.path);
            }}
          />
        </Card>

        <Card title="Countdown">
          {text('countdown_title', 'Title', { max: 160 })}
          {area('countdown_text', 'Text', { max: 300 })}
          {image('countdown_image_url', 'countdown_image_path', 'Countdown photo')}
          {text('banner_text', 'Banner under the countdown', { max: 120 })}
        </Card>

        <Card
          title="Location"
          description="The reception uses the venue, address, start time and Google Maps link from Event details. Add a ceremony here if there is one."
        >
          <div className="grid gap-6 sm:grid-cols-2">
            {text('ceremony_title', 'Ceremony title', { max: 40 })}
            {text('ceremony_time', 'Ceremony time', { type: 'time' })}
            {text('ceremony_venue', 'Ceremony venue', { max: 120 })}
            {text('ceremony_address', 'Ceremony address', { max: 200 })}
          </div>
          {text('ceremony_maps_url', 'Ceremony Google Maps link', {
            hint: 'Paste the Share link from Google Maps. The map preview uses the venue and address.',
          })}
          {text('reception_title', 'Reception title', { max: 40 })}
          <div className="grid gap-6 sm:grid-cols-2">
            {text('fun_title', 'Extra box title', { max: 60 })}
          </div>
          {area('fun_text', 'Extra box text', { max: 400 })}
        </Card>

        <Card title="Godparents" description="One name per line. Leave both empty to hide the section.">
          <div className="grid gap-6 sm:grid-cols-2">
            {area('ninong', 'Ninong', { max: 2000, rows: 8 })}
            {area('ninang', 'Ninang', { max: 2000, rows: 8 })}
          </div>
        </Card>

        <Card title="Details" description="Dress code, Good to know and the thank-you note come from Event details.">
          {area('gift_guide', 'Gift guide', { max: 400 })}
          {area('reminders', 'Friendly reminders', { max: 1000, rows: 4, hint: 'One reminder per line.' })}
          {image('photo_image_url', 'photo_image_path', 'Photo below the details')}
        </Card>

        <Card title="Save the date and closing">
          {text('save_date_text', 'Line above SAVE THE DATE', { max: 80, hint: 'Defaults to the Hero headline.' })}
          {image('closing_image_url', 'closing_image_path', 'Closing photo', 'Square crops work best.')}
          {area('closing_letter', 'Closing letter', { max: 800, rows: 5 })}
          {text('closing_signature', 'Signature', { max: 60, hint: "Defaults to the celebrant's name." })}
        </Card>

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
