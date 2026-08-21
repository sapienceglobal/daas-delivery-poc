'use client';

import { Leaf, ShieldCheck, ClipboardList, ChefHat, Clock, Phone } from 'lucide-react';
import { useBrand } from '@/context/BrandContext';

const FEATURES = [
  {
    icon: Leaf,
    title: 'Authentic Taste',
    desc: 'Traditional recipes made with fresh & quality ingredients.'
  },
  {
    icon: ShieldCheck,
    title: 'Hygienic Preparation',
    desc: 'We follow strict hygiene standards for your safety.'
  },
  {
    icon: ClipboardList,
    title: 'Customizable Menus',
    desc: 'Tailor-made menus to match your preferences.'
  },
  {
    icon: ChefHat,
    title: 'Professional Service',
    desc: 'Experienced team ensures a seamless experience.'
  },
  {
    icon: Clock,
    title: 'On-time Delivery',
    desc: 'We value your time and deliver on schedule.'
  }
];

export default function CateringWhyChooseUs() {
  const { brand, isSingleRestaurantMode } = useBrand();
  
  let phoneValue = brand?.phone || brand?.businessInfo?.businessPhone || (isSingleRestaurantMode ? '5166120300' : '18005550199');
  
  // Format phone if it's 10 or 11 digits
  const numericPhone = phoneValue.replace(/\D/g, '');
  let phoneLabel = phoneValue;
  if (numericPhone.length === 10) {
    phoneLabel = `(${numericPhone.substring(0,3)}) ${numericPhone.substring(3,6)}-${numericPhone.substring(6,10)}`;
  } else if (numericPhone.length === 11 && numericPhone.startsWith('1')) {
    phoneLabel = `+1 (${numericPhone.substring(1,4)}) ${numericPhone.substring(4,7)}-${numericPhone.substring(7,11)}`;
  }

  return (
    <div className="w-full bg-[#fdfbf7] rounded-2xl border border-[#eadfdb] p-8 shadow-sm h-full">
      <h3 className="text-[20px] md:text-[24px] font-serif font-black text-[#7a0b10] leading-tight mb-8">
        Why Choose<br/>Lassi Lounge Catering?
      </h3>
      
      <div className="space-y-6 mb-8">
        {FEATURES.map((feat, idx) => (
          <div key={idx} className="flex items-start gap-4">
            <div className="mt-0.5">
              <feat.icon className="h-6 w-6 text-[#7a0b10]" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="text-[14px] font-black text-[#1a1a1a] mb-1 leading-none">{feat.title}</h4>
              <p className="text-[12px] font-medium text-[#4b5563] leading-snug">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>
      
      <a 
        href={`tel:${numericPhone}`}
        className="w-full py-4 rounded-xl bg-[#7a0b10] text-white flex items-center justify-center gap-2 hover:bg-[#680307] transition-colors shadow-md"
      >
        <Phone className="h-5 w-5" />
        <span className="text-[15px] font-bold tracking-wide">{phoneLabel}</span>
      </a>
    </div>
  );
}
