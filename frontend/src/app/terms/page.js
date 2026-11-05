import React from 'react';
import TermsConditionsSection from '@/components/branded/lassi-lounge/sections/TermsConditionsSection';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';

export const metadata = {
  title: 'Terms of Service | Lassi Lounge NY',
  description: 'Terms and Conditions for using Lassi Lounge NY customer and online ordering services.',
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <div className="ll-page-enter min-h-screen bg-[#faf9f8]">
      <TermsConditionsSection />
    </div>
  );
}
