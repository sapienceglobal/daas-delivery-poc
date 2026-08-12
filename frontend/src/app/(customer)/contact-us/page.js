import React from 'react';
import ContactUsSection from '@/components/branded/lassi-lounge/sections/ContactUsSection';

export const metadata = {
  title: 'Contact Us - Lassi Lounge',
  description: 'Get in touch with Lassi Lounge for catering, events, or general inquiries.',
};

export default function ContactUsPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <main className="flex-1 pt-24 pb-16">
        <ContactUsSection />
      </main>
    </div>
  );
}
