'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Home,
  UtensilsCrossed,
  ShoppingBag,
  CalendarDays,
  Phone,
  ArrowLeft,
  RotateCw,
} from 'lucide-react';

/**
 * ErrorView — branded, customer-facing status page used by:
 *   app/not-found.js  (404)
 *   app/error.js      (500 / unexpected runtime errors)
 *
 * Industry Standard "Zero-Scroll Viewport" design:
 *   - Preserves site Header & Footer for brand trust and SEO navigation.
 *   - Centers error hero perfectly in the viewport without pushing actions below the fold.
 *   - Balanced illustration, typography, primary CTA buttons, and quick navigation pills.
 */

const PRESETS = {
  404: {
    eyebrow: 'Oops! This plate is empty',
    title: 'Page Not Found',
    message:
      "The page you're looking for may have been moved, renamed, or is no longer on the menu. Let's get you back to something delicious.",
  },
  403: {
    eyebrow: 'Kitchen staff only',
    title: 'Access Denied',
    message: "You don't have permission to view this page. Please sign in with the right account or head back home.",
  },
  500: {
    eyebrow: 'Something spilled in the kitchen',
    title: 'Something Went Wrong',
    message:
      "We hit an unexpected problem while preparing this page. Our team has been notified — please try again in a moment.",
  },
  503: {
    eyebrow: 'Back in a few minutes',
    title: 'Under Maintenance',
    message: "We're giving our kitchen a quick polish. Please check back shortly — your favourites will be waiting.",
  },
};

const QUICK_LINKS = [
  { href: '/menu', label: 'Our Menu', icon: UtensilsCrossed },
  { href: '/order-online', label: 'Order Online', icon: ShoppingBag },
  { href: '/book-a-table', label: 'Book a Table', icon: CalendarDays },
  { href: '/contact-us', label: 'Contact Us', icon: Phone },
];

/** Steaming lassi glass illustration (compact SVG). */
function LassiIllustration() {
  return (
    <div className="relative mx-auto h-24 w-24 sm:h-28 sm:w-28 ll-float" style={{ animation: 'llFloat 5s ease-in-out infinite' }}>
      {/* steam */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="ll-steam absolute top-0 h-6 w-1.5 rounded-full bg-[#7a0b10]/25 blur-[1.5px]"
          style={{
            left: `${42 + i * 9}%`,
            animation: `llSteam 2.6s ease-out ${i * 0.55}s infinite`,
          }}
        />
      ))}
      <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-[0_12px_24px_rgba(122,11,16,0.18)]" aria-hidden="true">
        <defs>
          <linearGradient id="lassiFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde7b0" />
            <stop offset="100%" stopColor="#f5b84a" />
          </linearGradient>
        </defs>
        {/* glass */}
        <path d="M32 30 h56 l-7 70 a8 8 0 0 1 -8 7 h-26 a8 8 0 0 1 -8 -7 z" fill="#ffffff" stroke="#7a0b10" strokeWidth="3" />
        {/* lassi */}
        <path d="M36 52 h48 l-4.6 47 a5 5 0 0 1 -5 4.5 h-28.8 a5 5 0 0 1 -5 -4.5 z" fill="url(#lassiFill)" />
        {/* foam */}
        <path d="M36 52 q6 -6 12 0 t12 0 t12 0 t12 0" fill="none" stroke="#fffaf0" strokeWidth="4" strokeLinecap="round" />
        {/* straw */}
        <path d="M70 14 l-8 52" stroke="#7a0b10" strokeWidth="5" strokeLinecap="round" />
        {/* mint leaf */}
        <path d="M46 44 q-10 -10 2 -16 q6 8 -2 16z" fill="#4c9a5a" />
      </svg>
    </div>
  );
}

export default function ErrorView({
  code = 404,
  eyebrow,
  title,
  message,
  onRetry,
  digest,
}) {
  const router = useRouter();
  const preset = PRESETS[code] || PRESETS[500];

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  };

  return (
    <section className="relative flex flex-col justify-center items-center min-h-[calc(100vh-80px)] overflow-hidden bg-[#faf9f8] px-4 py-8 sm:py-12">
      {/* decorative ambient glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#7a0b10]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#f5b84a]/15 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        {/* Illustration */}
        <div style={{ animation: 'llPop 0.5s cubic-bezier(0.22,1,0.36,1) both' }}>
          <LassiIllustration />
        </div>

        {/* Status code */}
        <p
          className="mt-2 sm:mt-3 select-none bg-gradient-to-b from-[#7a0b10] to-[#c2410c] bg-clip-text text-6xl sm:text-7xl font-black leading-none tracking-tight text-transparent"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", animation: 'llFadeLift 0.55s 0.05s cubic-bezier(0.22,1,0.36,1) both' }}
          aria-hidden="true"
        >
          {code}
        </p>

        {/* Content heading & description */}
        <div style={{ animation: 'llFadeLift 0.55s 0.12s cubic-bezier(0.22,1,0.36,1) both' }}>
          <p className="mt-2 text-sm sm:text-base italic text-[#7a0b10] font-medium" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {eyebrow || preset.eyebrow}
          </p>
          <h1
            className="mt-1.5 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#1a1a1a]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {title || preset.title}
          </h1>
          <p className="mx-auto mt-2.5 max-w-lg text-sm sm:text-base leading-relaxed text-[#4b5563]">
            {message || preset.message}
          </p>
        </div>

        {/* Primary action buttons */}
        <div
          className="mt-6 sm:mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          style={{ animation: 'llFadeLift 0.55s 0.2s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          {onRetry ? (
            <button
              type="button"
              id="error-retry-button"
              onClick={onRetry}
              className="group inline-flex h-11 sm:h-12 w-full sm:w-auto min-w-[165px] items-center justify-center gap-2 rounded-full bg-[#7a0b10] px-7 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(122,11,16,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5e080c] hover:shadow-[0_12px_24px_rgba(122,11,16,0.30)] active:translate-y-0 whitespace-nowrap"
            >
              <RotateCw className="h-4 w-4 shrink-0 transition-transform duration-500 group-hover:rotate-180" />
              <span>Try Again</span>
            </button>
          ) : (
            <Link
              href="/"
              id="error-home-button"
              className="inline-flex h-11 sm:h-12 w-full sm:w-auto min-w-[165px] items-center justify-center gap-2 rounded-full bg-[#7a0b10] px-7 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(122,11,16,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#5e080c] hover:shadow-[0_12px_24px_rgba(122,11,16,0.30)] active:translate-y-0 whitespace-nowrap"
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>Back to Home</span>
            </Link>
          )}

          {onRetry ? (
            <Link
              href="/"
              id="error-home-secondary-button"
              className="inline-flex h-11 sm:h-12 w-full sm:w-auto min-w-[165px] items-center justify-center gap-2 rounded-full border-2 border-[#7a0b10] bg-white px-7 text-sm font-semibold text-[#7a0b10] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#7a0b10]/5 hover:shadow-md active:translate-y-0 whitespace-nowrap"
            >
              <Home className="h-4 w-4 shrink-0" />
              <span>Back to Home</span>
            </Link>
          ) : (
            <button
              type="button"
              id="error-back-button"
              onClick={handleBack}
              className="inline-flex h-11 sm:h-12 w-full sm:w-auto min-w-[165px] items-center justify-center gap-2 rounded-full border-2 border-[#7a0b10] bg-white px-7 text-sm font-semibold text-[#7a0b10] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#7a0b10]/5 hover:shadow-md active:translate-y-0 whitespace-nowrap"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span>Go Back</span>
            </button>
          )}
        </div>

        {/* Quick links pill strip */}
        <div
          className="mt-7 sm:mt-9 max-w-xl mx-auto w-full pt-4 border-t border-[#7a0b10]/10"
          style={{ animation: 'llFadeLift 0.55s 0.28s cubic-bezier(0.22,1,0.36,1) both' }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#9ca3af] mb-3">
            Or explore these pages
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {QUICK_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group inline-flex items-center gap-2 rounded-full border border-[#f1e7e7] bg-white/90 px-4 py-2 text-xs sm:text-sm font-semibold text-[#374151] shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-[#7a0b10]/40 hover:bg-[#7a0b10] hover:text-white hover:shadow-md"
              >
                <Icon className="h-3.5 w-3.5 text-[#7a0b10] transition-colors duration-200 group-hover:text-white" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {digest && (
          <p className="mt-4 text-[11px] text-[#9ca3af]">
            Reference ID: <span className="font-mono">{digest}</span>
          </p>
        )}
      </div>
    </section>
  );
}
