'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TestimonialCard from '@/components/ui/TestimonialCard';
import { testimonialsContent } from '../config';

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
  const [cardsPerPage, setCardsPerPage] = useState(3);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setCardsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerPage(2);
      } else {
        setCardsPerPage(3);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pageCount = reviews.length;
  // Append early reviews so that the last few pages still show a full set of cards without empty space
  const displayReviews = [...reviews, ...reviews.slice(0, cardsPerPage > 1 ? cardsPerPage - 1 : 0)];

  function goToPage(index) {
    setPage((index + pageCount) % pageCount);
  }

  // No need for out of bounds check anymore since pageCount = reviews.length

  return (
    <section className="bg-background-alt on-cream pt-8 pb-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">

        <div className="flex items-center justify-center gap-4 mb-10">
          <Ornament />
          <h2 className="font-heading font-black text-2xl lg:text-3xl text-text text-center">{eyebrow}</h2>
          <Ornament flip />
        </div>

        <div className="flex items-center gap-4 xl:gap-6">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            className="hidden sm:flex w-12 h-12 rounded-full bg-[#8a1620] text-white items-center justify-center shrink-0 shadow-md hover:bg-[#6f1119] transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <div className="flex-1 overflow-hidden px-1 py-2 -mx-1">
            <div 
              className="flex"
              style={{ 
                transform: `translateX(-${page * (100 / cardsPerPage)}%)`,
                transition: 'transform 0.5s ease-in-out'
              }}
            >
              {displayReviews.map((review, idx) => (
                <div 
                  key={`${review.id}-${idx}`} 
                  className="shrink-0 px-3"
                  style={{ width: `${100 / cardsPerPage}%` }}
                >
                  <TestimonialCard {...review} />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            className="hidden sm:flex w-12 h-12 rounded-full bg-[#8a1620] text-white items-center justify-center shrink-0 shadow-md hover:bg-[#6f1119] transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to review page ${i + 1}`}
                onClick={() => goToPage(i)}
                className={`inline-block rounded-full transition-all duration-300 ${i === page
                  ? 'w-3 h-3 bg-[#cd131b] border-2 border-[#8a1620] shadow-md'
                  : 'w-2.5 h-2.5 bg-[#cd131b]/20 hover:bg-[#cd131b]/40 shadow-sm'
                  }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}