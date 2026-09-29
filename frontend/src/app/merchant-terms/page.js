import React from 'react';
import MerchantPublicHeader from '@/components/merchant-public/MerchantPublicHeader';
import MerchantPublicFooter from '@/components/merchant-public/MerchantPublicFooter';
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
    <div className="min-h-screen flex flex-col font-sans bg-[#faf9f8]">
      <MerchantPublicHeader />
      <main className="flex-1">
        <MerchantTermsSection />
      </main>
      <MerchantPublicFooter />
    </div>
  );
}
