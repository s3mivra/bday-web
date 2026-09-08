import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/Spinner';

type Variant = 'primary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full font-body text-sm font-medium ' +
  'transition-[background-color,color,border-color,transform] duration-200 ease-soft ' +
  'disabled:pointer-events-none disabled:opacity-50 active:translate-y-px';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-champagne text-ink-contrast hover:bg-champagne-deep',
  outline: 'border border-champagne/45 text-champagne hover:border-champagne hover:bg-champagne/10',
  ghost: 'text-muted hover:text-mist',
  danger: 'border border-rose-400/50 text-rose-200 hover:bg-rose-500/15',
};

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3',
  lg: 'px-8 py-3.5 text-base',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra?: string): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], extra);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', isLoading = false, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={rest.type ?? 'button'}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {isLoading ? <Spinner className="h-4 w-4" /> : null}
      {children}
    </button>
  );
});

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  size?: Size;
}

export function ButtonLink({ variant = 'primary', size = 'md', className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

interface ExternalButtonLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  href: string;
}

export function ExternalButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ExternalButtonLinkProps) {
  return (
    <a target="_blank" rel="noopener noreferrer" className={buttonClass(variant, size, className)} {...rest} />
  );
}
