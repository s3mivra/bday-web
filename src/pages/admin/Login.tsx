import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/Field';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { toErrorMessage } from '@/lib/supabase';
import { credentialsSchema, fieldErrors } from '@/lib/validation';

export default function Login() {
  const { session, isLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useDocumentTitle('Sign in · Invitation admin');

  if (isLoading) {
    return (
      <div className="mx-auto max-w-sm space-y-4 p-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (session) return <Navigate to="/admin" replace />;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await signIn(parsed.data.email, parsed.data.password);
      navigate('/admin', { replace: true });
    } catch (cause) {
      // Deliberately generic: do not reveal whether the address exists.
      const raw = toErrorMessage(cause, '');
      setErrors({
        _form: /invalid login/i.test(raw) ? 'Those credentials did not match an account.' : raw || 'Sign in failed.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-champagne"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to site
        </Link>
        <h1 className="font-display text-3xl text-mist">Invitation admin</h1>
        <p className="mt-2 text-sm text-muted">Sign in to edit the invitation content.</p>

        <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
          {errors['_form'] ? (
            <p
              role="alert"
              className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
            >
              {errors['_form']}
            </p>
          ) : null}

          <TextField
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            error={errors['email']}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            error={errors['password']}
            onChange={(event) => setPassword(event.target.value)}
          />

          <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
