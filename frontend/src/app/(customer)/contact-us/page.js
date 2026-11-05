import React from 'react';
import ContactUsSection from '@/components/branded/lassi-lounge/sections/ContactUsSection';
import { getPageMetadata } from '@/lib/pageSeo';

export async function generateMetadata() {
  return getPageMetadata('/contact-us');
}

export default function ContactUsPage() {
  return (
    <div className="ll-page-enter min-h-screen bg-[#faf9f8]">
      <ContactUsSection />
    </div>
  );
}
