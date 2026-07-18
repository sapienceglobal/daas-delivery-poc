'use client';

import { ConciergeBell, Leaf, ChefHat, Users, Award } from 'lucide-react';

export default function WhyChooseUsSection() {
  const FEATURES = [
    {
      icon: ConciergeBell,
      title: 'Authentic Flavors',
      desc: 'True tastes of India in every bite.'
    },
    {
      icon: Leaf,
      title: 'Fresh & Quality Ingredients',
      desc: 'We never compromise on quality.'
    },
    {
      icon: ChefHat,
      title: 'Expert Chefs',
      desc: 'Experienced chefs passionate about food.'
    },
    {
      icon: Users,
      title: 'Perfect For Everyone',
      desc: 'Family dinners, parties, or a casual meal.'
    },
    {
      icon: Award,
      title: 'Top Rated',
      desc: 'Loved by our guests and highly recommended.'
    }
  ];

  return (
    <section className="w-full bg-[#faf6f0] py-14 lg:py-20 select-none">
      <div className="mx-auto max-w-[1300px] px-6 lg:px-8">
        
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <div className="flex items-center justify-center gap-3 text-[#e8a020] text-[11px] font-bold uppercase tracking-[0.15em]">
            <svg width="35" height="10" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M40 6H4M4 6L9 1M4 6L9 11" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="20" cy="6" r="2.5" fill="#faf6f0" stroke="#e8a020" strokeWidth="1.5"/>
            </svg>
            <span>Why Choose Us</span>
            <svg width="35" height="10" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
              <path d="M0 6H36M36 6L31 1M36 6L31 11" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="20" cy="6" r="2.5" fill="#faf6f0" stroke="#e8a020" strokeWidth="1.5"/>
            </svg>
          </div>

          <h2 className="text-[28px] md:text-[38px] font-serif font-bold text-[#1a1a1a] tracking-tight leading-none">
            More Than Just A Restaurant
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-0">
          {FEATURES.map((feat, idx) => {
            const IconComponent = feat.icon;
            return (
              <div key={idx} className="relative flex flex-col items-center text-center px-3 group">
                {idx < FEATURES.length - 1 && (
                  <div className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 flex-col items-center justify-center translate-x-1/2">
                    <div className="w-[1px] h-8 bg-[#d1d5db]" />
                    <div className="w-1 h-1 rotate-45 border border-[#d1d5db] bg-[#faf6f0] my-1" />
                    <div className="w-[1px] h-8 bg-[#d1d5db]" />
                  </div>
                )}

                <div className="w-[68px] h-[68px] rounded-full bg-[#7a0b10] flex items-center justify-center shadow-md transition-transform duration-300 group-hover:-translate-y-1.5 mb-4">
                  <IconComponent className="w-8 h-8 text-[#e8a020] stroke-[1.5]" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-[15px] font-serif font-bold text-[#1a1a1a]">
                    {feat.title}
                  </h3>
                  <p className="text-[12px] text-[#4b5563] font-medium leading-relaxed max-w-[180px] mx-auto">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}