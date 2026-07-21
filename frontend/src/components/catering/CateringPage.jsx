'use client';

import { useState } from 'react';
import CateringHero from './CateringHero';
import CateringOccasions from './CateringOccasions';
import CateringPackages from './CateringPackages';
import CateringWhyChooseUs from './CateringWhyChooseUs';
import CateringHowItWorks from './CateringHowItWorks';
import CateringFooterCta from './CateringFooterCta';
import CateringInquiryModal from './CateringInquiryModal';

export default function CateringPage({ restaurantId }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState('Custom / Unsure');

  const handleOpenModal = (pkg = 'Custom / Unsure') => {
    setSelectedPackage(pkg === 'basic' ? 'Basic Package' : 
                       pkg === 'premium' ? 'Premium Package' : 
                       pkg === 'deluxe' ? 'Deluxe Package' : 
                       'Custom / Unsure');
    setModalOpen(true);
  };

  return (
    <div className="bg-[#fdfbf7] min-h-screen font-sans">
      <CateringHero onGetQuote={() => handleOpenModal()} />
      <CateringOccasions />
      
      {/* Packages and Why Choose Us Section */}
      <section className="py-8 max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[70%]">
            <CateringPackages onContact={handleOpenModal} />
          </div>
          <div className="w-full lg:w-[30%]">
            <CateringWhyChooseUs phone="(516) 612-0300" />
          </div>
        </div>
      </section>

      <CateringHowItWorks />
      <CateringFooterCta onGetQuote={() => handleOpenModal()} />

      <CateringInquiryModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        restaurantId={restaurantId}
        initialPackage={selectedPackage}
      />
    </div>
  );
}
