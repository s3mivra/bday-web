import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';
import { AdminPage, FormActions } from '@/components/layout/AdminPage';
import { Button } from '@/components/ui/Button';
import { RadioGroupField, TextField } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState, InfoPanel } from '@/components/ui/States';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useToast } from '@/hooks/useToast';
import { toErrorMessage } from '@/lib/supabase';
import { formatDateTime, safeExternalUrl, slugify } from '@/lib/utils';
import { fieldErrors, rsvpSettingsSchema } from '@/lib/validation';
import { saveEventSettings } from '@/services/settings';
import { fetchRsvps, summariseRsvps, toCsv } from '@/services/rsvp';
import type { Rsvp, RsvpMethod } from '@/types';

interface FormState {
  rsvp_method: RsvpMethod;
  rsvp_url: string;
  rsvp_deadline: string;
}

function downloadCsv(rows: Rsvp[], celebrantName: string) {
  const blob = new Blob([`\uFEFF${toCsv(rows)}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${slugify(celebrantName) || 'rsvps'}-responses.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function RsvpSettings() {
  const { event, applyEvent } = useSiteContent();
  const { notify } = useToast();

  const initial = useMemo<FormState>(
    () => ({
      rsvp_method: event?.rsvp_method ?? 'google_form',
      rsvp_url: event?.rsvp_url ?? '',
      rsvp_deadline: event?.rsvp_deadline ?? '',
    }),
    [event],
  );

  const [values, setValues] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [isLoadingRsvps, setIsLoadingRsvps] = useState(false);
  const [rsvpError, setRsvpError] = useState<string | null>(null);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initial);
  const previewUrl = safeExternalUrl(values.rsvp_url);

  const loadRsvps = useCallback(async () => {
    setIsLoadingRsvps(true);
    setRsvpError(null);
    try {
      setRsvps(await fetchRsvps());
    } catch (cause) {
      setRsvpError(toErrorMessage(cause, 'Responses could not be loaded.'));
    } finally {
      setIsLoadingRsvps(false);
    }
  }, []);

  useEffect(() => {
    if (initial.rsvp_method === 'supabase') void loadRsvps();
  }, [initial.rsvp_method, loadRsvps]);

  async function onSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (isSaving || !event) return;

    const parsed = rsvpSettingsSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      const saved = await saveEventSettings({
        rsvp_method: parsed.data.rsvp_method,
        rsvp_url: parsed.data.rsvp_url,
        rsvp_deadline: parsed.data.rsvp_deadline,
      });
      applyEvent(saved);
      notify('RSVP settings saved.', 'success');
      if (saved.rsvp_method === 'supabase') void loadRsvps();
    } catch (cause) {
      notify(toErrorMessage(cause, 'RSVP settings could not be saved.'), 'error');
    } finally {
      setIsSaving(false);
    }
  }

  const totals = summariseRsvps(rsvps);

  if (!event) {
    return (
      <AdminPage title="RSVP">
        <InfoPanel>Fill in the event details first, then come back to configure RSVPs.</InfoPanel>
      </AdminPage>
    );
  }

  return (
    <AdminPage title="RSVP" description="Choose where guest responses go and share the RSVP link.">
      <form onSubmit={onSubmit} noValidate className="space-y-8">
        <section className="card space-y-6">
          <RadioGroupField
            legend="RSVP method"
            name="rsvp_method"
            value={values.rsvp_method}
            onChange={(value) => setValues((current) => ({ ...current, rsvp_method: value as RsvpMethod }))}
            options={[
              {
                value: 'google_form',
                label: 'Google Form',
                description: 'Guests scan a QR code or open your form. Responses land in your sheet.',
              },
              {
                value: 'supabase',
                label: 'Built-in form',
                description: 'Guests fill in a form on this site. Responses appear below.',
              },
            ]}
          />

          {values.rsvp_method === 'google_form' ? (
            <TextField
              label="Google Form URL"
              type="url"
              inputMode="url"
              required
              placeholder="https://forms.gle/..."
              value={values.rsvp_url}
              error={errors['rsvp_url']}
              onChange={(e) => {
                setValues((current) => ({ ...current, rsvp_url: e.target.value }));
                setErrors({});
              }}
            />
          ) : null}

          <TextField
            label="RSVP deadline"
            type="date"
            hint="Optional. Shown to guests as a reply-by date."
            value={values.rsvp_deadline}
            onChange={(e) => setValues((current) => ({ ...current, rsvp_deadline: e.target.value }))}
          />
        </section>

        {values.rsvp_method === 'google_form' && previewUrl ? (
          <section className="card">
            <h2 className="font-display text-xl text-mist">QR code preview</h2>
            <p className="mt-1 text-sm text-muted">
              This is the code guests see on the RSVP page. Save it to print on cards or signage.
            </p>
            <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div id="admin-qr" className="rounded-xl bg-mist p-4">
                <QRCodeCanvas
                  value={previewUrl}
                  size={160}
                  level="M"
                  marginSize={1}
                  bgColor="#F6F1EA"
                  fgColor="#150F1E"
                  aria-label="QR code preview for the RSVP form"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const canvas = document.querySelector<HTMLCanvasElement>('#admin-qr canvas');
                  if (!canvas) return;
                  const link = document.createElement('a');
                  link.download = `${slugify(event.celebrant_name) || 'rsvp'}-qr.png`;
                  link.href = canvas.toDataURL('image/png');
                  link.click();
                }}
              >
                <Download aria-hidden="true" className="h-4 w-4" />
                Save QR code
              </Button>
            </div>
          </section>
        ) : null}

        <FormActions
          isSaving={isSaving}
          isDirty={isDirty}
          onCancel={() => {
            setValues(initial);
            setErrors({});
          }}
        />
      </form>

      {event.rsvp_method === 'supabase' ? (
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl text-mist">Responses</h2>
              <p className="mt-1 text-sm text-muted">
                {totals.responses} replies · {totals.attending} attending · {totals.headcount} expected heads
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={rsvps.length === 0}
              onClick={() => downloadCsv(rsvps, event.celebrant_name)}
            >
              Export CSV
            </Button>
          </div>

          <div className="mt-6">
            {isLoadingRsvps ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full" />
                ))}
              </div>
            ) : rsvpError ? (
              <ErrorState title="Responses did not load" message={rsvpError} onRetry={() => void loadRsvps()} />
            ) : rsvps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-ink-line px-6 py-12 text-center">
                <p className="text-mist">No responses yet.</p>
                <p className="mt-2 text-sm text-muted">Share the invitation link and replies will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-ink-line/70">
                <table className="w-full min-w-[40rem] text-left text-sm">
                  <thead className="border-b border-ink-line/70 text-xs text-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Name</th>
                      <th scope="col" className="px-4 py-3 font-medium">Attendance</th>
                      <th scope="col" className="px-4 py-3 font-medium">Guests</th>
                      <th scope="col" className="px-4 py-3 font-medium">Contact</th>
                      <th scope="col" className="px-4 py-3 font-medium">Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rsvps.map((row) => (
                      <tr key={row.id} className="border-b border-ink-line/40 last:border-0">
                        <td className="px-4 py-3 text-mist">
                          {row.full_name}
                          {row.message ? (
                            <span className="mt-1 block max-w-md text-xs text-muted">{row.message}</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={
                              row.attendance === 'attending'
                                ? 'rounded-full border border-emerald-400/40 px-2 py-0.5 text-xs text-emerald-200'
                                : 'rounded-full border border-ink-line px-2 py-0.5 text-xs text-muted'
                            }
                          >
                            {row.attendance === 'attending' ? 'Attending' : 'Not attending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted">{row.guest_count}</td>
                        <td className="px-4 py-3 text-muted">{row.contact_number ?? '—'}</td>
                        <td className="px-4 py-3 text-muted">{formatDateTime(row.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      ) : null}
    </AdminPage>
  );
}
