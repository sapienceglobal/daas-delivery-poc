'use client';

import AboutHeroSection from '@/components/branded/lassi-lounge/about/AboutHeroSection';
import AboutStorySection from '@/components/branded/lassi-lounge/about/AboutStorySection';
import ChefAndPhilosophySection from '@/components/branded/lassi-lounge/about/ChefAndPhilosophySection';
import RestaurantGallerySection from '@/components/branded/lassi-lounge/about/RestaurantGallerySection';
import WhyChooseUsSection from '@/components/branded/lassi-lounge/about/WhyChooseUsSection';

export default function AboutUsPage() {
  return (
    <div className="ll-page-enter bg-[#0e0d0c] min-h-screen">
      <AboutHeroSection />
      <div className="ll-reveal">
        <AboutStorySection />
      </div>
      <div className="ll-reveal">
        <ChefAndPhilosophySection />
      </div>
      <div className="ll-reveal">
        <WhyChooseUsSection />
      </div>
      <div className="ll-reveal">
        <RestaurantGallerySection />
      </div>
    </div>
  );
}
