'use client';

import { Truck, UtensilsCrossed, ShieldCheck, RotateCcw } from 'lucide-react';

export default function TrustStrip() {
  const items = [
    { icon: Truck, title: 'On-Time Delivery', desc: 'We ensure on-time delivery at your doorstep.' },
    { icon: UtensilsCrossed, title: 'Freshly Prepared', desc: 'Your food is prepared fresh after you place the order.' },
    { icon: ShieldCheck, title: 'Secure Payment', desc: '100% secure payment and data protection.' },
    { icon: RotateCcw, title: 'Easy Returns', desc: 'Not satisfied? Get quick refunds with no hassle.' },
  ];

  return (
    <section className="mt-10 rounded-2xl border-2 border-[#f0e6e2] bg-[#fbfaf7] overflow-hidden shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x-2 divide-[#f0e6e2]">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-center gap-4 px-6 py-6 group hover:bg-[#fff8ed] transition-colors duration-300">
              <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center border-2 border-[#f0e6e2] shadow-sm group-hover:border-[#e8a020] transition-colors">
                <Icon className="h-6 w-6 text-[#7a0b10]" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <h4 className="text-[14px] font-black text-[#1a1a1a]">{item.title}</h4>
                <p className="mt-1 text-[12px] font-medium leading-relaxed text-[#6b7280]">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}