import React from 'react';
import ContactUsSection from '@/components/branded/lassi-lounge/sections/ContactUsSection';
import { getPageMetadata } from '@/lib/pageSeo';

export async function generateMetadata() {
  return getPageMetadata('/contact-us');
}

export default function ContactUsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <main className="flex-1 pt-24 pb-16">
        <ContactUsSection />
      </main>
    </div>
  );
}
