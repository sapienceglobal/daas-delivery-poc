'use client';

import { CheckCircle2 } from 'lucide-react';

const PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Package',
    price: 12.99,
    popular: true,
    image: '/images/branded/lassi-lounge/catering/basic-package.jpg',
    features: [
      '2 Appetizers',
      '2 Main Course',
      '1 Rice',
      '1 Bread',
      'Salad & Pickle',
      'Disposable Cutlery'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Package',
    price: 18.99,
    popular: false,
    image: '/images/branded/lassi-lounge/catering/premium-package.jpg',
    features: [
      '3 Appetizers',
      '3 Main Course',
      '1 Rice',
      '2 Breads',
      'Salad, Raita & Pickle',
      'Dessert',
      'Disposable Cutlery'
    ]
  },
  {
    id: 'deluxe',
    name: 'Deluxe Package',
    price: 24.99,
    popular: false,
    image: '/images/branded/lassi-lounge/catering/deluxe-package.jpg',
    features: [
      '4 Appetizers',
      '4 Main Course',
      '2 Rice',
      '2 Breads',
      'Salad, Raita, Pickle & Papad',
      'Dessert',
      'Premium Disposable Cutlery'
    ]
  }
];

export default function CateringPackages({ onContact }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col items-center justify-center mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center">
            <div className="w-8 h-[1px] bg-[#b47b80]"></div>
            <div className="w-1.5 h-1.5 rounded-full border border-[#b47b80] mx-1"></div>
            <div className="w-8 h-[1px] bg-[#b47b80]"></div>
          </div>
          <h3 className="text-[28px] font-serif font-black text-[#1a1a1a]">
            Catering Packages
          </h3>
          <div className="flex items-center">
            <div className="w-8 h-[1px] bg-[#b47b80]"></div>
            <div className="w-1.5 h-1.5 rounded-full border border-[#b47b80] mx-1"></div>
            <div className="w-8 h-[1px] bg-[#b47b80]"></div>
          </div>
        </div>
        <p className="text-[14px] font-medium text-[#6b7280]">
          Customizable packages to suit your needs and budget
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PACKAGES.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-2xl border border-[#eadfdb] overflow-hidden shadow-sm flex flex-col relative">
            {pkg.popular && (
              <div className="absolute top-4 left-0 bg-[#f5a623] text-[#1a1a1a] text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-r-md z-10 shadow-sm">
                POPULAR
              </div>
            )}
            
            <div className="h-40 w-full bg-[#f9f9f9]">
              <img 
                src={pkg.image} 
                alt={pkg.name}
                onError={(e) => { e.target.src = '/images/branded/lassi-lounge/hero-spread.jpg' }}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-6 flex flex-col flex-1">
              <div className="text-center border-b border-[#eadfdb] pb-4 mb-4">
                <h4 className="text-[16px] font-black text-[#7a0b10] mb-1">{pkg.name}</h4>
                <p className="text-[10px] uppercase font-bold text-[#9ca3af] mb-1">Starting From</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-[22px] font-black text-[#1a1a1a]">${pkg.price}</span>
                  <span className="text-[12px] font-medium text-[#6b7280]">/ Per Person</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8 flex-1">
                {pkg.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#4ade80] shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-[13px] font-bold text-[#4b5563]">{feat}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => onContact(pkg.id)}
                className="w-full py-3 rounded-lg border border-[#7a0b10] text-[#7a0b10] text-[13px] font-black uppercase tracking-wider hover:bg-[#7a0b10] hover:text-white transition-colors"
              >
                CONTACT US
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
