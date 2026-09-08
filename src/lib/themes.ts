/**
 * Site colour themes. The actual channel values live in `src/index.css` under
 * `[data-theme='<id>']`; this module only lists the options and applies the
 * chosen one to the document root.
 */
export const THEMES = [
  { id: 'midnight', label: 'Midnight', swatch: '#150F1E', accent: '#E4C285' },
  { id: 'rosewood', label: 'Rosewood', swatch: '#1E0F14', accent: '#E9A896' },
  { id: 'forest', label: 'Forest', swatch: '#0D1814', accent: '#D6C48C' },
  { id: 'noir', label: 'Noir', swatch: '#121214', accent: '#E0C896' },
  { id: 'ocean', label: 'Ocean', swatch: '#0C1420', accent: '#96BEC8' },
] as const;

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME: ThemeId = 'midnight';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEMES.some((theme) => theme.id === value);
}

/** Sets `data-theme` on <html>, falling back to the default for unknown values. */
export function applyTheme(value: string | null | undefined): void {
  document.documentElement.dataset.theme = isThemeId(value) ? value : DEFAULT_THEME;
}
