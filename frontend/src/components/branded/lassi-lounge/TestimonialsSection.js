'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TestimonialCard from '@/components/ui/TestimonialCard';
import { testimonialsContent } from '../config';

const CARDS_PER_PAGE = 3;

/**
 * TestimonialsSection — "What Our Customers Say" carousel.
 *
 * FIX: heading used `text-text` (token-fragile) — switched to literal
 * `text-black`. Removed the now-unused `.on-cream` class.
 */
export default function TestimonialsSection() {
  const { eyebrow, reviews } = testimonialsContent;
  const pageCount = Math.ceil(reviews.length / CARDS_PER_PAGE);
  const [page, setPage] = useState(0);

  function goToPage(index) {
    setPage((index + pageCount) % pageCount);
  }

  const visibleReviews = reviews.slice(page * CARDS_PER_PAGE, page * CARDS_PER_PAGE + CARDS_PER_PAGE);

  return (
    <section className="bg-background-alt py-16">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="font-heading font-bold text-2xl lg:text-3xl text-black text-center mb-10">{eyebrow}</h2>

        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Previous reviews"
            onClick={() => goToPage(page - 1)}
            className="hidden sm:flex w-10 h-10 rounded-full bg-primary-600 text-white items-center justify-center shrink-0 hover:bg-primary-700 transition-colors duration-base"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {visibleReviews.map((review) => (
              <TestimonialCard key={review.id} {...review} />
            ))}
          </div>

          <button
            type="button"
            aria-label="Next reviews"
            onClick={() => goToPage(page + 1)}
            className="hidden sm:flex w-10 h-10 rounded-full bg-primary-600 text-white items-center justify-center shrink-0 hover:bg-primary-700 transition-colors duration-base"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {pageCount > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to review page ${i + 1}`}
                onClick={() => goToPage(i)}
                className={`w-2 h-2 rounded-full transition-colors duration-base ${
                  i === page ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}