import { z } from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .transform((v) => (v.length ? v : null))
    .nullable();

const httpUrl = z
  .string()
  .trim()
  .transform((v) => (v.length ? v : null))
  .nullable()
  .refine(
    (v) => {
      if (!v) return true;
      try {
        const parsed = new URL(v);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Enter a full URL starting with https://' },
  );

const dateOnly = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date.');

const timeOnly = z
  .string()
  .trim()
  .transform((v) => (v.length ? v : null))
  .nullable()
  .refine((v) => v === null || /^\d{2}:\d{2}(:\d{2})?$/.test(v), { message: 'Pick a valid time.' });

export const eventSettingsSchema = z
  .object({
    celebrant_name: z.string().trim().min(1, 'Enter the celebrant’s name.').max(80),
    age: z
      .union([z.string(), z.number()])
      .transform((v) => (v === '' || v === null ? null : Number(v)))
      .nullable()
      .refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 130), {
        message: 'Enter an age between 0 and 130.',
      }),
    birthday_date: dateOnly.nullable().or(z.literal('').transform(() => null)),
    event_date: dateOnly,
    start_time: timeOnly,
    end_time: timeOnly,
    venue: z.string().trim().min(1, 'Enter the venue name.').max(120),
    address: z.string().trim().min(1, 'Enter the address.').max(200),
    dress_code: optionalText(80),
    description: optionalText(600),
    birthday_message: optionalText(600),
    additional_info: optionalText(600),
    google_maps_url: httpUrl,
    rsvp_url: httpUrl,
    rsvp_method: z.enum(['google_form', 'supabase']),
    rsvp_deadline: dateOnly.nullable().or(z.literal('').transform(() => null)),
    seo_title: optionalText(70),
    seo_description: optionalText(200),
  })
  .superRefine((value, ctx) => {
    if (value.start_time && value.end_time && value.end_time <= value.start_time) {
      ctx.addIssue({ code: 'custom', path: ['end_time'], message: 'End time must be after the start time.' });
    }
  });

export type EventSettingsInput = z.input<typeof eventSettingsSchema>;

/**
 * The Google-Form-needs-a-URL rule lives here rather than on
 * `eventSettingsSchema`: the RSVP page is the only screen that renders the URL
 * field, so raising it anywhere else produces an error the user cannot act on.
 */
export const rsvpSettingsSchema = z
  .object({
    rsvp_method: z.enum(['google_form', 'supabase']),
    rsvp_url: httpUrl,
    rsvp_deadline: dateOnly.nullable().or(z.literal('').transform(() => null)),
    rsvp_note: optionalText(600),
  })
  .superRefine((value, ctx) => {
    if (value.rsvp_method === 'google_form' && !value.rsvp_url) {
      ctx.addIssue({
        code: 'custom',
        path: ['rsvp_url'],
        message: 'Enter the Google Form URL so guests have somewhere to reply.',
      });
    }
  });

export type RsvpSettingsInput = z.input<typeof rsvpSettingsSchema>;
export type EventSettingsOutput = z.output<typeof eventSettingsSchema>;

export const heroSettingsSchema = z.object({
  label: optionalText(60),
  title: z.string().trim().min(1, 'Enter a hero headline.').max(80),
  subtitle: optionalText(200),
  image_url: httpUrl,
  show_countdown: z.boolean(),
});

export type HeroSettingsInput = z.input<typeof heroSettingsSchema>;

export const invitationSettingsSchema = z.object({
  envelope_enabled: z.boolean(),
  envelope_heading: optionalText(60),
  hero_tagline: optionalText(120),
  song_title: optionalText(80),
  song_subtitle: optionalText(120),
  song_url: httpUrl,
  countdown_title: optionalText(160),
  countdown_text: optionalText(300),
  countdown_image_url: httpUrl,
  banner_text: optionalText(120),
  ceremony_title: optionalText(40),
  ceremony_time: timeOnly,
  ceremony_venue: optionalText(120),
  ceremony_address: optionalText(200),
  ceremony_maps_url: httpUrl,
  reception_title: optionalText(40),
  fun_title: optionalText(60),
  fun_text: optionalText(400),
  ninong: optionalText(2000),
  ninang: optionalText(2000),
  gift_guide: optionalText(400),
  reminders: optionalText(1000),
  photo_image_url: httpUrl,
  save_date_text: optionalText(80),
  closing_letter: optionalText(800),
  closing_signature: optionalText(60),
  closing_image_url: httpUrl,
  softcopy_title: optionalText(60),
  softcopy_text: optionalText(200),
  softcopy_image_url: httpUrl,
});

export type InvitationSettingsInput = z.input<typeof invitationSettingsSchema>;

export const rsvpSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Enter your full name.').max(80),
    attendance: z.enum(['attending', 'not_attending'], {
      errorMap: () => ({ message: 'Let us know if you can make it.' }),
    }),
    guest_count: z
      .union([z.string(), z.number()])
      .transform((v) => (v === '' ? 0 : Number(v)))
      .refine((v) => Number.isInteger(v) && v >= 0 && v <= 20, {
        message: 'Enter a number of guests between 0 and 20.',
      }),
    contact_number: z
      .string()
      .trim()
      .max(30)
      .transform((v) => (v.length ? v : null))
      .nullable()
      .refine((v) => v === null || /^[+()\d\s-]{7,30}$/.test(v), {
        message: 'Enter a valid contact number.',
      }),
    message: optionalText(500),
  })
  .superRefine((value, ctx) => {
    if (value.attendance === 'not_attending' && value.guest_count > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['guest_count'],
        message: 'Set guests to 0 when you cannot make it.',
      });
    }
  });

export type RsvpInput = z.input<typeof rsvpSchema>;
export type RsvpOutput = z.output<typeof rsvpSchema>;

export const credentialsSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Passwords are at least 8 characters.'),
});

/** Flattens a ZodError into `{ fieldName: firstMessage }` for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
