'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, UtensilsCrossed, ShoppingBag, Calendar } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// 1. Ek naya component banaya jo hooks use karega
function NavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const { isAuthenticated } = useAuth();

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
      href: '/menu?mode=delivery',
    },
    {
      id: 'reserve',
      label: 'Reserve',
      icon: Calendar,
      href: '/book-a-table',
    },
  ];

  return (
    <div className="flex justify-around items-center">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        let isActive = false;
        
        if (tab.href.includes('?mode=')) {
          const [base, query] = tab.href.split('?mode=');
          isActive = pathname === base && mode === query;
        } else {
          // Special case: If we are on /menu but mode=delivery, the plain /menu link should NOT be active
          if (pathname === '/menu' && tab.href === '/menu' && mode === 'delivery') {
            isActive = false;
          } else {
            isActive = tab.href === '/' ? pathname === tab.href : pathname.startsWith(tab.href);
          }
        }

        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center justify-center w-16 h-12 transition-colors ${
              isActive ? 'text-primary-600' : 'text-text hover:text-accent-500'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="mb-1" />
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

// 2. Main component mein usko Suspense ke andar wrap kar diya
export default function MobileBottomNav() {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full bg-background border-t border-border z-[90] pb-safe pt-2 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <Suspense fallback={<div className="h-12 w-full"></div>}>
        <NavContent />
      </Suspense>
    </div>
  );
}