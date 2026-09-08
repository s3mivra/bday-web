import { supabase } from '@/lib/supabase';
import type { RsvpOutput } from '@/lib/validation';
import type { Rsvp } from '@/types';

export interface RsvpTotals {
  responses: number;
  attending: number;
  declined: number;
  headcount: number;
}

/**
 * Anonymous visitors hold INSERT-only rights on `rsvps` (see RLS policy), so
 * this call intentionally does not `.select()` the inserted row back.
 */
export async function submitRsvp(values: RsvpOutput): Promise<void> {
  const { error } = await supabase.from('rsvps').insert({
    full_name: values.full_name,
    guest_count: values.guest_count,
    attendance: values.attendance,
    contact_number: values.contact_number,
    message: values.message,
  });
  if (error) throw error;
}

export async function fetchRsvps(): Promise<Rsvp[]> {
  const { data, error } = await supabase
    .from('rsvps')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Rsvp[];
}

export function summariseRsvps(rows: Rsvp[]): RsvpTotals {
  return rows.reduce<RsvpTotals>(
    (totals, row) => {
      totals.responses += 1;
      if (row.attendance === 'attending') {
        totals.attending += 1;
        totals.headcount += 1 + row.guest_count;
      } else {
        totals.declined += 1;
      }
      return totals;
    },
    { responses: 0, attending: 0, declined: 0, headcount: 0 },
  );
}

export function toCsv(rows: Rsvp[]): string {
  const header = ['Name', 'Attendance', 'Guests', 'Contact', 'Message', 'Submitted'];
  const escape = (value: string | number | null) => {
    const text = value === null ? '' : String(value);
    // Prefix formula-leading characters to neutralise CSV injection in Excel/Sheets.
    const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${guarded.replace(/"/g, '""')}"`;
  };
  const lines = rows.map((row) =>
    [
      escape(row.full_name),
      escape(row.attendance === 'attending' ? 'Attending' : 'Not attending'),
      escape(row.guest_count),
      escape(row.contact_number),
      escape(row.message),
      escape(row.created_at),
    ].join(','),
  );
  return [header.join(','), ...lines].join('\n');
}
