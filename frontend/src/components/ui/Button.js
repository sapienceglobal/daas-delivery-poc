import Link from 'next/link';

/**
 * Button — base atomic button/link used across the whole app (marketplace
 * mode + branded mode alike). Renders as a Next.js <Link> when `href` is
 * passed, otherwise as a native <button>.
 *
 * Variants set sensible token-based defaults; pass `className` to override
 * specific colors per usage (e.g. HeroSection uses the accent gold for its
 * primary CTA instead of this component's default primary-600 fill) —
 * className is appended last so it wins over the variant defaults below.
 */
export default function Button({
  children,
  href,
  variant = 'solid',
  type = 'button',
  className = '',
  onClick,
  disabled = false,
  ...rest
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold ' +
    'transition-colors duration-base ease-in-out disabled:opacity-50 disabled:pointer-events-none ' +
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2';

  const variants = {
    solid: 'bg-primary-600 text-white hover:bg-primary-700',
    outline: 'bg-transparent border-2 border-primary-600 text-primary-600 hover:bg-primary-50',
    ghost: 'bg-transparent text-primary-600 hover:bg-primary-50',
    // No default bg/text/border classes — use this when the caller needs
    // full control over color via `className` (avoids Tailwind class-order
    // specificity conflicts that can make a default variant color "win"
    // over an intended override).
    custom: '',
  };

  const classes = `${base} ${variants[variant] || variants.solid} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}