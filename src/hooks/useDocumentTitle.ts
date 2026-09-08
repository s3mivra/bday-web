import { useEffect } from 'react';

interface MetaOptions {
  description?: string | null;
  image?: string | null;
}

function setMeta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

/** Imperative head management; avoids pulling in a helmet dependency. */
export function useDocumentTitle(title: string, options: MetaOptions = {}): void {
  const { description, image } = options;

  useEffect(() => {
    document.title = title;
    setMeta('meta[property="og:title"]', 'property', 'og:title', title);
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title);

    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description);
      setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    }
    if (image) {
      setMeta('meta[property="og:image"]', 'property', 'og:image', image);
      setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image);
    }
    setMeta('meta[property="og:url"]', 'property', 'og:url', window.location.href);
  }, [title, description, image]);
}
