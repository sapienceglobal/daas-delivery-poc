import React from 'react';
import PrivacyPolicySection from '@/components/branded/lassi-lounge/sections/PrivacyPolicySection';

export const metadata = {
  title: 'Privacy Policy - Lassi Lounge',
  description: 'Privacy Policy and Data Protection guidelines for Lassi Lounge.',
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
