import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyGallery, ErrorState } from '@/components/ui/States';
import { Lightbox } from '@/components/gallery/Lightbox';
import { toErrorMessage } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { GALLERY_PAGE_SIZE, fetchGalleryPage } from '@/services/gallery';
import type { GalleryImage } from '@/types';

/**
 * A repeating 6-tile rhythm gives the grid variety without a masonry library:
 * two tiles per cycle span two rows on wide screens.
 */
function tileClass(index: number): string {
  const position = index % 6;
  if (position === 0) return 'sm:row-span-2 aspect-[4/5] sm:aspect-[3/4]';
  if (position === 4) return 'lg:row-span-2 aspect-[4/5] lg:aspect-[3/4]';
  return 'aspect-[4/5] sm:aspect-square';
}

export function GalleryGrid() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppending, setIsAppending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const load = useCallback(async (nextPage: number, replace: boolean) => {
    if (replace) setIsLoading(true);
    else setIsAppending(true);
    setError(null);
    try {
      const result = await fetchGalleryPage(nextPage);
      setImages((current) => {
        if (replace) return result.images;
        const seen = new Set(current.map((image) => image.id));
        return [...current, ...result.images.filter((image) => !seen.has(image.id))];
      });
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch (cause) {
      setError(toErrorMessage(cause, 'The gallery could not be loaded.'));
    } finally {
      setIsLoading(false);
      setIsAppending(false);
    }
  }, []);

  useEffect(() => {
    void load(0, true);
  }, [load]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: GALLERY_PAGE_SIZE }).map((_, index) => (
          <Skeleton key={index} className="aspect-[4/5] w-full sm:aspect-square" />
        ))}
      </div>
    );
  }

  if (error && images.length === 0) {
    return <ErrorState title="The gallery did not load" message={error} onRetry={() => void load(0, true)} />;
  }

  if (images.length === 0) return <EmptyGallery />;

  return (
    <>
      <ul className="grid auto-rows-auto grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {images.map((image, index) => (
          <li key={image.id} className={cn('group', tileClass(index))}>
            <button
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="h-full w-full overflow-hidden rounded-xl border border-ink-line/50"
            >
              <img
                src={image.image_url}
                alt={image.caption ?? `Photo ${index + 1}`}
                width={image.width ?? 800}
                height={image.height ?? 1000}
                loading={index < 4 ? 'eager' : 'lazy'}
                decoding="async"
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 33vw, 50vw"
                className="h-full w-full object-cover transition-transform duration-500 ease-soft group-hover:scale-[1.04] motion-reduce:transform-none"
              />
              <span className="sr-only">Open photo {index + 1} in full screen</span>
            </button>
          </li>
        ))}
      </ul>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-rose-300">
          {error}
        </p>
      ) : null}

      {hasMore ? (
        <div className="mt-10 flex justify-center">
          <Button variant="outline" isLoading={isAppending} onClick={() => void load(page + 1, false)}>
            Show more photos
          </Button>
        </div>
      ) : null}

      {lightboxIndex !== null ? (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      ) : null}
    </>
  );
}
