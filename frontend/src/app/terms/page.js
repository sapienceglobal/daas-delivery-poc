import React from 'react';
import TermsConditionsSection from '@/components/branded/lassi-lounge/sections/TermsConditionsSection';

export const metadata = {
  title: 'Terms of Service - Lassi Lounge',
  description: 'Terms and Conditions for using Lassi Lounge customer and merchant services.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <main className="flex-1 pt-20 pb-16">
        <TermsConditionsSection />
      </main>
    </div>
  );
}
