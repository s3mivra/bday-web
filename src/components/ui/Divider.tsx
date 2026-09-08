/** Section separator: a hairline broken by a small diamond ornament. */
export function Divider() {
  return (
    <div aria-hidden="true" className="shell flex items-center gap-4 py-2">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-ink-line" />
      <span className="h-1.5 w-1.5 rotate-45 bg-champagne/60" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-ink-line" />
    </div>
  );
}
