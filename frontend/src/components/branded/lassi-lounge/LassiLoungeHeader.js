'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { User, ShoppingCart, Store, Shield, Search } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { navLinks } from './config';
import { useBrand } from '@/context/BrandContext';

// internal component handling hooks and UI logic
function HeaderContent() {
  const { items, itemCount, openCart } = useCart();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { brand, loading } = useBrand();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const [logoError, setLogoError] = useState(false);

  const cartCount = itemCount ?? items.reduce((sum, item) => sum + (item.quantity || item.qty || 1), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 h-[64px] sm:h-[72px] flex items-center justify-between gap-3">
      {/* Brand Logo with Ambient Glow */}
      <Link href="/" className="relative z-10 flex items-center gap-2 shrink-0 py-1 group">
        {/* Soft luxury golden-red ambient glow behind logo on mobile */}
        <div className="lg:hidden absolute -inset-2 rounded-full bg-[#FFC107]/12 blur-md pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity" />

        {brand?.logo && !logoError ? (
          <img
            src={brand.logo}
            alt={brand.name || 'Lassi Lounge'}
            className="relative h-[48px] sm:h-[58px] w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] group-hover:scale-[1.03] transition-transform duration-300"
            onError={() => setLogoError(true)}
          />
        ) : loading ? (
          <div className="h-9 md:h-[50px] w-28 animate-pulse bg-white/20 rounded-xl" />
        ) : (
          <div className="relative flex items-center">
            <span
              className="text-2xl sm:text-3xl font-bold text-white lg:text-primary-600 drop-shadow-sm"
              style={{ fontFamily: 'var(--font-script)' }}
            >
              Lassi
            </span>
            <span className="text-[11px] font-black text-[#FFC107] lg:text-accent-500 tracking-[0.22em] -ml-1 self-end mb-1 drop-shadow-sm">
              LOUNGE
            </span>
          </div>
        )}
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex items-center gap-6">
        {navLinks.map((link) => {
          let isActive = false;
          if (link.href.includes('?mode=')) {
            const [base, query] = link.href.split('?mode=');
            isActive = pathname === base && mode === query;
          } else {
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

      {/* Right Action Pods (Mobile & Desktop Luxury Styling) */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Quick Search Button */}
        {pathname !== '/search' && (
          <Link
            href="/search"
            aria-label="Search dishes"
            className="lg:hidden group relative flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/18 active:scale-95 border border-white/15 text-white/90 hover:text-[#FFC107] transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.22)]"
            title="Search dishes"
          >
            <Search size={18} strokeWidth={2.3} className="group-hover:scale-110 transition-transform" />
          </Link>
        )}

        {/* User Account / Profile */}
        {authLoading ? (
          <div className="w-10 h-10 rounded-full bg-white/15 animate-pulse" />
        ) : isAuthenticated && user ? (
          <>
            {/* Merchant / Admin Switcher Badge */}
            {(user.role === 'merchant' || user.role === 'admin') && (
              <Link
                href={user.role === 'admin' ? '/admin' : '/merchant'}
                className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#f59e0b] via-[#ea580c] to-[#c61f26] text-white hover:from-[#fbbf24] hover:via-[#f97316] hover:to-[#dc2626] transition-all duration-300 text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-[0_2px_12px_rgba(245,158,11,0.4)] border border-amber-300/40 shrink-0 hover:scale-105 active:scale-95"
                title={user.role === 'admin' ? 'Switch to Admin Panel' : 'Switch to Merchant Dashboard'}
              >
                <span className="p-0.5 rounded-full bg-black/25 flex items-center justify-center text-white group-hover:rotate-12 transition-transform">
                  {user.role === 'admin' ? <Shield size={12} className="text-white" /> : <Store size={12} className="text-white" />}
                </span>
                <span className="inline-block font-extrabold tracking-wide drop-shadow-xs">
                  {user.role === 'admin' ? 'Admin' : 'Dashboard'}
                </span>
              </Link>
            )}

            {/* Profile Avatar Pod */}
            <Link
              href="/profile?tab=dashboard"
              aria-label="Profile"
              className="group relative flex items-center gap-2 p-1 sm:pr-3 rounded-full bg-white/10 hover:bg-white/18 active:scale-95 border border-white/15 lg:bg-transparent lg:border-none lg:p-0 text-white/95 lg:text-text transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.22)] lg:shadow-none"
            >
              <div className="w-[34px] h-[34px] sm:w-[36px] sm:h-[36px] rounded-full bg-gradient-to-tr from-[#FFC107] via-[#FFA000] to-[#F59E0B] lg:bg-primary-600 text-[#4A070B] lg:text-white flex items-center justify-center text-xs font-black uppercase ring-2 ring-white/25 shadow-xs group-hover:scale-105 transition-transform">
                {user.name ? user.name.charAt(0) : <User size={15} strokeWidth={2.4} />}
              </div>
              <span className="hidden sm:inline-block text-xs font-bold tracking-wide text-white lg:text-text group-hover:text-[#FFC107] lg:hover:text-accent-500 transition-colors">
                {user.name?.split(' ')[0] || 'Profile'}
              </span>
            </Link>
          </>
        ) : (
          <Link
            href="/login"
            className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/18 active:scale-95 border border-white/15 lg:bg-transparent lg:border-none lg:p-0 text-white/95 lg:text-text hover:text-[#FFC107] lg:hover:text-accent-500 transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.22)] lg:shadow-none"
          >
            <div className="w-5 h-5 rounded-full bg-white/10 lg:bg-transparent flex items-center justify-center">
              <User size={14} strokeWidth={2.5} className="text-[#FFC107] lg:text-current group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[11px] font-bold tracking-wider uppercase">Log In</span>
          </Link>
        )}

        {/* Shopping Cart Pod */}
        <button
          onClick={openCart}
          aria-label="Shopping Cart"
          className="group relative flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-white/10 hover:bg-white/18 active:scale-95 border border-white/15 lg:bg-transparent lg:border-none lg:hover:bg-white/10 text-white/95 hover:text-[#FFC107] transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.22)] lg:shadow-none cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <ShoppingCart size={22} strokeWidth={2.2} className="text-white/95 group-hover:text-[#FFC107] group-hover:scale-105 transition-transform" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2.5 min-w-[17px] h-[17px] px-1 rounded-full bg-gradient-to-r from-[#FFC107] via-[#FFA000] to-[#F59E0B] text-[#4A070B] text-[9.5px] font-black flex items-center justify-center shadow-[0_2px_8px_rgba(255,193,7,0.55)] ring-[1.5px] ring-[#2A060A] font-sans leading-none animate-in zoom-in-75 duration-200 pointer-events-none">
                {cartCount}
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}

// main exported component wrapping the header content in Suspense
export default function LassiLoungeHeader() {
  return (
    <header className="sticky top-0 z-[100] bg-gradient-to-r from-[#4A070B] via-[#680D13] to-[#42060A] lg:from-transparent lg:via-transparent lg:to-transparent lg:bg-background border-b border-[#FFC107]/20 lg:border-border shadow-[0_4px_24px_rgba(0,0,0,0.32)] lg:shadow-none transition-all duration-300">
      {/* Top subtle ambient rim-light on mobile */}
      <div className="lg:hidden absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      {/* Bottom glowing luxury golden hairline on mobile */}
      <div className="lg:hidden absolute inset-x-0 bottom-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#FFC107]/50 via-50% to-transparent pointer-events-none" />

      {/* Suspense wrapper for Next.js safe SSR */}
      <Suspense fallback={<div className="h-[64px] sm:h-[72px] w-full" />}>
        <HeaderContent />
      </Suspense>
    </header>
  );
}
