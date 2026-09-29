import React from 'react';
import AccountDeletionSection from '@/components/branded/lassi-lounge/sections/AccountDeletionSection';

export const metadata = {
  title: 'Request Account & Data Deletion - Lassi Lounge NY',
  description: 'Permanent account deletion and personal data removal request portal for Lassi Lounge customer and merchant mobile applications.',
  alternates: {
    canonical: '/delete-account',
  },
};

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <main className="flex-1 pt-20 pb-16">
        <AccountDeletionSection />
      </main>
    </div>
  );
}
