import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface AdminPageProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AdminPage({ title, description, children }: AdminPageProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-8">
        <h1 className="font-display text-3xl text-mist">{title}</h1>
        {description ? <p className="mt-2 max-w-prose text-sm text-muted">{description}</p> : null}
      </header>
      {children}
    </div>
  );
}

interface FormActionsProps {
  isSaving: boolean;
  isDirty: boolean;
  onCancel: () => void;
}

export function FormActions({ isSaving, isDirty, onCancel }: FormActionsProps) {
  return (
    <div className="sticky bottom-0 -mx-4 mt-10 flex flex-col-reverse gap-2 border-t border-ink-line/70 bg-ink/95 px-4 py-4 backdrop-blur sm:mx-0 sm:flex-row sm:justify-end sm:rounded-b-2xl sm:px-0">
      <Button variant="ghost" onClick={onCancel} disabled={isSaving || !isDirty}>
        Cancel changes
      </Button>
      <Button type="submit" isLoading={isSaving} disabled={!isDirty}>
        Save changes
      </Button>
    </div>
  );
}
