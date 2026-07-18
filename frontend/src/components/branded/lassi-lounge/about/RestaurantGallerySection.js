'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function RestaurantGallerySection() {
  const GALLERY_IMAGES = [
    { src: '/images/branded/lassi-lounge/about/gallery-1.jpg', alt: 'Lassi Lounge Restaurant Exterior' },
    { src: '/images/branded/lassi-lounge/about/gallery-2.jpg', alt: 'Cozy Dining Area' },
    { src: '/images/branded/lassi-lounge/about/gallery-3.jpg', alt: 'Traditional Indian Art Mural' },
    { src: '/images/branded/lassi-lounge/about/gallery-4.jpg', alt: 'Bar Counter with Ambient Lighting' },
    { src: '/images/branded/lassi-lounge/about/gallery-5.jpg', alt: 'Romantic Candlelit Setting' }
  ];

  return (
    <section className="w-full bg-[#faf6f0] py-14 lg:py-20 select-none border-t border-[#e5e7eb]">
      <div className="mx-auto max-w-[1300px] px-6 lg:px-8 space-y-8">
        
        <div className="flex items-center justify-center gap-3 text-[#e8a020] text-[11px] font-bold uppercase tracking-[0.15em]">
          <svg width="35" height="10" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M40 6H4M4 6L9 1M4 6L9 11" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="20" cy="6" r="2.5" fill="#faf6f0" stroke="#e8a020" strokeWidth="1.5"/>
          </svg>
          <span>Our Restaurant Gallery</span>
          <svg width="35" height="10" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M0 6H36M36 6L31 1M36 6L31 11" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="20" cy="6" r="2.5" fill="#faf6f0" stroke="#e8a020" strokeWidth="1.5"/>
          </svg>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          {GALLERY_IMAGES.map((img, idx) => (
            <div key={idx} className="group relative aspect-[4/3] w-full rounded-xl overflow-hidden shadow-sm bg-[#e5e7eb] cursor-pointer">
              <img
                src={img.src}
                alt={img.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-[#000000]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2 text-center">
                <span className="text-[#ffffff] text-[12px] font-bold font-serif drop-shadow-md">
                  {img.alt}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-2">
          <Link
            href="/customer/gallery"
            className="bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff] font-bold text-[12px] uppercase tracking-wider px-6 py-3 rounded-lg shadow-sm inline-flex items-center gap-2 transition-colors duration-200"
          >
            View Full Gallery <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </div>

      </div>
    </section>
  );
}