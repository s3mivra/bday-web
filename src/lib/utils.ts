export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

const DATE_LOCALE = 'en-PH';

/** Parses a `YYYY-MM-DD` column into a local-midnight Date without UTC drift. */
export function parseDateOnly(value: string | null): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Combines a `YYYY-MM-DD` date and optional `HH:MM[:SS]` time into a local Date. */
export function toLocalDateTime(dateValue: string | null, timeValue: string | null): Date | null {
  const date = parseDateOnly(dateValue);
  if (!date) return null;
  if (timeValue) {
    const [h, min] = timeValue.split(':').map(Number);
    date.setHours(Number.isFinite(h) ? (h as number) : 0, Number.isFinite(min) ? (min as number) : 0, 0, 0);
  }
  return date;
}

export function formatLongDate(value: string | null): string {
  const date = parseDateOnly(value);
  if (!date) return 'Date to be announced';
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(value: string | null): string {
  const date = parseDateOnly(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(DATE_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatTime(value: string | null): string | null {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  if (!Number.isFinite(h)) return null;
  const date = new Date();
  date.setHours(h as number, Number.isFinite(m) ? (m as number) : 0, 0, 0);
  return new Intl.DateTimeFormat(DATE_LOCALE, { hour: 'numeric', minute: '2-digit' }).format(date);
}

export function formatTimeRange(start: string | null, end: string | null): string {
  const from = formatTime(start);
  const to = formatTime(end);
  if (from && to) return `${from} – ${to}`;
  if (from) return `From ${from}`;
  return 'Time to be announced';
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(DATE_LOCALE, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

/** 1 -> 1st, 2 -> 2nd, 18 -> 18th. */
export function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * Only http(s) URLs are allowed through to `href`/QR payloads. Blocks
 * `javascript:` and `data:` injection from stored admin content.
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function mapsUrlFor(event: { google_maps_url: string | null; venue: string; address: string }): string | null {
  const configured = safeExternalUrl(event.google_maps_url);
  if (configured) return configured;
  const query = [event.venue, event.address].filter(Boolean).join(', ').trim();
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
