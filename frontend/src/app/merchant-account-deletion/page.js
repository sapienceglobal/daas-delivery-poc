import React from 'react';
import AccountDeletionSection from '@/components/branded/lassi-lounge/sections/AccountDeletionSection';

export const metadata = {
  title: 'Merchant Account Deletion Request - Lassi Lounge NY',
  description: 'Merchant partner account deletion and data removal portal for Lassi Lounge store managers and kitchen staff.',
  alternates: {
    canonical: '/merchant-account-deletion',
  },
};

export default function MerchantAccountDeletionPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <main className="flex-1 pt-20 pb-16">
        <AccountDeletionSection />
      </main>
    </div>
  );
}
