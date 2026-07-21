'use client';

import { useState } from 'react';
import EventsHero from './EventsHero';
import EventsOccasions from './EventsOccasions';
import EventsPackages from './EventsPackages';
import EventsTrustStrip from './EventsTrustStrip';
import EventsCta from './EventsCta';
import EventsGallery from './EventsGallery';
import EventInquiryModal from './EventInquiryModal';

export default function EventsPage({ restaurantId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('Custom / Unsure');

  const handleOpenModal = (pkg = 'Custom / Unsure') => {
    setSelectedPackage(pkg);
    setIsModalOpen(true);
  };

  return (
    <div className="w-full min-h-screen bg-white font-sans">
      <EventsHero />
      <EventsOccasions />
      <EventsPackages onCustomize={(pkgName) => {
        const pkg = typeof pkgName === 'string' ? pkgName : 'Custom / Unsure';
        handleOpenModal(pkg);
      }} />
      <EventsTrustStrip />
      <EventsCta onQuote={() => handleOpenModal('Custom / Unsure')} />
      <EventsGallery />

      <EventInquiryModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        restaurantId={restaurantId}
        initialPackage={selectedPackage}
      />
    </div>
  );
}
