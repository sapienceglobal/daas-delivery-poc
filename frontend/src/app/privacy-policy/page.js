import React from 'react';
import PrivacyPolicySection from '@/components/branded/lassi-lounge/sections/PrivacyPolicySection';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lassiloungeny.com';

export const metadata = {
  title: 'Privacy Policy | Lassi Lounge NY',
  description: 'Privacy Policy and Data Protection guidelines for Lassi Lounge NY. Learn how we handle customer data securely.',
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
    <div className="min-h-screen flex flex-col font-sans">
      <main className="flex-1 pt-24 pb-16">
        <PrivacyPolicySection />
      </main>
    </div>
  );
}
