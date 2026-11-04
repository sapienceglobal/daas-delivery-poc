'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, UtensilsCrossed, ShoppingBag, Calendar } from 'lucide-react';

function NavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  const tabs = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      href: '/',
    },
    {
      id: 'menu',
      label: 'Menu',
      icon: UtensilsCrossed,
      href: '/menu',
    },
    {
      id: 'order',
      label: 'Order',
      icon: ShoppingBag,
      href: '/order-online',
    },
    {
      id: 'reserve',
      label: 'Reserve',
      icon: Calendar,
      href: '/book-a-table',
    },
  ];

  return (
    <div className="flex justify-around items-center px-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        let isActive = false;

        if (tab.id === 'home') {
          isActive = pathname === '/';
        } else if (tab.id === 'menu') {
          isActive = pathname === '/menu' || (pathname.startsWith('/menu') && mode !== 'delivery');
        } else if (tab.id === 'order') {
          isActive = pathname === '/order-online' || pathname.startsWith('/order-online') || (pathname === '/menu' && mode === 'delivery');
        } else if (tab.id === 'reserve') {
          isActive = pathname?.startsWith('/book-a-table') || pathname?.startsWith('/book-table');
        } else {
          isActive = pathname === tab.href || pathname.startsWith(tab.href);
        }

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`group relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 transition-all duration-200 active:scale-95 ${
              isActive ? 'text-[#FFC107]' : 'text-white/70 hover:text-white'
            }`}
          >
            {/* Active Pill Highlight matching Lassi Lounge Customer App */}
            <div
              className={`relative flex items-center justify-center transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 px-3.5 py-1 rounded-full shadow-[0_2px_10px_rgba(255,193,7,0.2)]'
                  : 'p-1'
              }`}
            >
              <Icon
                size={21}
                strokeWidth={isActive ? 2.6 : 2}
                className={`transition-transform duration-200 ${
                  isActive ? 'scale-105 text-[#FFC107]' : 'text-white/70 group-hover:text-white'
                }`}
              />
            </div>

            <span
              className={`text-[11px] sm:text-xs mt-0.5 tracking-wide transition-colors leading-tight ${
                isActive ? 'font-bold text-[#FFC107]' : 'font-medium text-white/70 group-hover:text-white'
              }`}
            >
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on checkout page so checkout bottom floating actions are never obstructed
  if (pathname === '/checkout' || pathname?.startsWith('/checkout')) return null;

  return (
    <nav
      aria-label="Mobile Navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] bg-[#680D13] rounded-t-[22px] sm:rounded-t-[24px] border-t border-[#8B141C]/60 shadow-[0_-6px_24px_rgba(0,0,0,0.35)] pt-2"
      style={{
        backgroundColor: '#680D13',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
      }}
    >
      <Suspense fallback={<div className="h-14 w-full" />}>
        <NavContent />
      </Suspense>
    </nav>
  );
}
