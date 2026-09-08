import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2, Upload } from 'lucide-react';
import { AdminPage } from '@/components/layout/AdminPage';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { useToast } from '@/hooks/useToast';
import { ACCEPT_ATTRIBUTE, validateImageFile } from '@/lib/storage';
import { toErrorMessage } from '@/lib/supabase';
import { formatBytes } from '@/lib/utils';
import {
  addGalleryImage,
  deleteGalleryImage,
  fetchGalleryPage,
  persistGalleryOrder,
  updateGalleryImage,
} from '@/services/gallery';
import type { GalleryImage } from '@/types';

interface UploadTask {
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'done' | 'failed';
  error?: string;
}

/** Admin loads every image (hidden ones included) so ordering is unambiguous. */
async function fetchAll(): Promise<GalleryImage[]> {
  const collected: GalleryImage[] = [];
  let page = 0;
  for (;;) {
    const result = await fetchGalleryPage(page, true);
    collected.push(...result.images);
    if (!result.hasMore || page > 40) break;
    page += 1;
  }
  return collected;
}

export default function GalleryManager() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<GalleryImage | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [captionDrafts, setCaptionDrafts] = useState<Record<string, string>>({});
  const [isReordering, setIsReordering] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const { notify } = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setImages(await fetchAll());
    } catch (cause) {
      setError(toErrorMessage(cause, 'The gallery could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onFiles(fileList: FileList) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setTasks(files.map((file) => ({ name: file.name, size: file.size, status: 'pending' })));
    setIsUploading(true);

    let nextOrder = images.length;
    let succeeded = 0;

    // Sequential: keeps ordering deterministic and avoids hammering the
    // Storage rate limit when a whole album is dropped in at once.
    for (const [index, file] of files.entries()) {
      const invalid = validateImageFile(file);
      if (invalid) {
        setTasks((current) =>
          current.map((task, i) => (i === index ? { ...task, status: 'failed', error: invalid } : task)),
        );
        continue;
      }

      setTasks((current) => current.map((task, i) => (i === index ? { ...task, status: 'uploading' } : task)));
      try {
        const created = await addGalleryImage(file, nextOrder);
        nextOrder += 1;
        succeeded += 1;
        setImages((current) => [...current, created]);
        setTasks((current) => current.map((task, i) => (i === index ? { ...task, status: 'done' } : task)));
      } catch (cause) {
        const message = toErrorMessage(cause, 'Upload failed.');
        setTasks((current) =>
          current.map((task, i) => (i === index ? { ...task, status: 'failed', error: message } : task)),
        );
      }
    }

    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = '';
    if (succeeded > 0) notify(`${succeeded} photo${succeeded === 1 ? '' : 's'} uploaded.`, 'success');
    window.setTimeout(() => setTasks([]), 4000);
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;

    const previous = images;
    const next = [...images];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(target, 0, moved);

    setImages(next.map((image, i) => ({ ...image, display_order: i })));
    setIsReordering(true);
    try {
      await persistGalleryOrder(next);
    } catch (cause) {
      setImages(previous);
      notify(toErrorMessage(cause, 'The new order could not be saved.'), 'error');
    } finally {
      setIsReordering(false);
    }
  }

  async function saveCaption(image: GalleryImage) {
    const draft = captionDrafts[image.id];
    if (draft === undefined) return;
    const caption = draft.trim() ? draft.trim().slice(0, 200) : null;
    if (caption === image.caption) return;

    try {
      const updated = await updateGalleryImage(image.id, { caption });
      setImages((current) => current.map((item) => (item.id === image.id ? updated : item)));
      notify('Caption saved.', 'success');
    } catch (cause) {
      notify(toErrorMessage(cause, 'The caption could not be saved.'), 'error');
    }
  }

  async function toggleVisibility(image: GalleryImage) {
    try {
      const updated = await updateGalleryImage(image.id, { is_visible: !image.is_visible });
      setImages((current) => current.map((item) => (item.id === image.id ? updated : item)));
    } catch (cause) {
      notify(toErrorMessage(cause, 'Visibility could not be changed.'), 'error');
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await deleteGalleryImage(pendingDelete);
      setImages((current) => current.filter((item) => item.id !== pendingDelete.id));
      notify('Photo deleted.', 'success');
      setPendingDelete(null);
    } catch (cause) {
      notify(toErrorMessage(cause, 'The photo could not be deleted.'), 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AdminPage
      title="Gallery"
      description="Upload photos, set their order and write captions. Hidden photos stay in storage but never appear on the public site."
    >
      <div className="card">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTRIBUTE}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void onFiles(event.target.files);
          }}
        />
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl text-mist">Add photos</h2>
            <p className="mt-1 text-sm text-muted">
              JPG, PNG, WebP or AVIF, up to 5 MB each. Compress large photos before uploading — around
              1600px on the long edge is plenty.
            </p>
          </div>
          <Button isLoading={isUploading} onClick={() => inputRef.current?.click()} className="w-full sm:w-auto">
            <Upload aria-hidden="true" className="h-4 w-4" />
            Choose photos
          </Button>
        </div>

        {tasks.length > 0 ? (
          <ul className="mt-6 space-y-2" aria-live="polite">
            {tasks.map((task) => (
              <li
                key={task.name}
                className="flex items-center justify-between gap-3 rounded-lg border border-ink-line/60 px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 truncate text-mist">{task.name}</span>
                <span className="shrink-0 text-xs text-muted">{formatBytes(task.size)}</span>
                <span
                  className={
                    task.status === 'failed'
                      ? 'shrink-0 text-xs text-rose-300'
                      : task.status === 'done'
                        ? 'shrink-0 text-xs text-emerald-300'
                        : 'shrink-0 text-xs text-champagne'
                  }
                >
                  {task.status === 'failed' ? (task.error ?? 'Failed') : task.status}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState title="The gallery did not load" message={error} onRetry={() => void load()} />
        ) : images.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-line px-6 py-14 text-center">
            <p className="text-lg text-mist">No photos yet.</p>
            <p className="mt-2 text-sm text-muted">Upload the first photos to fill the gallery.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {images.map((image, index) => (
              <li key={image.id} className="card flex flex-col gap-4 sm:flex-row">
                <img
                  src={image.image_url}
                  alt=""
                  width={image.width ?? 200}
                  height={image.height ?? 200}
                  loading="lazy"
                  decoding="async"
                  className="h-28 w-full shrink-0 rounded-xl border border-ink-line object-cover sm:w-28"
                />

                <div className="min-w-0 flex-1 space-y-3">
                  <label className="block">
                    <span className="sr-only">Caption for photo {index + 1}</span>
                    <input
                      className="field-input py-2 text-sm"
                      placeholder="Add a caption"
                      maxLength={200}
                      defaultValue={image.caption ?? ''}
                      onChange={(event) =>
                        setCaptionDrafts((current) => ({ ...current, [image.id]: event.target.value }))
                      }
                      onBlur={() => void saveCaption(image)}
                    />
                  </label>
                  <p className="text-xs text-muted">
                    Position {index + 1} of {images.length}
                    {image.is_visible ? '' : ' · hidden from the public gallery'}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1 self-start">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={index === 0 || isReordering}
                    onClick={() => void move(index, -1)}
                  >
                    <ArrowUp aria-hidden="true" className="h-4 w-4" />
                    <span className="sr-only">Move photo {index + 1} earlier</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={index === images.length - 1 || isReordering}
                    onClick={() => void move(index, 1)}
                  >
                    <ArrowDown aria-hidden="true" className="h-4 w-4" />
                    <span className="sr-only">Move photo {index + 1} later</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void toggleVisibility(image)}>
                    {image.is_visible ? (
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    ) : (
                      <EyeOff aria-hidden="true" className="h-4 w-4" />
                    )}
                    <span className="sr-only">
                      {image.is_visible ? 'Hide' : 'Show'} photo {index + 1}
                    </span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setPendingDelete(image)}>
                    <Trash2 aria-hidden="true" className="h-4 w-4 text-rose-300" />
                    <span className="sr-only">Delete photo {index + 1}</span>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this photo?"
        body="The photo is removed from the gallery and deleted from storage. This cannot be undone."
        confirmLabel="Delete photo"
        isBusy={isDeleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </AdminPage>
  );
}
