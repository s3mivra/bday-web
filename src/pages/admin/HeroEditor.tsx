import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { AdminPage, FormActions } from '@/components/layout/AdminPage';
import { TextAreaField, TextField, ToggleField } from '@/components/ui/Field';
import { ImageUploadField } from '@/components/ui/ImageUploadField';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useToast } from '@/hooks/useToast';
import { toErrorMessage } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { applyTheme, DEFAULT_THEME, isThemeId, THEMES, type ThemeId } from '@/lib/themes';
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
    primary_cta_text: hero?.primary_cta_text ?? DEFAULT_HERO.primary_cta_text,
    secondary_cta_text: hero?.secondary_cta_text ?? DEFAULT_HERO.secondary_cta_text,
    show_countdown: hero?.show_countdown ?? true,
    theme: isThemeId(hero?.theme) ? hero.theme : DEFAULT_THEME,
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

  // Preview the picked theme live; restore the saved one when leaving unsaved.
  useEffect(() => {
    applyTheme(values.theme);
  }, [values.theme]);
  useEffect(() => () => applyTheme(hero?.theme), [hero?.theme]);

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
    <AdminPage title="Hero" description="The first thing guests see when the invitation opens.">
      <form onSubmit={onSubmit} noValidate className="space-y-8">
        <section className="card space-y-6">
          <TextField
            label="Small label"
            maxLength={60}
            placeholder="You are invited"
            value={values.label ?? ''}
            error={errors['label']}
            onChange={(e) => update('label', e.target.value)}
          />
          <TextField
            label="Headline"
            required
            maxLength={80}
            hint="Sits under the celebrant's name. The name itself comes from Event details."
            value={values.title}
            error={errors['title']}
            onChange={(e) => update('title', e.target.value)}
          />
          <TextAreaField
            label="Subtitle"
            rows={2}
            maxLength={200}
            hint="Leave blank to show “to celebrate the Nth birthday”."
            value={values.subtitle ?? ''}
            error={errors['subtitle']}
            onChange={(e) => update('subtitle', e.target.value)}
          />
        </section>

        <section className="card space-y-6">
          <ImageUploadField
            label="Hero image"
            folder="hero"
            hint="Portrait crops work best. JPG, PNG, WebP or AVIF up to 5 MB."
            value={{ url: values.image_url ?? null, path: values.image_path }}
            onChange={(next) => {
              update('image_url', next.url ?? '');
              update('image_path', next.path);
            }}
          />
        </section>

        <section className="card space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <TextField
              label="Primary button text"
              required
              maxLength={30}
              value={values.primary_cta_text}
              error={errors['primary_cta_text']}
              onChange={(e) => update('primary_cta_text', e.target.value)}
            />
            <TextField
              label="Secondary button text"
              required
              maxLength={30}
              value={values.secondary_cta_text}
              error={errors['secondary_cta_text']}
              onChange={(e) => update('secondary_cta_text', e.target.value)}
            />
          </div>
          <ToggleField
            label="Show the countdown"
            description="Counts down to the event date and start time, then shows a closing message."
            checked={values.show_countdown}
            onChange={(checked) => update('show_countdown', checked)}
          />
        </section>

        <section className="card space-y-4">
          <div>
            <p className="text-sm font-medium text-mist">Site theme</p>
            <p className="mt-1 text-xs text-muted">
              Changes the colours across the whole invitation. The page updates as you pick — save to keep it.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {THEMES.map((theme) => {
              const selected = values.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => update('theme', theme.id as ThemeId)}
                  aria-pressed={selected}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors duration-200',
                    selected
                      ? 'border-champagne/70 bg-champagne/10'
                      : 'border-ink-line bg-ink hover:border-ink-line/60',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10"
                    style={{ backgroundColor: theme.swatch }}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: theme.accent }} />
                  </span>
                  <span className="min-w-0 flex-1 text-sm text-mist">{theme.label}</span>
                  {selected ? <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-champagne" /> : null}
                </button>
              );
            })}
          </div>
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
