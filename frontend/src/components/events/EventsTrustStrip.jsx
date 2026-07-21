'use client';

import { Utensils, Leaf, Users, Truck, DollarSign } from 'lucide-react';

const REASONS = [
  { icon: Utensils, text: 'Authentic Indian\nFlavors' },
  { icon: Leaf, text: 'Hygienic & Fresh\nIngredients' },
  { icon: Users, text: 'Experienced &\nProfessional Team' },
  { icon: Truck, text: 'On-time Delivery\n& Setup' },
  { icon: DollarSign, text: 'Affordable\nPricing' },
];

export default function EventsTrustStrip() {
  return (
    <section className="w-full bg-[#fdfaf6] pb-10 px-6 md:px-10">
      <div className="max-w-[1300px] mx-auto">
        <div className="w-full bg-[#f6efe9] rounded-2xl overflow-hidden flex flex-col xl:flex-row items-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#e5dcd3] relative">
          
          {/* Left Side Background Image with Fade */}
          <div className="absolute left-0 top-0 bottom-0 w-[30%] hidden xl:block z-0">
            <img 
              src="/images/events/event_package_popular_1784613869072.png" 
              alt="Delicious Indian Food" 
              className="w-full h-full object-cover"
            />
            {/* Gradient to fade into the background color */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f6efe9]/60 to-[#f6efe9]"></div>
          </div>

          <div className="w-full flex flex-col xl:flex-row items-center justify-between py-6 px-8 relative z-10">
            
            {/* Title Section */}
            <div className="xl:w-[35%] xl:pl-[25%] shrink-0 text-center xl:text-left mb-6 xl:mb-0">
              <h2 className="text-[22px] md:text-[26px] font-black text-[#7a0b10] uppercase tracking-wide leading-tight">
                WHY CHOOSE LASSI LOUNGE
              </h2>
            </div>

            {/* Features Row */}
            <div className="flex flex-wrap justify-center xl:flex-nowrap xl:justify-end items-center gap-y-6 gap-x-6 w-full xl:w-[65%]">
              {REASONS.map((reason, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="flex items-center gap-3">
                    <div className="text-[#7a0b10] shrink-0">
                      <reason.icon className="w-[30px] h-[30px]" strokeWidth={1.5} />
                    </div>
                    <p className="text-[12px] font-bold text-[#1a1a1a] whitespace-pre-line leading-tight">
                      {reason.text}
                    </p>
                  </div>
                  {/* Vertical Divider (Except for last item) */}
                  {idx !== REASONS.length - 1 && (
                    <div className="hidden xl:block h-10 w-[1px] bg-[#d1bfae] ml-6 opacity-60"></div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
