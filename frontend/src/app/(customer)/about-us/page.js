'use client';

import AboutHeroSection from '@/components/branded/lassi-lounge/about/AboutHeroSection';
import AboutStorySection from '@/components/branded/lassi-lounge/about/AboutStorySection';
import ChefAndPhilosophySection from '@/components/branded/lassi-lounge/about/ChefAndPhilosophySection';
import WhyChooseUsSection from '@/components/branded/lassi-lounge/about/WhyChooseUsSection';
import RestaurantGallerySection from '@/components/branded/lassi-lounge/about/RestaurantGallerySection';

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-[#faf6f0] text-[#1a1a1a]">
      <AboutHeroSection />
      <AboutStorySection />
      <ChefAndPhilosophySection />
      <WhyChooseUsSection />
      <RestaurantGallerySection />
    </main>
  );
}