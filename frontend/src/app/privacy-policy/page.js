import React from 'react';
import PrivacyPolicySection from '@/components/branded/lassi-lounge/sections/PrivacyPolicySection';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';

export const metadata = {
  title: 'Privacy Policy & Data Safety | Lassi Lounge NY',
  description: 'Privacy Policy and Data Protection guidelines for Lassi Lounge NY. Learn how we handle customer data and device identifiers securely.',
  alternates: {
    canonical: `${siteUrl}/privacy-policy`,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="ll-page-enter min-h-screen bg-[#faf9f8]">
      <PrivacyPolicySection />
    </div>
  );
}
