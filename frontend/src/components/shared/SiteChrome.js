'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import LassiLoungeHeader from '@/components/branded/lassi-lounge/LassiLoungeHeader';
import LassiLoungeFooter from '@/components/branded/lassi-lounge/LassiLoungeFooter';

const SINGLE_MODE = process.env.NEXT_PUBLIC_SINGLE_RESTAURANT_MODE === 'true';

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const isAdminOrMerchant = pathname.startsWith('/admin') || pathname.startsWith('/merchant');

  // Industry Standard: Wrap everything in a flex-col with min-h-screen
  if (SINGLE_MODE && !isAdminOrMerchant) {
    return (
      <div className="flex flex-col min-h-screen">
        <LassiLoungeHeader />
        {children}
        <LassiLoungeFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {children}
      <Footer />
    </div>
  );
}