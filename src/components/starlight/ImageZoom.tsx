import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from 'react';
import { createPortal } from 'react-dom';
import { Download, Minus, Plus, RotateCcw, X } from 'lucide-react';

interface ImageZoomProps {
  src: string;
  alt: string;
  onClose: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

interface Offset {
  x: number;
  y: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Full-screen image viewer that stays on the site.
 * - Zoom: pinch, Ctrl + scroll (or a trackpad pinch), double tap, or the buttons.
 * - Move around while zoomed: drag, scroll or swipe, or the arrow keys.
 * Panning is limited to the image edges, so every corner is reachable and the
 * image never slides out of view. Escape, the close button or the backdrop closes it.
 */
export function ImageZoom({ src, alt, onClose, onSave, isSaving }: ImageZoomProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const scaleRef = useRef(1);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const lastTap = useRef(0);
  const moved = useRef(false);

  /** Keeps the scaled image covering the stage where it is larger, and centred where it is smaller. */
  const clampOffset = useCallback((next: Offset, atScale: number): Offset => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img) return next;
    const maxX = Math.max(0, (img.offsetWidth * atScale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (img.offsetHeight * atScale - stage.clientHeight) / 2);
    return { x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  }, []);

  const applyScale = useCallback(
    (next: number) => {
      const value = clamp(next, MIN_SCALE, MAX_SCALE);
      // Scale the offset with the zoom so the part being looked at stays in place.
      const ratio = value / scaleRef.current;
      scaleRef.current = value;
      setScale(value);
      setOffset((current) => clampOffset({ x: current.x * ratio, y: current.y * ratio }, value));
    },
    [clampOffset],
  );

  const zoomBy = useCallback((delta: number) => applyScale(scaleRef.current + delta), [applyScale]);

  const panBy = useCallback(
    (dx: number, dy: number) => {
      setOffset((current) => clampOffset({ x: current.x + dx, y: current.y + dy }, scaleRef.current));
    },
    [clampOffset],
  );

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      const step = 60;
      if (event.key === 'Escape') onClose();
      else if (event.key === '+' || event.key === '=') zoomBy(0.5);
      else if (event.key === '-') zoomBy(-0.5);
      else if (event.key === 'ArrowUp') panBy(0, step);
      else if (event.key === 'ArrowDown') panBy(0, -step);
      else if (event.key === 'ArrowLeft') panBy(step, 0);
      else if (event.key === 'ArrowRight') panBy(-step, 0);
      else return;
      event.preventDefault();
    };
    const onResize = () => setOffset((current) => clampOffset(current, scaleRef.current));

    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = overflow;
      previousFocus?.focus?.();
    };
  }, [onClose, zoomBy, panBy, clampOffset]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button')) return;
    try {
      // Keeps receiving moves when the finger leaves the image; some browsers throw for synthetic pointers.
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* capture is an enhancement only */
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    moved.current = false;

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a!.x - b!.x, a!.y - b!.y) || 1, scale: scaleRef.current };
      drag.current = null;
    } else {
      drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
      setIsDragging(true);
    }
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      applyScale((pinch.current.scale * distance) / pinch.current.distance);
      moved.current = true;
      return;
    }

    if (drag.current) {
      const dx = event.clientX - drag.current.x;
      const dy = event.clientY - drag.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved.current = true;
      if (scaleRef.current > 1) {
        setOffset(clampOffset({ x: drag.current.ox + dx, y: drag.current.oy + dy }, scaleRef.current));
      }
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 1) {
      // One finger lifted after a pinch: continue as a drag from the remaining finger.
      const [rest] = [...pointers.current.values()];
      drag.current = { x: rest!.x, y: rest!.y, ox: offset.x, oy: offset.y };
    }
    if (pointers.current.size === 0) {
      drag.current = null;
      setIsDragging(false);
    }

    // Double tap toggles between fit and 2.5x (mouse users get onDoubleClick).
    if (!moved.current && event.pointerType !== 'mouse') {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        applyScale(scaleRef.current > 1 ? 1 : 2.5);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
  }

  /** Scroll (or a two-finger trackpad swipe) moves around; Ctrl + scroll or a trackpad pinch zooms. */
  function onWheel(event: ReactWheelEvent<HTMLDivElement>) {
    if (event.ctrlKey || event.metaKey) {
      applyScale(scaleRef.current * (1 - event.deltaY * 0.01));
      return;
    }
    if (scaleRef.current > 1) {
      panBy(-event.deltaX, -event.deltaY);
    } else if (event.deltaY < 0) {
      // At normal size there is nothing to scroll, so scrolling up zooms in to get started.
      applyScale(1.5);
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
        <button type="button" onClick={() => applyScale(1)} disabled={scale === 1} aria-label="Reset zoom">
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
        ref={stageRef}
        className="sl-zoom-stage"
        data-zoomed={scale > 1}
        data-dragging={isDragging}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={() => applyScale(scaleRef.current > 1 ? 1 : 2.5)}
        onWheel={onWheel}
        onClick={(event) => {
          if (event.target === event.currentTarget && scale === 1 && !moved.current) onClose();
        }}
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})` }}
        />
      </div>

      <p className="sl-zoom-hint">
        {scale > 1 ? 'Drag or scroll to move around. Double tap to fit.' : 'Pinch, double tap or press + to zoom in.'}
      </p>
    </div>,
    document.body,
  );
}
