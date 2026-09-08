import { removeImage, uploadImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { GalleryImage } from '@/types';

export const GALLERY_PAGE_SIZE = 12;

export interface GalleryPage {
  images: GalleryImage[];
  hasMore: boolean;
  total: number;
}

/**
 * Range-based pagination keeps the initial payload small on large galleries.
 * `count: 'exact'` is cheap here because the table is small and indexed on
 * (is_visible, display_order).
 */
export async function fetchGalleryPage(page: number, includeHidden = false): Promise<GalleryPage> {
  const from = page * GALLERY_PAGE_SIZE;
  const to = from + GALLERY_PAGE_SIZE - 1;

  let query = supabase
    .from('gallery')
    .select('*', { count: 'exact' })
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })
    .range(from, to);

  if (!includeHidden) query = query.eq('is_visible', true);

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return {
    images: (data ?? []) as GalleryImage[],
    hasMore: to + 1 < total,
    total,
  };
}

export async function countGalleryImages(): Promise<number> {
  const { count, error } = await supabase.from('gallery').select('id', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

async function nextDisplayOrder(): Promise<number> {
  const { data, error } = await supabase
    .from('gallery')
    .select('display_order')
    .order('display_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data?.display_order ?? -1) + 1;
}

export async function addGalleryImage(file: File, startOrder?: number): Promise<GalleryImage> {
  const uploaded = await uploadImage(file, 'gallery');
  const display_order = startOrder ?? (await nextDisplayOrder());

  const { data, error } = await supabase
    .from('gallery')
    .insert({
      image_url: uploaded.url,
      storage_path: uploaded.path,
      caption: null,
      display_order,
      is_visible: true,
      width: uploaded.width,
      height: uploaded.height,
    })
    .select()
    .single();

  if (error) {
    // Roll back the orphaned object so storage never drifts from the table.
    await removeImage(uploaded.path).catch(() => undefined);
    throw error;
  }
  return data as GalleryImage;
}

export async function updateGalleryImage(
  id: string,
  values: Pick<Partial<GalleryImage>, 'caption' | 'is_visible' | 'display_order'>,
): Promise<GalleryImage> {
  const { data, error } = await supabase.from('gallery').update(values).eq('id', id).select().single();
  if (error) throw error;
  return data as GalleryImage;
}

export async function deleteGalleryImage(image: GalleryImage): Promise<void> {
  const { error } = await supabase.from('gallery').delete().eq('id', image.id);
  if (error) throw error;
  await removeImage(image.storage_path).catch(() => undefined);
}

/**
 * Persists a whole ordering in one round trip. Upsert (rather than N updates)
 * avoids an N+1 write pattern when a long gallery is reshuffled.
 */
export async function persistGalleryOrder(images: GalleryImage[]): Promise<void> {
  if (images.length === 0) return;
  const payload = images.map((image, index) => ({ ...image, display_order: index }));
  const { error } = await supabase.from('gallery').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}
