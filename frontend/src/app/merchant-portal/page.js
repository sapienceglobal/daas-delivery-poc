import React from 'react';
import MerchantPortalSection from '@/components/branded/lassi-lounge/sections/MerchantPortalSection';

export const metadata = {
  title: 'Merchant & Restaurant Operations Hub - Lassi Lounge NY',
  description: 'Official portal and Android application overview for Lassi Lounge restaurant managers, chefs, and partner dispatchers.',
  alternates: {
    canonical: '/merchant-portal',
  },
};

export default function MerchantPortalPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <main className="flex-1">
        <MerchantPortalSection />
      </main>
    </div>
  );
}
