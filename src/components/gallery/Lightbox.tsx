import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryImage } from '@/types';

interface LightboxProps {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const SWIPE_THRESHOLD = 48;
const FOCUSABLE = 'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function Lightbox({ images, index, onClose, onNavigate }: LightboxProps) {
  const restoreRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const total = images.length;
  const current = images[index];

  const go = useCallback(
    (delta: number) => {
      if (total === 0) return;
      onNavigate((index + delta + total) % total);
    },
    [index, total, onNavigate],
  );

  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          return;
        case 'ArrowRight':
          event.preventDefault();
          go(1);
          return;
        case 'ArrowLeft':
          event.preventDefault();
          go(-1);
          return;
        case 'Tab':
          break;
        default:
          return;
      }

      // Without this, Tab walks straight out of the overlay into the page
      // behind it while the dialog is still covering the screen.
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (item) => item.offsetParent !== null,
      );
      if (items.length === 0) return;

      const first = items[0] as HTMLElement;
      const last = items[items.length - 1] as HTMLElement;
      const active = document.activeElement;

      if (!panel.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      restoreRef.current?.focus();
    };
  }, [go, onClose]);

  if (!current) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photo ${index + 1} of ${total}`}
      ref={panelRef}
      className="fixed inset-0 z-[75] flex flex-col bg-ink/97 backdrop-blur"
      onTouchStart={(event) => {
        const touch = event.touches[0];
        if (touch) touchStart.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const touch = event.changedTouches[0];
        touchStart.current = null;
        if (!start || !touch) return;
        const dx = touch.clientX - start.x;
        const dy = touch.clientY - start.y;
        if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <p className="text-sm tabular-nums text-muted">
          {index + 1} / {total}
        </p>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink-line text-mist transition-colors hover:border-champagne/60 hover:text-champagne"
        >
          <X aria-hidden="true" className="h-5 w-5" />
          <span className="sr-only">Close photo viewer</span>
        </button>
      </div>

      <div className="flex flex-1 items-center justify-center px-2 pb-2 sm:px-6">
        <img
          key={current.id}
          src={current.image_url}
          alt={current.caption ?? `Photo ${index + 1}`}
          className="max-h-full max-w-full animate-fade rounded-lg object-contain"
        />
      </div>

      <div className="flex items-center justify-between gap-4 px-4 pb-6 sm:px-6">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={total < 2}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-line text-mist transition-colors hover:border-champagne/60 hover:text-champagne disabled:opacity-30"
        >
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          <span className="sr-only">Previous photo</span>
        </button>

        <p className="flex-1 text-center text-sm text-muted">{current.caption ?? ''}</p>

        <button
          type="button"
          onClick={() => go(1)}
          disabled={total < 2}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-ink-line text-mist transition-colors hover:border-champagne/60 hover:text-champagne disabled:opacity-30"
        >
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
          <span className="sr-only">Next photo</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}
