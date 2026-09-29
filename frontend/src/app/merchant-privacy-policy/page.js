import React from 'react';
import MerchantPublicHeader from '@/components/merchant-public/MerchantPublicHeader';
import MerchantPublicFooter from '@/components/merchant-public/MerchantPublicFooter';
import MerchantPrivacyPolicySection from '@/components/branded/lassi-lounge/sections/MerchantPrivacyPolicySection';

export const metadata = {
  title: 'Merchant & Partner Privacy Policy - Lassi Lounge NY',
  description: 'Data protection, hardware permissions, and privacy guidelines for Lassi Lounge restaurant partners and mobile merchant app users.',
  alternates: {
    canonical: '/merchant-privacy-policy',
  },
};

export default function MerchantPrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#faf9f8]">
      <MerchantPublicHeader />
      <main className="flex-1">
        <MerchantPrivacyPolicySection />
      </main>
      <MerchantPublicFooter />
    </div>
  );
}
