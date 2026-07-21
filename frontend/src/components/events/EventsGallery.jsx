'use client';

import { ChevronRight } from 'lucide-react';

const IMAGES = [
  '/images/events/event_gallery_1_1784613895706.png',
  '/images/events/event_gallery_2_1784613910221.png',
  '/images/events/event_gallery_3_1784613929014.png',
  '/images/events/event_family_1784613788758.png',
  '/images/events/event_corporate_1784613808607.png', 
];

export default function EventsGallery() {
  return (
    <section className="w-full bg-[#fdfaf6] pb-10 px-6 md:px-10 overflow-hidden">
      <div className="max-w-[1300px] mx-auto relative">
        
        {/* Header with Golden Decorative Lines */}
        <div className="flex items-center justify-center gap-4 mb-10">
          <div className="flex items-center">
            {/* Left tapering line */}
            <div className="w-16 h-[1.5px] bg-gradient-to-l from-[#cba052] to-transparent"></div>
            {/* Diamond shape */}
            <div className="w-2 h-2 rotate-45 border-[1.5px] border-[#cba052] ml-1"></div>
          </div>
          
          <h2 className="text-[28px] md:text-[34px] font-black text-[#7a0b10] text-center font-serif tracking-wide">
            Glimpses of Our Events
          </h2>
          
          <div className="flex items-center">
            {/* Diamond shape */}
            <div className="w-2 h-2 rotate-45 border-[1.5px] border-[#cba052] mr-1"></div>
            {/* Right tapering line */}
            <div className="w-16 h-[1.5px] bg-gradient-to-r from-[#cba052] to-transparent"></div>
          </div>
        </div>

        {/* Gallery Slider / Grid */}
        <div className="relative group px-1">
          {/* Scrollbar hide classes added and gap adjusted */}
          <div className="flex overflow-x-auto gap-3 md:gap-4 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {IMAGES.map((img, idx) => (
              <div 
                key={idx} 
                // lg:min-w-0 aur lg:flex-1 ensure karta hai ki desktop par images choti ho kar ek sath fit ho jayein
                className="min-w-[240px] lg:min-w-0 lg:flex-1 flex-shrink-0 lg:flex-shrink aspect-[16/10] snap-start rounded-xl overflow-hidden shadow-sm border border-[#f0e6e2] relative cursor-pointer"
              >
                <img 
                  src={img} 
                  alt={`Gallery Event ${idx + 1}`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                />
              </div>
            ))}
          </div>

          {/* Overlapping Right Chevron Button */}
          <button 
            className="absolute right-0 top-[45%] -translate-y-1/2 translate-x-1/3 bg-white w-14 h-14 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.12)] border border-[#f0e6e2] flex items-center justify-center text-[#7a0b10] hover:bg-[#fbfaf7] hover:scale-105 transition-all z-10 hidden md:flex"
            aria-label="Next Images"
          >
            <ChevronRight className="w-7 h-7 ml-0.5" strokeWidth={2} />
          </button>
        </div>

      </div>
    </section>
  );
}