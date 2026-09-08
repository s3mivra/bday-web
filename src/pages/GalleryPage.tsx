import { GalleryGrid } from '@/components/gallery/GalleryGrid';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function GalleryPage() {
  const { event } = useSiteContent();
  useDocumentTitle(event ? `Gallery · ${event.celebrant_name}` : 'Gallery', {
    description: 'Photos from the celebrant.',
  });

  return (
    <section aria-labelledby="gallery-heading" className="py-16 sm:py-24">
      <div className="shell">
        <p className="eyebrow">Gallery</p>
        <h1 id="gallery-heading" className="mt-4 max-w-2xl font-display text-display-sm text-mist">
          Photos worth keeping
        </h1>
        <div className="mt-12">
          <GalleryGrid />
        </div>
      </div>
    </section>
  );
}
