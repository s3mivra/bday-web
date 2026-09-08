import { useMemo, useState, type FormEvent } from 'react';
import { AdminPage, FormActions } from '@/components/layout/AdminPage';
import { TextAreaField, TextField } from '@/components/ui/Field';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useToast } from '@/hooks/useToast';
import { toErrorMessage } from '@/lib/supabase';
import { aboutSettingsSchema, fieldErrors, type AboutSettingsInput } from '@/lib/validation';
import { DEFAULT_ABOUT, saveAboutSettings } from '@/services/settings';
import type { AboutSettings } from '@/types';

interface FormState extends AboutSettingsInput {
  image_path: string | null;
}

function toFormValues(about: AboutSettings | null): FormState {
  return {
    title: about?.title ?? DEFAULT_ABOUT.title,
    greeting: about?.greeting ?? '',
    description: about?.description ?? '',
    birthday_message: about?.birthday_message ?? '',
    image_url: about?.image_url ?? '',
    image_path: about?.image_path ?? null,
  };
}

export default function AboutEditor() {
  const { about, event, applyAbout } = useSiteContent();
  const { notify } = useToast();

  const initial = useMemo(() => toFormValues(about), [about]);
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

  async function onSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (isSaving) return;

    const parsed = aboutSettingsSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      notify('Fix the highlighted fields before saving.', 'error');
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const saved = await saveAboutSettings({ ...parsed.data, image_path: values.image_path });
      applyAbout(saved);
      setValues(toFormValues(saved));
      notify('About section saved.', 'success');
    } catch (cause) {
      notify(toErrorMessage(cause, 'The about section could not be saved.'), 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminPage title="About" description="The personal section that introduces the celebrant.">
      <form onSubmit={onSubmit} noValidate className="space-y-8">
        <section className="card space-y-6">
          <TextField
            label="Section title"
            required
            maxLength={80}
            value={values.title}
            error={errors['title']}
            onChange={(e) => update('title', e.target.value)}
          />
          <TextField
            label="Greeting"
            maxLength={120}
            placeholder={event ? `Hi, I am ${event.celebrant_name}` : 'Hi, I am ...'}
            hint="Leave blank to greet with the celebrant's name automatically."
            value={values.greeting ?? ''}
            error={errors['greeting']}
            onChange={(e) => update('greeting', e.target.value)}
          />
          <TextAreaField
            label="Description"
            rows={6}
            maxLength={900}
            hint="Line breaks are preserved."
            value={values.description ?? ''}
            error={errors['description']}
            onChange={(e) => update('description', e.target.value)}
          />
          <TextAreaField
            label="Birthday message"
            rows={3}
            maxLength={600}
            hint="Shown as a pull quote."
            value={values.birthday_message ?? ''}
            error={errors['birthday_message']}
            onChange={(e) => update('birthday_message', e.target.value)}
          />
        </section>

        <section className="card">
          <ImageUploadField
            label="Profile photo"
            folder="about"
            hint="Shown at a 4:5 crop. JPG, PNG, WebP or AVIF up to 5 MB."
            value={{ url: values.image_url ?? null, path: values.image_path }}
            onChange={(next) => {
              update('image_url', next.url ?? '');
              update('image_path', next.path);
            }}
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
