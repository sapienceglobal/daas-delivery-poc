import React from 'react';
import MerchantTermsSection from '@/components/branded/lassi-lounge/sections/MerchantTermsSection';

export const metadata = {
  title: 'Merchant & Partner Terms of Service - Lassi Lounge NY',
  description: 'Operating guidelines, commercial standards, and service level terms for restaurant partners and merchant app users at Lassi Lounge.',
  alternates: {
    canonical: '/merchant-terms',
  },
};

export default function MerchantTermsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <main className="flex-1 pt-20 pb-16">
        <MerchantTermsSection />
      </main>
    </div>
  );
}
