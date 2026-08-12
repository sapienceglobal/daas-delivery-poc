'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Utensils, Receipt, CalendarRange } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const tabs = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
    },
    {
      label: 'Menu',
      href: '/restaurant/lassi-lounge/menu',
      icon: Utensils,
    },
    {
      label: 'Order Online',
      href: '/restaurant/lassi-lounge?tab=menu',
      icon: Receipt,
    },
    {
      label: 'Book a Table',
      href: '/restaurant/lassi-lounge/book-a-table',
      icon: CalendarRange,
    },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full bg-background border-t border-border z-[90] pb-safe pt-2 px-2 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center">
        
        {tabs.map((tab) => {
          const Icon = tab.icon;
          // Exact match for Home, prefix match for others to keep active state when on sub-pages
          const isActive = tab.href === '/' 
            ? pathname === tab.href 
            : pathname.startsWith(tab.href);
            
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
    </div>
  );
}
