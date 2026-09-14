import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { Download, Minus, Plus, RotateCcw, X } from 'lucide-react';

interface ImageZoomProps {
  src: string;
  alt: string;
  onClose: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Full-screen image viewer that stays on the site. Zoom with pinch, the mouse
 * wheel, double tap or the buttons; drag to pan while zoomed. Escape, the close
 * button or tapping the backdrop closes it.
 */
export function ImageZoom({ src, alt, onClose, onSave, isSaving }: ImageZoomProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const lastTap = useRef(0);
  const moved = useRef(false);

  const zoomTo = useCallback((next: number) => {
    const value = clamp(next, MIN_SCALE, MAX_SCALE);
    setScale(value);
    if (value === 1) setOffset({ x: 0, y: 0 });
  }, []);

  /** Relative zoom for the buttons and wheel; uses the latest scale so rapid taps all count. */
  const zoomBy = useCallback((delta: number) => {
    setScale((current) => {
      const value = clamp(current + delta, MIN_SCALE, MAX_SCALE);
      if (value === 1) setOffset({ x: 0, y: 0 });
      return value;
    });
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === '+' || event.key === '=') zoomBy(0.5);
      if (event.key === '-') zoomBy(-0.5);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previousFocus?.focus?.();
    };
  }, [onClose, zoomBy]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    moved.current = false;

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a!.x - b!.x, a!.y - b!.y), scale };
      drag.current = null;
    } else {
      drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      zoomTo((pinch.current.scale * distance) / pinch.current.distance);
      moved.current = true;
      return;
    }
    if (drag.current && scale > 1) {
      const dx = event.clientX - drag.current.x;
      const dy = event.clientY - drag.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
      setOffset({ x: drag.current.ox + dx, y: drag.current.oy + dy });
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) drag.current = null;

    // Double tap toggles between fit and 2.5x.
    if (!moved.current && event.pointerType !== 'mouse') {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        zoomTo(scale > 1 ? 1 : 2.5);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
  }

  return createPortal(
    <div
      className="sl-zoom"
      role="dialog"
      aria-modal="true"
      aria-label="Invitation image viewer"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="sl-zoom-bar">
        <span className="sl-zoom-level" aria-live="polite">
          {Math.round(scale * 100)}%
        </span>
        <button type="button" onClick={() => zoomBy(-0.5)} disabled={scale <= MIN_SCALE} aria-label="Zoom out">
          <Minus className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => zoomBy(0.5)} disabled={scale >= MAX_SCALE} aria-label="Zoom in">
          <Plus className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => zoomTo(1)} disabled={scale === 1} aria-label="Reset zoom">
          <RotateCcw className="h-5 w-5" />
        </button>
        {onSave ? (
          <button type="button" onClick={onSave} disabled={isSaving} aria-label="Save a copy">
            <Download className="h-5 w-5" />
          </button>
        ) : null}
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close viewer" className="close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className="sl-zoom-stage"
        data-zoomed={scale > 1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => zoomTo(scale > 1 ? 1 : 2.5)}
        onWheel={(event) => zoomBy(-event.deltaY * 0.002 * scale)}
        onClick={(event) => {
          if (event.target === event.currentTarget && scale === 1) onClose();
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        />
      </div>

      <p className="sl-zoom-hint">Pinch or double tap to zoom. Drag to move around.</p>
    </div>,
    document.body,
  );
}
