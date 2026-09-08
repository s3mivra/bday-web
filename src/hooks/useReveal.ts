import { useEffect, useRef } from 'react';

/**
 * Reveals an element once it scrolls into view, then disconnects the observer
 * so scrolling stays cheap. Falls back to visible when the API is unavailable
 * or the visitor has asked for reduced motion.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(delayMs = 0) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      node.dataset.visible = 'true';
      return;
    }

    if (delayMs) node.style.transitionDelay = `${delayMs}ms`;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.dataset.visible = 'true';
            observer.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delayMs]);

  return ref;
}
