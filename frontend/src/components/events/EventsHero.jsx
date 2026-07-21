'use client';

import { Utensils, Sliders, Users, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    icon: Utensils,
    title: 'Delicious Food',
    subtitle: 'Everyone Loves',
  },
  {
    icon: Sliders,
    title: 'Customizable',
    subtitle: 'Packages',
  },
  {
    icon: Users,
    title: 'Professional',
    subtitle: 'Service',
  },
  {
    icon: Sparkles,
    title: 'Beautiful',
    subtitle: 'Ambiance',
  },
];

export default function EventsHero() {
  return (
    <section className="relative w-full h-[450px] md:h-[500px] flex items-center justify-start overflow-hidden pt-10">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/events/event_hero_bg_1784613747961.png)' }}
      >
        {/* Dark gradient to make text pop on the left */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1200px] w-full mx-auto px-6 md:px-10 h-full flex flex-col justify-center">
        <div className="max-w-2xl text-white mt-4">
          
          <h2 
            className="text-[32px] md:text-[40px] text-[#eab308] leading-none mb-1"
            style={{ fontFamily: "'Dancing Script', 'Great Vibes', cursive, serif" }}
          >
            Make Every Occasion
          </h2>
          
          <h1 className="text-[52px] md:text-[76px] font-bold uppercase text-white tracking-tight leading-[0.9] mb-2" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
            EXTRA SPECIAL
          </h1>
          
          <h3 
            className="text-[28px] md:text-[38px] text-[#dc2626] leading-none mb-6"
            style={{ fontFamily: "'Dancing Script', 'Great Vibes', cursive, serif" }}
          >
            with Lassi Lounge
          </h3>
          
          <p className="text-[14px] md:text-[15px] text-[#d1d5db] mb-10 max-w-[480px] leading-relaxed font-medium">
            From small get-togethers to grand celebrations, we make your events truly memorable with authentic food, warm hospitality and perfect ambiance.
          </p>

          <div className="flex flex-wrap items-center gap-x-6 md:gap-x-10 gap-y-4">
            {FEATURES.map((feature, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <div className="w-[34px] h-[34px] rounded-full border-[1.5px] border-[#eab308] flex items-center justify-center text-[#eab308] shrink-0">
                  <feature.icon className="w-4 h-4" strokeWidth={2} />
                </div>
                <div>
                  <div className="text-[12px] md:text-[13px] font-bold text-white leading-tight mb-0.5">{feature.title}</div>
                  <div className="text-[10px] md:text-[11px] font-medium text-gray-400 leading-tight">{feature.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </section>
  );
}
