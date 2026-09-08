import { useState, type FormEvent } from 'react';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RadioGroupField, TextAreaField, TextField } from '@/components/ui/Field';
import { useToast } from '@/hooks/useToast';
import { toErrorMessage } from '@/lib/supabase';
import { fieldErrors, rsvpSchema, type RsvpInput } from '@/lib/validation';
import { submitRsvp } from '@/services/rsvp';

const EMPTY: RsvpInput = {
  full_name: '',
  attendance: 'attending',
  guest_count: '0',
  contact_number: '',
  message: '',
};

export function RsvpForm({ celebrantName }: { celebrantName: string }) {
  const [values, setValues] = useState<RsvpInput>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const { notify } = useToast();

  function update<K extends keyof RsvpInput>(key: K, value: RsvpInput[K]) {
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
    if (isSubmitting) return;

    const parsed = rsvpSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await submitRsvp(parsed.data);
      setIsDone(true);
      notify('Your RSVP has been recorded.', 'success');
    } catch (cause) {
      const message = toErrorMessage(cause, 'Your RSVP could not be sent. Try again.');
      setErrors({ _form: message });
      notify(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isDone) {
    const attending = values.attendance === 'attending';
    return (
      <div role="status" className="card flex flex-col items-center gap-4 py-12 text-center">
        <PartyPopper aria-hidden="true" className="h-8 w-8 text-champagne" />
        <h2 className="font-display text-2xl text-mist">
          {attending ? 'See you there' : 'Thank you for letting us know'}
        </h2>
        <p className="body-copy text-center">
          {attending
            ? `Your seat at ${celebrantName}'s celebration is confirmed.`
            : `${celebrantName} will miss you, but thanks for the reply.`}
        </p>
        <Button
          variant="ghost"
          onClick={() => {
            setValues(EMPTY);
            setIsDone(false);
          }}
        >
          Send another RSVP
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-6">
      {errors['_form'] ? (
        <p role="alert" className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {errors['_form']}
        </p>
      ) : null}

      <TextField
        label="Full name"
        required
        autoComplete="name"
        value={values.full_name}
        error={errors['full_name']}
        onChange={(event) => update('full_name', event.target.value)}
      />

      <RadioGroupField
        legend="Will you attend?"
        name="attendance"
        value={String(values.attendance)}
        error={errors['attendance']}
        onChange={(value) => {
          update('attendance', value as RsvpInput['attendance']);
          if (value === 'not_attending') update('guest_count', '0');
        }}
        options={[
          { value: 'attending', label: 'Yes, I will be there' },
          { value: 'not_attending', label: 'Sorry, I cannot make it' },
        ]}
      />

      <TextField
        label="Guests joining you"
        type="number"
        inputMode="numeric"
        min={0}
        max={20}
        hint="Not counting yourself."
        value={String(values.guest_count)}
        error={errors['guest_count']}
        disabled={values.attendance === 'not_attending'}
        onChange={(event) => update('guest_count', event.target.value)}
      />

      <TextField
        label="Contact number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint="Optional, in case plans change."
        value={values.contact_number ?? ''}
        error={errors['contact_number']}
        onChange={(event) => update('contact_number', event.target.value)}
      />

      <TextAreaField
        label="Message"
        hint="Optional note for the celebrant."
        value={values.message ?? ''}
        error={errors['message']}
        onChange={(event) => update('message', event.target.value)}
      />

      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
        Send RSVP
      </Button>
    </form>
  );
}
