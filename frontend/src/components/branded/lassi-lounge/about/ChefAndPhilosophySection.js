'use client';

import { Utensils, Leaf, Heart, Sparkles } from 'lucide-react';

export default function ChefAndPhilosophySection() {
  const PHILOSOPHY_POINTS = [
    {
      icon: Utensils,
      title: 'Authentic Recipes',
      desc: 'Traditional flavors passed down with love.'
    },
    {
      icon: Leaf,
      title: 'Fresh Ingredients',
      desc: 'Only the freshest & highest quality ingredients.'
    },
    {
      icon: Heart,
      title: 'Warm Hospitality',
      desc: 'Every guest is treated like family.'
    },
    {
      icon: Sparkles,
      title: 'Memorable Experience',
      desc: 'Delicious food, cozy ambiance, unforgettable moments.'
    }
  ];

  return (
    <section className="relative w-full bg-[#0e0d0c] py-14 lg:py-20 select-none border-t border-b border-[#ffffff]/10 overflow-hidden">
      <div className="relative mx-auto max-w-[1300px] px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
        
        <div className="hidden lg:flex absolute left-1/2 top-4 bottom-4 -translate-x-1/2 flex-col items-center">
          <div className="w-[1px] flex-1 bg-gradient-to-b from-[#e8a020]/0 via-[#e8a020]/40 to-[#e8a020]/40" />
          <div className="w-1.5 h-1.5 rotate-45 bg-[#e8a020] my-2" />
          <div className="w-[1px] flex-1 bg-gradient-to-t from-[#e8a020]/0 via-[#e8a020]/40 to-[#e8a020]/40" />
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#e8a020] text-[11px] font-bold uppercase tracking-[0.15em]">
              <span>Our Chef & Founder</span>
              <div className="h-[1px] bg-[#e8a020] w-10" />
            </div>

            <h2 className="text-[32px] md:text-[44px] font-serif font-bold leading-[1.1] text-[#ffffff]">
              The Heart Behind <br />
              <span className="text-[#cd131b]">Lassi Lounge</span>
            </h2>

            <p className="text-[#d1d5db] text-[13px] md:text-[14px] leading-relaxed font-medium pt-1 max-w-[95%]">
              With years of experience and a deep passion for Indian cuisine, our founder & chef brings authentic recipes to life with a modern twist. Every recipe is tested, tasted and perfected to deliver the best to our guests.
            </p>

            <div className="pt-3 pb-1">
              <span className="text-[30px] md:text-[36px] text-[#e8a020] block leading-none" style={{ fontFamily: 'var(--font-script, cursive)' }}>
                Kuldeep Singh
              </span>
            </div>
          </div>

          <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden shadow-2xl bg-[#000000] group max-w-[90%]">
            <img
              src="/images/branded/lassi-lounge/about/chef-kuldeep.jpg"
              alt="Founder & Head Chef"
              className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105 opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0d0c] via-[#0e0d0c]/20 to-transparent" />
          </div>
        </div>

        <div className="lg:col-span-6 space-y-8 lg:pl-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-[#e8a020] text-[11px] font-bold uppercase tracking-[0.15em]">
              <span>Our Philosophy</span>
              <div className="h-[1px] bg-[#e8a020] w-10" />
            </div>

            <h2 className="text-[32px] md:text-[44px] font-serif font-bold leading-[1.1] text-[#ffffff]">
              Good Food, Good Mood, <br />
              <span className="text-[#cd131b]">Great Memories</span>
            </h2>

            <p className="text-[#d1d5db] text-[13px] md:text-[14px] leading-relaxed font-medium pt-1 max-w-[95%]">
              We believe food is more than just a meal – it&apos;s an experience. That&apos;s why we focus on:
            </p>
          </div>

          <div className="space-y-6 pt-1">
            {PHILOSOPHY_POINTS.map((point, index) => {
              const IconComponent = point.icon;
              return (
                <div key={index} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-full border border-[#e8a020] bg-transparent flex items-center justify-center text-[#e8a020] shrink-0 transition-all duration-300 group-hover:bg-[#e8a020] group-hover:text-[#0e0d0c] shadow-[0_0_10px_rgba(232,160,32,0.1)]">
                    <IconComponent className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    <h3 className="text-[15px] font-bold text-[#ffffff] tracking-wide">
                      {point.title}
                    </h3>
                    <p className="text-[13px] text-[#9ca3af] font-medium leading-relaxed">
                      {point.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}