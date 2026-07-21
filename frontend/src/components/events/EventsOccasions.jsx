'use client';

import { Cake, Heart, Users, Briefcase, Coffee, Sparkles } from 'lucide-react';

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
  return (
    <section className="w-full bg-[#fdfaf6] pt-12 pb-10 px-6 md:px-10">
      <div className="max-w-[1300px] mx-auto">
        
        {/* Header with Decorative Lines */}
        <div className="flex items-center justify-center gap-4 mb-14">
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-[#7a0b10]"></div>
            <div className="w-8 h-[1px] bg-[#7a0b10] mx-1"></div>
            <div className="w-2 h-2 rotate-45 border-[1.5px] border-[#7a0b10]"></div>
          </div>
          
          <h2 className="text-[28px] md:text-[34px] font-black text-[#7a0b10] text-center font-serif tracking-wide">
            Perfect For Every Occasion
          </h2>
          
          <div className="flex items-center">
            <div className="w-2 h-2 rotate-45 border-[1.5px] border-[#7a0b10]"></div>
            <div className="w-8 h-[1px] bg-[#7a0b10] mx-1"></div>
            <div className="w-1.5 h-1.5 rounded-full border-[1.5px] border-[#7a0b10]"></div>
          </div>
        </div>

        {/* 6 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-5 mt-3">
          {OCCASIONS.map((occ, idx) => (
            <div 
              key={idx} 
              className="bg-[#fdfaf6] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#f0e6e2] pb-6 flex flex-col items-center text-center group hover:shadow-md transition-shadow overflow-hidden"
            >
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
              
              <div className="px-4 flex flex-col flex-1 justify-between">
                <h3 className="text-[14px] font-bold text-[#7a0b10] mb-2 leading-tight whitespace-pre-line">
                  {occ.title}
                </h3>
                <p className="text-[12px] text-[#4b5563] font-medium leading-relaxed">
                  {occ.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Pagination Dots (Matching Image) */}
        <div className="flex justify-center items-center gap-2 mt-10">
          <div className="w-2.5 h-2.5 rounded-full bg-[#7a0b10]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#d1d5db]"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-[#d1d5db]"></div>
        </div>

      </div>
    </section>
  );
}