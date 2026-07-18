'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBrand } from '@/context/BrandContext';

export function Footer() {
  const pathname = usePathname();
  const { isSingleRestaurantMode, brand } = useBrand();

  // In single restaurant mode, hide global footer on landing screens
  if (isSingleRestaurantMode && (pathname === '/' || pathname === '/customer')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-brand-border bg-brand-bg/40">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-sm font-bold text-brand-text mb-3">
              {isSingleRestaurantMode ? brand?.name : 'Restaurant Commerce'}
            </h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              Order food from your favorite local restaurants. Delivery by DoorDash Drive.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/customer" className="text-xs text-brand-muted hover:text-brand-cyan transition-colors">Browse Restaurants</Link></li>
              <li><Link href="/customer/orders" className="text-xs text-brand-muted hover:text-brand-cyan transition-colors">My Orders</Link></li>
              <li><Link href="/customer/profile" className="text-xs text-brand-muted hover:text-brand-cyan transition-colors">Profile</Link></li>
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">For Business</h4>
            <ul className="space-y-2">
              <li><Link href="/merchant" className="text-xs text-brand-muted hover:text-brand-cyan transition-colors">Merchant Dashboard</Link></li>
              <li><Link href="/login" className="text-xs text-brand-muted hover:text-brand-cyan transition-colors">Partner with Us</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3">Support</h4>
            <ul className="space-y-2">
              <li><span className="text-xs text-brand-muted">help@restaurant-platform.com</span></li>
              <li><span className="text-xs text-brand-muted">+1 (650) 555-0100</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-brand-muted">
            © {new Date().getFullYear()} Restaurant Commerce Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
            <span className="text-xs text-brand-muted">Powered by DoorDash Drive API</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
