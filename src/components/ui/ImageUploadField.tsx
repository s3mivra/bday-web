import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { ACCEPT_ATTRIBUTE, removeImage, uploadImage, validateImageFile } from '@/lib/storage';
import { toErrorMessage } from '@/lib/supabase';

export interface ImageValue {
  url: string | null;
  path: string | null;
}

interface ImageUploadFieldProps {
  label: string;
  hint?: string;
  folder: 'hero' | 'about';
  value: ImageValue;
  onChange: (value: ImageValue) => void;
  aspect?: string;
}

/**
 * Uploads immediately and hands back `{ url, path }`. The previous object is
 * deleted only after the new one lands, so a failed upload never leaves the
 * record without an image.
 */
export function ImageUploadField({
  label,
  hint,
  folder,
  value,
  onChange,
  aspect = 'aspect-[4/5]',
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { notify } = useToast();

  async function onFile(file: File) {
    const invalid = validateImageFile(file);
    if (invalid) {
      notify(invalid, 'error');
      return;
    }

    setIsUploading(true);
    const previousPath = value.path;
    try {
      const uploaded = await uploadImage(file, folder);
      onChange({ url: uploaded.url, path: uploaded.path });
      if (previousPath) await removeImage(previousPath).catch(() => undefined);
      notify('Image uploaded. Save to publish it.', 'success');
    } catch (cause) {
      notify(toErrorMessage(cause, 'The image could not be uploaded.'), 'error');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function onRemove() {
    const path = value.path;
    onChange({ url: null, path: null });
    if (path) await removeImage(path).catch(() => undefined);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-mist">{label}</p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {value.url ? (
          <img
            src={value.url}
            alt=""
            className={`w-32 shrink-0 rounded-xl border border-ink-line object-cover ${aspect}`}
          />
        ) : (
          <div
            aria-hidden="true"
            className={`flex w-32 shrink-0 items-center justify-center rounded-xl border border-dashed border-ink-line ${aspect}`}
          >
            <ImagePlus className="h-5 w-5 text-muted" />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            isLoading={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {value.url ? 'Replace image' : 'Upload image'}
          </Button>
          {value.url ? (
            <Button variant="ghost" size="sm" onClick={() => void onRemove()} className="justify-start">
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
          {hint ? <p className="max-w-xs text-xs text-muted">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}
