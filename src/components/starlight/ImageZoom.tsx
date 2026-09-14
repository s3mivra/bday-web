import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
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
const DOUBLE_TAP_SCALE = 2.5;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** A point on the image (0..1 on each axis) that should stay under a screen position after zooming. */
interface Anchor {
  fx: number;
  fy: number;
  sx: number;
  sy: number;
}

/**
 * Full-screen image viewer built for phones first.
 *
 * Zooming resizes the image itself instead of CSS-scaling a small bitmap, so
 * text on the card stays sharp. Moving around uses the browser's own scrolling
 * (momentum and scroll bars), and pinch and double tap zoom toward the fingers
 * rather than the centre.
 */
export function ImageZoom({ src, alt, onClose, onSave, isSaving }: ImageZoomProps) {
  const [scale, setScale] = useState(1);
  const [fitWidth, setFitWidth] = useState(0);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const scaleRef = useRef(1);
  const anchorRef = useRef<Anchor | null>(null);
  const frameRef = useRef(0);

  /** Width that shows the whole image inside the stage. */
  const measureFit = useCallback(() => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img || !img.naturalWidth) return;
    const pad = 32;
    const ratio = Math.min((stage.clientWidth - pad) / img.naturalWidth, (stage.clientHeight - pad) / img.naturalHeight);
    setFitWidth(Math.max(1, Math.floor(img.naturalWidth * ratio)));
  }, []);

  /** Zoom so the image point under (clientX, clientY) stays under the finger or cursor. */
  const zoomAt = useCallback((next: number, clientX?: number, clientY?: number) => {
    const stage = stageRef.current;
    const img = imgRef.current;
    const value = clamp(next, MIN_SCALE, MAX_SCALE);
    if (!stage || !img || value === scaleRef.current) return;

    const stageRect = stage.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    const px = clientX ?? stageRect.left + stageRect.width / 2;
    const py = clientY ?? stageRect.top + stageRect.height / 2;
    anchorRef.current = {
      fx: clamp((px - imgRect.left) / imgRect.width, 0, 1),
      fy: clamp((py - imgRect.top) / imgRect.height, 0, 1),
      sx: px - stageRect.left,
      sy: py - stageRect.top,
    };
    scaleRef.current = value;
    setScale(value);
  }, []);

  // After the image is resized, scroll so the anchored point is back under the finger.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const img = imgRef.current;
    const anchor = anchorRef.current;
    if (!stage || !img || !anchor) return;
    anchorRef.current = null;
    stage.scrollLeft = img.offsetLeft + anchor.fx * img.offsetWidth - anchor.sx;
    stage.scrollTop = img.offsetTop + anchor.fy * img.offsetHeight - anchor.sy;
  }, [scale]);

  // Keyboard, resize, body scroll lock and focus handling.
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      const stage = stageRef.current;
      if (event.key === 'Escape') onClose();
      else if (event.key === '+' || event.key === '=') zoomAt(scaleRef.current + 0.5);
      else if (event.key === '-') zoomAt(scaleRef.current - 0.5);
      else if (stage && event.key.startsWith('Arrow')) {
        const step = 80;
        stage.scrollBy({
          left: event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
          top: event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0,
        });
      } else return;
      event.preventDefault();
    };

    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', measureFit);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', measureFit);
      document.body.style.overflow = overflow;
      previousFocus?.focus?.();
    };
  }, [onClose, zoomAt, measureFit]);

  // Touch gestures. Native listeners because pinch needs a non-passive touchmove
  // to stop the whole page from zooming; one-finger moves are left to native scrolling.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    let pinch: { distance: number; scale: number } | null = null;
    let lastTap = { time: 0, x: 0, y: 0 };
    let tapStart: { x: number; y: number } | null = null;

    const distance = (touches: TouchList) =>
      Math.hypot(touches[0]!.clientX - touches[1]!.clientX, touches[0]!.clientY - touches[1]!.clientY);

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        pinch = { distance: distance(event.touches) || 1, scale: scaleRef.current };
        tapStart = null;
      } else if (event.touches.length === 1) {
        tapStart = { x: event.touches[0]!.clientX, y: event.touches[0]!.clientY };
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && pinch) {
        event.preventDefault();
        const midX = (event.touches[0]!.clientX + event.touches[1]!.clientX) / 2;
        const midY = (event.touches[0]!.clientY + event.touches[1]!.clientY) / 2;
        const next = (pinch.scale * distance(event.touches)) / pinch.distance;
        cancelAnimationFrame(frameRef.current);
        frameRef.current = requestAnimationFrame(() => zoomAt(next, midX, midY));
        return;
      }
      if (tapStart && event.touches.length === 1) {
        const t = event.touches[0]!;
        if (Math.abs(t.clientX - tapStart.x) + Math.abs(t.clientY - tapStart.y) > 10) tapStart = null;
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinch = null;
      if (!tapStart || event.touches.length > 0) return;

      const touch = event.changedTouches[0]!;
      const now = Date.now();
      const isDoubleTap =
        now - lastTap.time < 320 && Math.abs(touch.clientX - lastTap.x) < 30 && Math.abs(touch.clientY - lastTap.y) < 30;

      if (isDoubleTap) {
        event.preventDefault(); // stop the browser's own double-tap zoom
        zoomAt(scaleRef.current > 1.05 ? 1 : DOUBLE_TAP_SCALE, touch.clientX, touch.clientY);
        lastTap = { time: 0, x: 0, y: 0 };
      } else {
        lastTap = { time: now, x: touch.clientX, y: touch.clientY };
      }
      tapStart = null;
    };

    // iOS Safari fires its own gesture events for pinch; block them so only the image zooms.
    const blockGesture = (event: Event) => event.preventDefault();

    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchmove', onTouchMove, { passive: false });
    stage.addEventListener('touchend', onTouchEnd, { passive: false });
    stage.addEventListener('gesturestart', blockGesture);
    stage.addEventListener('gesturechange', blockGesture);
    return () => {
      cancelAnimationFrame(frameRef.current);
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchmove', onTouchMove);
      stage.removeEventListener('touchend', onTouchEnd);
      stage.removeEventListener('gesturestart', blockGesture);
      stage.removeEventListener('gesturechange', blockGesture);
    };
  }, [zoomAt]);

  // Desktop: Ctrl + wheel or a trackpad pinch zooms at the cursor; plain wheel scrolls natively.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      zoomAt(scaleRef.current * (1 - event.deltaY * 0.01), event.clientX, event.clientY);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // Desktop: drag with the mouse to move around.
  const mouseDrag = useRef<{ x: number; y: number; left: number; top: number; moved: boolean } | null>(null);
  function onMouseDown(event: ReactMouseEvent<HTMLDivElement>) {
    const stage = stageRef.current;
    if (!stage || event.button !== 0 || scaleRef.current <= 1) return;
    event.preventDefault();
    mouseDrag.current = { x: event.clientX, y: event.clientY, left: stage.scrollLeft, top: stage.scrollTop, moved: false };
    const onMove = (move: MouseEvent) => {
      const drag = mouseDrag.current;
      if (!drag) return;
      drag.moved ||= Math.abs(move.clientX - drag.x) + Math.abs(move.clientY - drag.y) > 3;
      stage.scrollLeft = drag.left - (move.clientX - drag.x);
      stage.scrollTop = drag.top - (move.clientY - drag.y);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.setTimeout(() => (mouseDrag.current = null), 0);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const width = fitWidth ? Math.round(fitWidth * scale) : undefined;
  const closeIfBackdrop = (event: ReactMouseEvent<HTMLElement>) => {
    if (event.target === event.currentTarget && scaleRef.current === 1 && !mouseDrag.current?.moved) onClose();
  };

  return createPortal(
    <div className="sl-zoom" role="dialog" aria-modal="true" aria-label="Invitation image viewer">
      <div className="sl-zoom-bar">
        <span className="sl-zoom-level" aria-live="polite">
          {Math.round(scale * 100)}%
        </span>
        <button type="button" onClick={() => zoomAt(scale - 0.5)} disabled={scale <= MIN_SCALE} aria-label="Zoom out">
          <Minus className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => zoomAt(scale + 0.5)} disabled={scale >= MAX_SCALE} aria-label="Zoom in">
          <Plus className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => zoomAt(1)} disabled={scale === 1} aria-label="Fit to screen">
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
        onMouseDown={onMouseDown}
        onDoubleClick={(event) => zoomAt(scaleRef.current > 1.05 ? 1 : DOUBLE_TAP_SCALE, event.clientX, event.clientY)}
        onClick={closeIfBackdrop}
      >
        <div className="sl-zoom-canvas" onClick={closeIfBackdrop}>
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            draggable={false}
            decoding="async"
            onLoad={measureFit}
            style={{ width, visibility: fitWidth ? 'visible' : 'hidden' }}
          />
        </div>
      </div>

      <p className="sl-zoom-hint">
        {scale > 1 ? 'Drag to move around. Double tap to fit.' : 'Pinch or double tap where you want to zoom.'}
      </p>
    </div>,
    document.body,
  );
}
