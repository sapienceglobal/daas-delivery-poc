'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useCms } from '@/context/CmsContext';

export default function RestaurantGallerySection() {
  const { cmsData } = useCms();
  const scrollRef = useRef(null);
  
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 350;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const GALLERY_IMAGES = [
    { src: '/images/branded/lassi-lounge/about/gallery-1.jpeg', alt: 'Lassi Lounge Restaurant Exterior' },
    { src: '/images/branded/lassi-lounge/about/gallery-2.jpeg', alt: 'Cozy Dining Area' },
    { src: '/images/branded/lassi-lounge/about/gallery-3.jpeg', alt: 'Traditional Indian Art Mural' },
    { src: '/images/branded/lassi-lounge/about/gallery-4.jpeg', alt: 'Bar Counter with Ambient Lighting' },
    { src: '/images/branded/lassi-lounge/about/gallery-5.jpeg', alt: 'Romantic Candlelit Setting' },
    { src: '/images/branded/lassi-lounge/about/gallery-6.jpeg', alt: 'Romantic Candlelit Setting' }
  ];

  const imagesToRender = cmsData?.aboutUs?.galleryImages?.length > 0 
    ? cmsData.aboutUs.galleryImages 
    : GALLERY_IMAGES;

  return (
    <section className="w-full bg-[#faf6f0] py-14 lg:py-20 select-none border-t border-[#e5e7eb]">
      <div className="mx-auto max-w-[1536px] px-4 lg:px-8 space-y-8">

        <div className="flex justify-center items-center mb-8">
          <div className="flex items-center gap-3 text-[#e8a020] text-[11px] font-bold uppercase tracking-[0.15em]">
            <svg width="35" height="10" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 hidden sm:block">
              <path d="M40 6H4M4 6L9 1M4 6L9 11" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="20" cy="6" r="2.5" fill="#faf6f0" stroke="#e8a020" strokeWidth="1.5" />
            </svg>
            <span>Our Restaurant Gallery</span>
            <svg width="35" height="10" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 hidden sm:block">
              <path d="M0 6H36M36 6L31 1M36 6L31 11" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="20" cy="6" r="2.5" fill="#faf6f0" stroke="#e8a020" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4 xl:gap-6">
          <button 
            onClick={() => scroll('left')} 
            className="w-8 h-8 lg:w-10 lg:h-10 shrink-0 rounded-full border border-[#e5e7eb] flex items-center justify-center text-[#1f2937] hover:bg-[#e8a020] hover:text-white transition-all hover:border-[#e8a020]"
          >
            <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>

          <div ref={scrollRef} className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 lg:gap-5 pb-4">
            {imagesToRender.map((img, idx) => (
              <div key={idx} className="group/item relative shrink-0 snap-center w-[260px] md:w-[280px] lg:w-[300px] xl:w-[320px] aspect-[4/3] rounded-xl overflow-hidden shadow-sm bg-[#e5e7eb] cursor-pointer">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110"
                />
                <div className="absolute inset-0 bg-[#000000]/40 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2 text-center">
                  <span className="text-[#ffffff] text-[12px] font-bold font-serif drop-shadow-md">
                    {img.alt}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => scroll('right')} 
            className="w-8 h-8 lg:w-10 lg:h-10 shrink-0 rounded-full border border-[#e5e7eb] flex items-center justify-center text-[#1f2937] hover:bg-[#e8a020] hover:text-white transition-all hover:border-[#e8a020]"
          >
            <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
        </div>

        {/* <div className="flex justify-center pt-2">
          <Link
            href="/gallery"
            className="bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff] font-bold text-[12px] uppercase tracking-wider px-6 py-3 rounded-lg shadow-sm inline-flex items-center gap-2 transition-colors duration-200"
          >
            View Full Gallery <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </div> */}

      </div>
    </section>
  );
}