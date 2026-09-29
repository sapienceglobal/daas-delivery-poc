import React from 'react';
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
    <div className="min-h-screen flex flex-col font-sans">
      <main className="flex-1 pt-20 pb-16">
        <MerchantPrivacyPolicySection />
      </main>
    </div>
  );
}
