'use client';

import { Bike, UtensilsCrossed, ShieldCheck, RefreshCw } from 'lucide-react';

export default function ValuePropsBar() {
  const props = [
    {
      icon: Bike,
      title: 'On-Time Delivery',
      desc: 'We ensure on-time delivery at your doorstep.',
    },
    {
      icon: UtensilsCrossed,
      title: 'Freshly Prepared',
      desc: 'Your food is prepared fresh after you place the order.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Payment',
      desc: '100% secure payment and data protection.',
    },
    {
      icon: RefreshCw,
      title: 'Easy Returns',
      desc: 'Not satisfied? Get quick refunds with no hassle.',
    },
  ];

  return (
    <div className="mt-8 rounded-2xl border border-[#e5e7eb] bg-[#ffffff] shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#e5e7eb]">
        {props.map((p, idx) => {
          const Icon = p.icon;
          return (
            <div key={idx} className="flex gap-4 items-center p-6 bg-[#ffffff]">
              
              {/* Icon Container matching the image style */}
              <div className="p-3.5 bg-[#fcedec] rounded-full text-[#7a0b10] shrink-0">
                <Icon className="w-6 h-6 stroke-[1.5]" />
              </div>
              
              {/* Text Content */}
              <div>
                <h4 className="font-bold text-[14px] text-[#1a1a1a] mb-1 leading-tight">
                  {p.title}
                </h4>
                <p className="text-[12px] font-medium text-[#6b7280] leading-relaxed">
                  {p.desc}
                </p>
              </div>
              
            </div>
          );
        })}
      </div>
    </div>
  );
}