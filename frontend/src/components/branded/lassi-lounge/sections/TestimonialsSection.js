'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TestimonialCard from '@/components/ui/TestimonialCard';
import { testimonialsContent } from '../config';

const CARDS_PER_PAGE = 3;

function Ornament({ flip = false }) {
  return (
    <svg width="70" height="16" viewBox="0 0 70 16" fill="none" className={flip ? 'rotate-180' : ''} aria-hidden="true">
      <line x1="0" y1="8" x2="28" y2="8" stroke="#C9973A" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M28 2L37 8L28 14" stroke="#C9973A" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="46" cy="8" r="2.5" fill="#C9973A" />
      <line x1="52" y1="8" x2="70" y2="8" stroke="#C9973A" strokeWidth="1.5" strokeDasharray="3 3" />
    </svg>
  );
}

export default function TestimonialsSection() {
  const { eyebrow, reviews } = testimonialsContent;
  const pageCount = reviews.length - CARDS_PER_PAGE + 1;
  const [page, setPage] = useState(0);

  function goToPage(index) {
    setPage((index + pageCount) % pageCount);
  }

  const visibleReviews = reviews.slice(page, page + CARDS_PER_PAGE);

  return (
    <section className="bg-background-alt on-cream pt-12 pb-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">

        <div className="flex items-center justify-center gap-4 mb-10">
          <Ornament />
          <h2 className="font-heading font-black text-2xl lg:text-3xl text-text text-center">{eyebrow}</h2>
          <Ornament flip />
        </div>

        <div className="flex items-center gap-4 xl:gap-6">
          {/* Previous Button: Direct dark red (#8a1620) HEX */}
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            className="hidden sm:flex w-12 h-12 rounded-full bg-[#8a1620] text-white items-center justify-center shrink-0 shadow-md hover:bg-[#6f1119] transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {visibleReviews.map((review) => (
              <TestimonialCard key={review.id} {...review} />
            ))}
          </div>

          {/* Next Button: Direct dark red (#8a1620) HEX */}
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            className="hidden sm:flex w-12 h-12 rounded-full bg-[#8a1620] text-white items-center justify-center shrink-0 shadow-md hover:bg-[#6f1119] transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Dots Section */}
        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to review page ${i + 1}`}
                onClick={() => goToPage(i)}
                className={`inline-block rounded-full transition-all duration-300 ${i === page
                  ? 'w-3 h-3 bg-[#cd131b] border-2 border-white shadow-sm'
                  : 'w-2.5 h-2.5 bg-gray-400'
                  }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}