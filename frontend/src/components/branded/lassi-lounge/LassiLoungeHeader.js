'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { navLinks } from './config';

import { useBrand } from '@/context/BrandContext';

/**
 * LassiLoungeHeader — sticky black nav bar used ONLY on the branded
 * homepage (see SiteChrome.js, which hides the shared platform Header
 * there and renders this instead). Cart count reads live from useCart()
 * so it always matches whatever the shared Header shows on other routes
 * like checkout/orders — no separate cart state.
 */
export default function LassiLoungeHeader() {
  const { items, openCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { brand, loading } = useBrand();
  const pathname = usePathname();

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-sticky bg-background border-b border-border">
      {/* Back to original px-6 py-3 — navbar height is exactly what it was before. */}
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 py-1">
          {brand?.logo ? (
            // Layout box stays h-9/h-10 (navbar height unaffected) —
            // scale() only affects paint, not layout, so the logo renders
            // ~25% bigger on screen without pushing anything else.
            <img
              src={brand.logo}
              alt={brand.name}
              className="h-10 md:h-10 w-auto scale-125 origin-left object-contain"
            />
          ) : loading ? (
            <div className="h-9 md:h-[50px] w-28 animate-pulse bg-white/10 rounded" />
          ) : (
            <>
              <span className="text-2xl font-bold text-primary-600" style={{ fontFamily: 'var(--font-script)' }}>
                Lassi
              </span>
              <span className="text-xs font-bold text-accent-500 tracking-widest -ml-1 self-end mb-1">LOUNGE</span>
            </>
          )}
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs font-semibold uppercase tracking-wide pb-1 border-b-2 transition-colors duration-base ${
                  isActive
                    ? 'text-accent-500 border-accent-500'
                    : 'text-text border-transparent hover:text-accent-500'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right icons (Visible on all screens) */}
        <div className="flex items-center gap-4">
          <a href={isAuthenticated ? "/profile?tab=dashboard" : "/login"} aria-label="Profile" className="text-text hover:text-accent-500">
            <User size={20} />
          </a>
          <button onClick={openCart} aria-label="Cart" className="relative text-text hover:text-accent-500 bg-transparent border-none p-0 cursor-pointer">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}