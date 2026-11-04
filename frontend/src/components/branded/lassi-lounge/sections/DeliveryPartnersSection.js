'use client';

import { useEffect, useRef } from 'react';
import { deliveryPartnersContent } from '../config';

export default function DeliveryPartnersSection() {
  const partnersScrollRef = useRef(null);
  const { eyebrow, heading, headingScript, description, partners } = deliveryPartnersContent;

  useEffect(() => {
    if (partnersScrollRef.current) {
      setTimeout(() => {
        const container = partnersScrollRef.current;
        if (container) {
          const scrollTarget = (container.scrollWidth - container.clientWidth) / 2;
          container.scrollTo({ left: scrollTarget, behavior: 'smooth' });
        }
      }, 100);
    }
  }, []);

  return (
    <section className="bg-[#f7f1e4] w-full pt-4 pb-12 select-none">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
        <div className="bg-gradient-to-r from-[#3a060d] via-[#6e0c15] to-[#a41722] rounded-[2.5rem] flex flex-col xl:flex-row items-center justify-between px-8 py-8 md:px-10 md:py-8 shadow-2xl border border-red-900/30">
          <div className="space-y-1 text-left w-full xl:w-auto xl:flex-1">
            <p className="text-[#e8a020] font-bold text-[10px] md:text-xs uppercase tracking-widest mb-2">
              {eyebrow}
            </p>
            <h2 className="text-3xl md:text-[2.2rem] font-serif font-bold text-white leading-tight">
              {heading}
            </h2>
            <h3
              className="text-[#e8a020] font-normal tracking-wide text-3xl md:text-[2.5rem] mt-1"
              style={{ fontFamily: "'Dancing Script', cursive" }}
            >
              {headingScript}
            </h3>
            <p className="text-white/80 text-xs md:text-[13px] font-sans max-w-sm leading-relaxed pt-3">
              {description}
            </p>
          </div>

          <div className="hidden xl:block w-[1px] h-24 bg-white/20 mx-6"></div>

          <div
            ref={partnersScrollRef}
            className="flex flex-row overflow-x-auto snap-x snap-mandatory no-scrollbar items-center justify-start xl:justify-center gap-3 md:gap-4 w-full xl:w-auto mt-8 xl:mt-0 pb-2 xl:pb-0 -mx-4 px-4 xl:mx-0 xl:px-0"
          >
            {partners[0] && (
              <a
                href={partners[0].href}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 snap-center bg-black hover:bg-neutral-900 rounded-2xl shadow-xl flex items-center justify-center w-[150px] sm:w-[170px] lg:w-[190px] h-[85px] lg:h-[95px] transition-transform hover:-translate-y-1"
              >
                <span className="font-bold text-white text-2xl md:text-3xl tracking-tighter flex flex-col items-center leading-none font-sans">
                  Uber <span className="text-[#06c167] mt-1">Eats</span>
                </span>
              </a>
            )}

            {partners[1] && (
              <a
                href={partners[1].href}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 snap-center bg-white hover:bg-gray-50 rounded-2xl shadow-xl flex items-center justify-center w-[150px] sm:w-[170px] lg:w-[190px] h-[85px] lg:h-[95px] transition-transform hover:-translate-y-1"
              >
                <span className="font-black text-[#ff3008] text-base md:text-lg tracking-widest font-sans uppercase flex flex-col items-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="#ff3008" xmlns="http://www.w3.org/2000/svg" className="mb-1.5">
                    <path d="M22.956 16.037c0 4.148-4.708 6.44-8.868 6.44-4.887 0-9.824-2.83-9.824-6.44 0-4.149 4.706-6.44 8.867-6.44 4.889 0 9.825 2.829 9.825 6.44zm-14.93-9.043c0-4.147 4.708-6.44 8.867-6.44 4.889 0 9.825 2.83 9.825 6.44 0 4.149-4.707 6.44-8.868 6.44-4.887 0-9.824-2.829-9.824-6.44z" />
                  </svg>
                  DOORDASH
                </span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
