import { MEDIA_BUCKET, supabase } from '@/lib/supabase';
import { slugify } from '@/lib/utils';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
export const ACCEPT_ATTRIBUTE = ACCEPTED_IMAGE_TYPES.join(',');

export interface UploadedFile {
  path: string;
  url: string;
  width: number | null;
  height: number | null;
}

export function validateImageFile(file: File): string | null {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return `${file.name} is not a supported image. Use JPG, PNG, WebP or AVIF.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${file.name} is larger than 5 MB. Compress it and try again.`;
  }
  return null;
}

/** Reads intrinsic dimensions so the grid can reserve space and avoid layout shift. */
export function readImageDimensions(file: File): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: null, height: null });
    };
    img.src = url;
  });
}

function extensionFor(file: File): string {
  const fromName = file.name.split('.').pop();
  if (fromName && /^[a-z0-9]{2,5}$/i.test(fromName)) return fromName.toLowerCase();
  return file.type.split('/')[1] ?? 'jpg';
}

export async function uploadImage(file: File, folder: 'gallery' | 'hero' | 'about'): Promise<UploadedFile> {
  const invalid = validateImageFile(file);
  if (invalid) throw new Error(invalid);

  const base = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${base}.${extensionFor(file)}`;

  const dimensions = await readImageDimensions(file);

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl, width: dimensions.width, height: dimensions.height };
}

/** Storage failures here are non-fatal: the DB row is the source of truth. */
export async function removeImage(path: string | null): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  if (error && !/not found/i.test(error.message)) throw error;
}
