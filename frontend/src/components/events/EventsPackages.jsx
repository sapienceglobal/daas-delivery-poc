'use client';

import { Check, ArrowRight } from 'lucide-react';

const PACKAGES = [
  {
    name: 'BASIC',
    price: '$12.99',
    img: '/images/events/event_package_basic_1784613847760.png',
    isPopular: false,
    items: [
      '2 Appetizers',
      '1 Main Course',
      '1 Rice / Bread',
      'Salad & Pickle',
      'Disposable Cutlery'
    ]
  },
  {
    name: 'POPULAR',
    price: '$18.99',
    img: '/images/events/event_package_popular_1784613869072.png',
    isPopular: true,
    items: [
      '3 Appetizers',
      '2 Main Course',
      '1 Rice & 2 Breads',
      'Salad, Raita & Pickle',
      'Dessert',
      'Disposable Cutlery'
    ]
  },
  {
    name: 'PREMIUM',
    price: '$24.99',
    img: '/images/events/event_package_premium_1784613881720.png',
    isPopular: false,
    items: [
      '4 Appetizers',
      '3 Main Course',
      '2 Rice & 2 Breads',
      'Salad, Raita, Pickle & Papad',
      'Dessert',
      'Premium Disposable Cutlery'
    ]
  }
];

export default function EventsPackages({ onCustomize }) {
  return (
    <section className="w-full bg-[#fdfaf6] pb-10 px-6 md:px-10">
      <div className="max-w-[1300px] mx-auto flex flex-col lg:flex-row gap-12 lg:gap-10 items-start">
        
        {/* Left Side: Intro */}
        <div className="lg:w-[26%] pt-4">
          <h2 
            className="text-[34px] text-[#cba052] leading-none mb-1"
            style={{ fontFamily: "'Dancing Script', 'Great Vibes', cursive, serif" }}
          >
            Our
          </h2>
          <h1 className="text-[32px] md:text-[34px] font-black text-[#7a0b10] uppercase tracking-tighter mb-4 leading-tight">
            EVENT PACKAGES
          </h1>
          <p className="text-[#4b5563] text-[14px] mb-6 leading-relaxed font-medium pr-2">
            Choose from our customizable packages designed to suit your needs and budget.
          </p>
          <button 
            onClick={onCustomize}
            className="group flex items-center justify-center space-x-2 border border-[#7a0b10] text-[#7a0b10] px-5 py-2 rounded-md font-bold text-[12px] hover:bg-[#fffbf7] transition-colors shadow-sm"
          >
            <span>CUSTOMIZE YOUR EVENT</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
          </button>
        </div>

        {/* Right Side: Packages */}
        <div className="lg:w-[74%] w-full grid grid-cols-1 md:grid-cols-3 gap-5">
          {PACKAGES.map((pkg, idx) => (
            <div 
              key={idx} 
              className={`bg-[#fffdfa] rounded-xl overflow-hidden flex flex-col relative transition-transform duration-300 ${
                pkg.isPopular 
                  ? 'border-[1.5px] border-[#7a0b10] shadow-[0_8px_24px_rgba(122,11,16,0.12)] -translate-y-2' 
                  : 'border border-[#f0e6e2] shadow-sm hover:shadow-md hover:-translate-y-1 mt-2'
              }`}
            >
              {/* Ribbon */}
              <div 
                className={`absolute top-0 left-0 text-[10px] font-black px-4 py-1 uppercase tracking-widest z-10 
                  ${pkg.isPopular ? 'bg-[#7a0b10] text-white' : 'bg-[#eab308] text-[#1a1a1a]'}`
                }
                style={{ clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 100%)", minWidth: "90px" }}
              >
                {pkg.name}
              </div>
              
              {/* Image */}
              <div className="h-[120px] w-full relative">
                <img src={pkg.img} alt={pkg.name} className="w-full h-full object-cover" />
              </div>
              
              {/* Content */}
              <div className="p-4 flex flex-col flex-1">
                {/* Pricing */}
                <div className="flex items-baseline mb-4 border-b border-[#f0e6e2] pb-3">
                  <span className="text-[24px] font-black text-[#7a0b10] tracking-tight">{pkg.price}</span>
                  <span className="text-[11px] font-bold text-[#9ca3af] ml-1">/ Per Person</span>
                </div>
                
                {/* List Items */}
                <ul className="space-y-2 mb-5 flex-1">
                  {pkg.items.map((item, i) => (
                    <li key={i} className="flex items-center text-[12px] text-[#4b5563] font-semibold">
                      <div className="w-[14px] h-[14px] rounded-full bg-[#f3e9e9] flex items-center justify-center mr-2 shrink-0">
                        <Check className="w-2.5 h-2.5 text-[#7a0b10]" strokeWidth={3} />
                      </div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Card Button */}
                <button 
                  onClick={() => onCustomize(pkg.name)}
                  className="w-full py-2 bg-[#7a0b10] text-white text-[12px] font-bold tracking-wider rounded-md hover:bg-[#680307] transition-colors shadow-sm"
                >
                  CHOOSE PACKAGE
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}