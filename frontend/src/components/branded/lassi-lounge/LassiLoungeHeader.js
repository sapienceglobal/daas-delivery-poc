'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { navLinks } from './config';

/**
 * LassiLoungeHeader — sticky black nav bar used ONLY on the branded
 * homepage (see SiteChrome.js, which hides the shared platform Header
 * there and renders this instead). Cart count reads live from useCart()
 * so it always matches whatever the shared Header shows on other routes
 * like checkout/orders — no separate cart state.
 */
export default function LassiLoungeHeader() {
  const { items } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-sticky bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/customer" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl font-bold text-primary-600" style={{ fontFamily: 'var(--font-script)' }}>
            Lassi
          </span>
          <span className="text-xs font-bold text-accent-500 tracking-widest -ml-1 self-end mb-1">LOUNGE</span>
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

        {/* Right icons */}
        <div className="flex items-center gap-4">
          <Link href="/customer/profile" aria-label="Profile" className="text-text hover:text-accent-500">
            <User size={20} />
          </Link>
          <Link href="/customer/checkout" aria-label="Cart" className="relative text-text hover:text-accent-500">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="lg:hidden text-text"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="lg:hidden flex flex-col gap-3 px-6 pb-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-semibold text-text hover:text-accent-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}