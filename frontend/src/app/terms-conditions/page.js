import React from 'react';
import TermsConditionsSection from '@/components/branded/lassi-lounge/sections/TermsConditionsSection';

export const metadata = {
  title: 'Terms & Conditions - Lassi Lounge',
  description: 'Terms and Conditions for using Lassi Lounge services.',
};

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <main className="flex-1 pt-24 pb-16">
        <TermsConditionsSection />
      </main>
    </div>
  );
}
