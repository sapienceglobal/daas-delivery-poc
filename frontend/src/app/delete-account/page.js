import React from 'react';
import CustomerAccountDeletionSection from '@/components/branded/lassi-lounge/sections/CustomerAccountDeletionSection';

export const metadata = {
  title: 'Delete Customer Account & Data - Lassi Lounge NY',
  description: 'Permanent customer account deletion and personal data removal request portal for Lassi Lounge food delivery users.',
  alternates: {
    canonical: '/delete-account',
  },
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#faf9f8]">
      <main className="flex-1 pt-16 pb-16">
        <CustomerAccountDeletionSection />
      </main>
    </div>
  );
}
