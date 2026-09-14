import { useMemo, useState, type FormEvent } from 'react';
import { AdminPage, FormActions } from '@/components/layout/AdminPage';
import { TextAreaField, TextField, ToggleField } from '@/components/ui/Field';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useToast } from '@/hooks/useToast';
import { toErrorMessage } from '@/lib/supabase';
import { fieldErrors, heroSettingsSchema, type HeroSettingsInput } from '@/lib/validation';
import { DEFAULT_HERO, saveHeroSettings } from '@/services/settings';
import type { HeroSettings } from '@/types';

interface FormState extends HeroSettingsInput {
  image_path: string | null;
}

function toFormValues(hero: HeroSettings | null): FormState {
  return {
    label: hero?.label ?? DEFAULT_HERO.label,
    title: hero?.title ?? DEFAULT_HERO.title,
    subtitle: hero?.subtitle ?? '',
    image_url: hero?.image_url ?? '',
    image_path: hero?.image_path ?? null,
    show_countdown: hero?.show_countdown ?? true,
  };
}

export default function HeroEditor() {
  const { hero, applyHero } = useSiteContent();
  const { notify } = useToast();

  const initial = useMemo(() => toFormValues(hero), [hero]);
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

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    const parsed = heroSettingsSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      notify('Fix the highlighted fields before saving.', 'error');
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const saved = await saveHeroSettings({ ...parsed.data, image_path: values.image_path });
      applyHero(saved);
      setValues(toFormValues(saved));
      notify('Hero saved.', 'success');
    } catch (cause) {
      notify(toErrorMessage(cause, 'The hero could not be saved.'), 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminPage title="Hero" description="The top of the invitation, shown right after the envelope opens.">
      <form onSubmit={onSubmit} noValidate className="space-y-8">
        <section className="card space-y-6">
          <TextField
            label="Small label"
            maxLength={60}
            placeholder="Please join us to celebrate"
            value={values.label ?? ''}
            error={errors['label']}
            onChange={(e) => update('label', e.target.value)}
          />
          <TextField
            label="Occasion"
            required
            maxLength={80}
            placeholder="Christening & 1st Birthday"
            hint="Shown under the celebrant's name, on the envelope letter and above SAVE THE DATE. The name itself comes from Event details."
            value={values.title}
            error={errors['title']}
            onChange={(e) => update('title', e.target.value)}
          />
          <TextAreaField
            label="Tagline"
            rows={2}
            maxLength={200}
            hint="Shown under the main photo. The tagline in Invitation sections takes priority if both are filled in."
            value={values.subtitle ?? ''}
            error={errors['subtitle']}
            onChange={(e) => update('subtitle', e.target.value)}
          />
        </section>

        <section className="card space-y-6">
          <ImageUploadField
            label="Main photo"
            folder="hero"
            aspect="aspect-square"
            hint="Shown in the round frame. Square crops work best. JPG, PNG, WebP or AVIF up to 5 MB."
            value={{ url: values.image_url ?? null, path: values.image_path }}
            onChange={(next) => {
              update('image_url', next.url ?? '');
              update('image_path', next.path);
            }}
          />
        </section>

        <section className="card space-y-6">
          <ToggleField
            label="Show the countdown"
            description="Counts down to the ceremony time (or the event start time), then shows a thank-you message."
            checked={values.show_countdown}
            onChange={(checked) => update('show_countdown', checked)}
          />
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
