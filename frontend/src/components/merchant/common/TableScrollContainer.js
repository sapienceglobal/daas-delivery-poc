'use client';

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable TableScrollContainer
 *
 * Provides industry-standard horizontal table scrolling with:
 * - Persistent custom scrollbar at bottom
 * - Responsive floating Left & Right smooth-scroll buttons
 * - Soft edge gradient fading overlays
 * - Automatic detection via ResizeObserver: buttons stay hidden on wide screens where
 *   content fits, and dynamically appear on smaller screens (laptops, iPads, tablets, mobile)
 * - Dark / Light mode luxury theme styling
 */
const TableScrollContainer = forwardRef(function TableScrollContainer(
  {
    children,
    className = '',
    innerClassName = '',
    scrollStep,
    hideIndicators = false,
    fadeWidth = 'w-14 sm:w-16',
    leftGradientClass = 'bg-gradient-to-r from-white via-white/85 to-transparent dark:from-[#1a1a2e] dark:via-[#1a1a2e]/85 dark:to-transparent',
    rightGradientClass = 'bg-gradient-to-l from-white via-white/85 to-transparent dark:from-[#1a1a2e] dark:via-[#1a1a2e]/85 dark:to-transparent',
  },
  forwardedRef
) {
  const scrollRef = useRef(null);
  useImperativeHandle(forwardedRef, () => scrollRef.current, []);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const overflow = el.scrollWidth > el.clientWidth + 4;
    setHasOverflow(overflow);

    if (!overflow) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const atStart = el.scrollLeft <= 6;
    const atEnd = el.scrollLeft >= el.scrollWidth - el.clientWidth - 6;

    setCanScrollLeft(!atStart);
    setCanScrollRight(!atEnd);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();

    el.addEventListener('scroll', checkScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(el);

    if (el.firstElementChild) {
      resizeObserver.observe(el.firstElementChild);
    }

    window.addEventListener('resize', checkScroll);
    const timer = setTimeout(checkScroll, 120);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [checkScroll, children]);

  const handleScroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;

    const distance = scrollStep || Math.max(260, Math.floor(el.clientWidth * 0.6));
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  return (
    <div className={`relative group/table-scroll ${className}`}>
      {/* Floating Left Scroll Button with luxury gradient edge */}
      {!hideIndicators && hasOverflow && canScrollLeft && (
        <div
          className={`absolute left-0 top-0 bottom-0 ${fadeWidth} ${leftGradientClass} z-20 flex items-center pl-2 pointer-events-none transition-all duration-300 animate-fadeIn`}
        >
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#22223b] border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-white hover:bg-brand hover:border-brand shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_20px_rgba(205,19,27,0.35)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
            title="Scroll table left"
            aria-label="Scroll table left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Floating Right Scroll Button with luxury gradient edge */}
      {!hideIndicators && hasOverflow && canScrollRight && (
        <div
          className={`absolute right-0 top-0 bottom-0 ${fadeWidth} ${rightGradientClass} z-20 flex items-center justify-end pr-2 pointer-events-none transition-all duration-300 animate-fadeIn`}
        >
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="pointer-events-auto w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#22223b] border border-slate-200 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:text-white hover:bg-brand hover:border-brand shadow-[0_4px_14px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_20px_rgba(205,19,27,0.35)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
            title="Scroll table right"
            aria-label="Scroll table right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Scrollable table container with bottom horizontal scrollbar */}
      <div
        ref={scrollRef}
        className={`overflow-x-auto custom-scrollbar scroll-smooth w-full ${innerClassName}`}
      >
        {children}
      </div>
    </div>
  );
});

export default TableScrollContainer;
