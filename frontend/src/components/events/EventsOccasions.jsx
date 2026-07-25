'use client';

import { useRef } from 'react';
import { Cake, Heart, Users, Briefcase, Coffee, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

const OCCASIONS = [
  {
    title: 'Birthday Parties',
    desc: 'Celebrate birthdays with great food and joy.',
    img: '/images/events/event_birthday_1784613762307.png',
    icon: Cake
  },
  {
    title: 'Anniversary',
    desc: 'Make your special day even more special.',
    img: '/images/events/event_anniversary_1784613775868.png',
    icon: Heart
  },
  {
    title: 'Family Gathering',
    desc: 'Bring your family together over delicious meals.',
    img: '/images/events/event_family_1784613788758.png',
    icon: Users
  },
  {
    title: 'Corporate Events',
    desc: 'Perfect for meetings, lunches and celebrations.',
    img: '/images/events/event_corporate_1784613808607.png',
    icon: Briefcase
  },
  {
    title: 'Kitty Parties',
    desc: 'Enjoy fun-filled kitty parties with friends.',
    img: '/images/events/event_kitty_1784613821280.png',
    icon: Coffee
  },
  {
    title: 'Festivals & Cultural\nEvents',
    desc: 'Celebrate festivals with authentic flavors.',
    img: '/images/events/event_festival_1784613835024.png',
    icon: Sparkles
  }
];

export default function EventsOccasions() {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      // scroll by roughly the width of one card (or full viewport depending on UX)
      // For a carousel, scrolling by the clientWidth is standard
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full bg-[#fdfaf6] pt-12 pb-10 px-4 md:px-8">
      <div className="max-w-[1350px] mx-auto">
        
        {/* Header with Decorative Lines */}
        <div className="flex items-center justify-center gap-4 mb-14">
          <div className="flex items-center hidden sm:flex">
            <div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-[#7a0b10]"></div>
            <div className="w-8 h-[1px] bg-[#7a0b10] mx-1"></div>
            <div className="w-2 h-2 rotate-45 border-[1.5px] border-[#7a0b10]"></div>
          </div>
          
          <h2 className="text-[28px] md:text-[34px] font-black text-[#7a0b10] text-center font-serif tracking-wide">
            Perfect For Every Occasion
          </h2>
          
          <div className="flex items-center hidden sm:flex">
            <div className="w-2 h-2 rotate-45 border-[1.5px] border-[#7a0b10]"></div>
            <div className="w-8 h-[1px] bg-[#7a0b10] mx-1"></div>
            <div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-[#7a0b10]"></div>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="flex items-center gap-4 xl:gap-6">
          
          <button
            type="button"
            onClick={() => scroll('left')}
            className="hidden xl:flex w-10 h-10 rounded-full bg-[#8a1620] text-white items-center justify-center shrink-0 shadow-md hover:bg-[#6f1119] transition-colors"
          >
            <ChevronLeft size={20} />
          </button>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-x-auto flex snap-x snap-mandatory no-scrollbar px-1 py-2 -mx-1 gap-4 xl:gap-5"
          >
            {OCCASIONS.map((occ, idx) => (
              <div 
                key={idx} 
                className="shrink-0 snap-center w-[260px] sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)] xl:w-auto xl:flex-1"
              >
                <div className="bg-[#fdfaf6] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#f0e6e2] pb-6 flex flex-col items-center text-center group hover:shadow-md transition-shadow overflow-hidden h-full">
                  <div className="w-full aspect-[4/3] relative mb-5 overflow-hidden">
                    <img 
                      src={occ.img} 
                      alt={occ.title.replace('\n', ' ')} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    
                    {/* Icon Circle (Inside Image, Top-Center) */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-11 h-11 bg-white rounded-full shadow-md flex items-center justify-center z-10 text-[#7a0b10]">
                      <occ.icon className="w-[22px] h-[22px]" strokeWidth={1.5} />
                    </div>
                  </div>
                  
                  <div className="px-4 flex flex-col flex-1 justify-between w-full">
                    <h3 className="text-[14px] font-bold text-[#7a0b10] mb-2 leading-tight whitespace-pre-line">
                      {occ.title}
                    </h3>
                    <p className="text-[12px] text-[#4b5563] font-medium leading-relaxed">
                      {occ.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => scroll('right')}
            className="hidden xl:flex w-10 h-10 rounded-full bg-[#8a1620] text-white items-center justify-center shrink-0 shadow-md hover:bg-[#6f1119] transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

      </div>
    </section>
  );
}