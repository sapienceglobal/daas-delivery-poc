'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import LassiLoungeHeader from '@/components/branded/lassi-lounge/LassiLoungeHeader';
import LassiLoungeFooter from '@/components/branded/lassi-lounge/LassiLoungeFooter';
import CartSidebar from '@/components/ui/CartSidebar';
import MobileBottomNav from '@/components/shared/MobileBottomNav';

import WhatsAppWidget from '@/components/common/WhatsAppWidget';

const SINGLE_MODE = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const isAdminOrMerchant = pathname.startsWith('/admin') || pathname.startsWith('/merchant') || pathname.startsWith('/restaurant-panel');
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/reset-password') || pathname.startsWith('/forgot-password') || pathname.startsWith('/verify-otp');
  const isStandalonePage = pathname.startsWith('/payment-success');

  if (isAuthPage || isAdminOrMerchant || isStandalonePage) {
    return (
      <div className="flex flex-col min-h-screen">
        {children}
      </div>
    );
  }

  // industry Standard: Wrap everything in a flex-col with min-h-screen
  if (SINGLE_MODE && !isAdminOrMerchant) {
    return (
      <div className="flex flex-col min-h-screen pb-16 lg:pb-0 relative">
        <LassiLoungeHeader />
        <CartSidebar />
        <MobileBottomNav />
        {children}
        <LassiLoungeFooter />
        <WhatsAppWidget />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-16 lg:pb-0 relative">
      <Header />
      <CartSidebar />
      <MobileBottomNav />
      {children}
      <Footer />
      <WhatsAppWidget />
    </div>
  );
}