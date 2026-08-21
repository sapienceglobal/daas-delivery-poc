'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { User, ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { navLinks } from './config';
import { useBrand } from '@/context/BrandContext';

// Internal component handling hooks and UI logic
function HeaderContent() {
  const { items, openCart } = useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { brand, loading } = useBrand();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mx-auto max-w-7xl px-6 py-[5px] flex items-center justify-between">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0 py-1">
        {brand?.logo ? (
          <img
            src={brand.logo}
            alt={brand.name}
            className="h-[64px] md:h-[64px] w-auto scale-125 origin-left object-contain"
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
          let isActive = false;
          if (link.href.includes('?mode=')) {
            const [base, query] = link.href.split('?mode=');
            isActive = pathname === base && mode === query;
          } else {
            // Special case: If we are on /menu but mode=delivery, the plain /menu link should NOT be active
            if (pathname === '/menu' && link.href === '/menu' && mode === 'delivery') {
              isActive = false;
            } else {
              isActive = pathname === link.href;
            }
          }
          return (
            <Link
              key={link.label}
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
        {authLoading ? (
          <div className="flex items-center gap-2 animate-pulse">
            <div className="rounded-full bg-white/10 shrink-0" style={{ width: '32px', height: '32px' }}></div>
            <div className="hidden sm:block w-16 h-4 bg-white/10 rounded"></div>
          </div>
        ) : isAuthenticated && user ? (
          <a href="/profile?tab=dashboard" aria-label="Profile" className="flex items-center gap-2 text-text hover:text-accent-500 transition-colors">
            <div 
              className="rounded-full bg-primary-600 text-white flex items-center justify-center text-[12px] font-bold uppercase shadow-sm shrink-0"
              style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }}
            >
              {user.name ? user.name.charAt(0) : <User size={14} />}
            </div>
            <span className="hidden sm:inline-block text-[12px] font-bold tracking-wider">{user.name?.split(' ')[0] || 'Profile'}</span>
          </a>
        ) : (
          <a href="/login" className="flex items-center gap-1.5 text-text hover:text-accent-500 text-[11px] font-bold uppercase tracking-wider transition-colors">
            <User size={18} />
            <span className="hidden sm:inline-block mt-0.5">Log In</span>
          </a>
        )}
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
  );
}

// Main exported component wrapping the header content in Suspense
export default function LassiLoungeHeader() {
  return (
    <header className="sticky top-0 z-sticky bg-background border-b border-border">
      {/* Suspense add kiya gaya hai taaki Next.js build ke dauran fail na ho */}
      <Suspense fallback={<div className="h-[74px] w-full" />}>
        <HeaderContent />
      </Suspense>
    </header>
  );
}