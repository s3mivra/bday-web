import { useRef, useState } from 'react';
import { Music, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { AUDIO_ACCEPT_ATTRIBUTE, removeImage, uploadAudio, validateAudioFile } from '@/lib/storage';
import { toErrorMessage } from '@/lib/supabase';

export interface AudioValue {
  url: string | null;
  path: string | null;
}

interface AudioUploadFieldProps {
  label: string;
  hint?: string;
  value: AudioValue;
  onChange: (value: AudioValue) => void;
}

/** Same upload-then-replace flow as ImageUploadField, for the background song. */
export function AudioUploadField({ label, hint, value, onChange }: AudioUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { notify } = useToast();

  async function onFile(file: File) {
    const invalid = validateAudioFile(file);
    if (invalid) {
      notify(invalid, 'error');
      return;
    }

    setIsUploading(true);
    const previousPath = value.path;
    try {
      const uploaded = await uploadAudio(file);
      onChange({ url: uploaded.url, path: uploaded.path });
      if (previousPath) await removeImage(previousPath).catch(() => undefined);
      notify('Song uploaded. Save to publish it.', 'success');
    } catch (cause) {
      notify(toErrorMessage(cause, 'The song could not be uploaded.'), 'error');
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-dashed border-ink-line"
        >
          <Music className={value.url ? 'h-5 w-5 text-champagne' : 'h-5 w-5 text-muted'} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {value.url ? <audio controls src={value.url} preload="none" className="w-full max-w-sm" /> : null}
          <input
            ref={inputRef}
            type="file"
            accept={AUDIO_ACCEPT_ATTRIBUTE}
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void onFile(file);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" isLoading={isUploading} onClick={() => inputRef.current?.click()}>
              {value.url ? 'Replace song' : 'Upload song'}
            </Button>
            {value.url ? (
              <Button variant="ghost" size="sm" onClick={() => void onRemove()}>
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Remove
              </Button>
            ) : null}
          </div>
          {hint ? <p className="max-w-xs text-xs text-muted">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}
