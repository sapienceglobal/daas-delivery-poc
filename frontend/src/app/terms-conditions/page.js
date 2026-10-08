import React from 'react';
import TermsConditionsSection from '@/components/branded/lassi-lounge/sections/TermsConditionsSection';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';

export const metadata = {
  title: 'Terms & Conditions | Lassi Lounge NY',
  description: 'Terms and Conditions for using Lassi Lounge NY services.',
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  robots: {
    index: false,
    follow: true,
  },
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
