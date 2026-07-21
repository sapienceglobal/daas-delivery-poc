'use client';

import { CalendarHeart, ArrowRight } from 'lucide-react';

export default function EventsCta({ onQuote }) {
  return (
    <section className="w-full bg-[#fdfaf6] pb-10 px-6 md:px-10">
      <div className="max-w-[1300px] mx-auto">
        <div className="bg-[#7a0b10] rounded-xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between shadow-lg relative overflow-hidden">
          
          {/* subtle background pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          <div className="flex items-center space-x-6 relative z-10 mb-6 md:mb-0">
            <div className="w-16 h-16 rounded-xl border border-white/30 flex items-center justify-center text-[#facc15] shrink-0 bg-white/10 backdrop-blur-sm">
              <CalendarHeart className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Plan Your Event with Us Today!
              </h2>
              <p className="text-white/90 text-sm md:text-base">
                Let us take care of the food while you enjoy the moments.
              </p>
            </div>
          </div>

          <button 
            onClick={onQuote}
            className="group flex items-center space-x-2 bg-[#facc15] text-[#7a0b10] px-8 py-4 rounded-md font-bold hover:bg-yellow-300 transition-colors shrink-0 relative z-10 shadow-md"
          >
            <span>GET A FREE QUOTE</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
        </div>
      </div>
    </section>
  );
}
