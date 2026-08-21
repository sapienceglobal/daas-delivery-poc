'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCms } from '@/context/CmsContext';

const PACKAGES = [
  {
    id: 'basic',
    name: 'Basic Package',
    price: 12.99,
    popular: true,
    image: '/images/branded/lassi-lounge/catering/Basic Packages .webp',
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
    image: '/images/branded/lassi-lounge/catering/Premium Package.webp',
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
    image: '/images/branded/lassi-lounge/catering/Deluxe Package.webp',
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
  const { cmsData } = useCms();

  const packagesToDisplay = cmsData?.cateringPackages?.length > 0 
    ? cmsData.cateringPackages 
    : PACKAGES;

  const [currentIndex, setCurrentIndex] = useState(Math.floor(packagesToDisplay.length / 2));

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(packagesToDisplay.length - 1, prev + 1));
  };

  const handleCardClick = (idx) => {
    if (idx !== currentIndex) {
      setCurrentIndex(idx);
    }
  };

  return (
    <div className="w-full relative overflow-hidden bg-white">
      
      {/* Header Section */}
      <div className="text-center mb-6 relative z-10">
        <div className="inline-block mb-3 px-4 py-1.5 bg-[#fef2f2] text-[#8b0000] text-xs font-bold uppercase tracking-widest rounded-full border border-[#fecaca]">
          Exclusive Deals
        </div>
        <div className="flex items-center gap-4 mb-3 justify-center">
          <div className="flex items-center hidden sm:flex">
            <div className="w-12 h-[2px] bg-gradient-to-r from-transparent to-[#7a0b10]"></div>
            <div className="w-2 h-2 rounded-full bg-[#7a0b10] mx-1"></div>
          </div>
          <h3 className="text-[32px] md:text-[42px] font-serif font-black text-[#1a1a1a] tracking-tight">
            Catering Packages
          </h3>
          <div className="flex items-center hidden sm:flex">
            <div className="w-2 h-2 rounded-full bg-[#7a0b10] mx-1"></div>
            <div className="w-12 h-[2px] bg-gradient-to-l from-transparent to-[#7a0b10]"></div>
          </div>
        </div>
        <p className="text-[15px] md:text-[17px] font-medium text-[#6b7280] max-w-xl mx-auto">
          Elevate your event with our carefully curated, premium dining packages designed to suit every occasion and budget.
        </p>
      </div>

      {/* 3D Coverflow Carousel Container - Height increased to 680px */}
      <div className="relative w-full max-w-[1400px] mx-auto h-[680px] flex items-center justify-center perspective-[1500px]">
        
        {/* Navigation Buttons */}
        <button 
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-[0_8px_30px_rgba(122,11,16,0.2)] flex items-center justify-center text-[#7a0b10] hover:bg-[#7a0b10] hover:text-white transition-all duration-300 disabled:opacity-0 z-50 border border-[#f3f4f6]"
        >
          <ChevronLeft className="w-7 h-7 -ml-0.5" />
        </button>
        <button 
          onClick={handleNext}
          disabled={currentIndex === packagesToDisplay.length - 1}
          className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white rounded-full shadow-[0_8px_30px_rgba(122,11,16,0.2)] flex items-center justify-center text-[#7a0b10] hover:bg-[#7a0b10] hover:text-white transition-all duration-300 disabled:opacity-0 z-50 border border-[#f3f4f6]"
        >
          <ChevronRight className="w-7 h-7 ml-0.5" />
        </button>

        {packagesToDisplay.map((pkg, idx) => {
          const offset = idx - currentIndex;
          
          const isCenter = offset === 0;
          const isLeft = offset < 0;
          const isRight = offset > 0;
          const absOffset = Math.abs(offset);
          
          const scale = isCenter ? 1 : Math.max(0.75, 1 - absOffset * 0.12);
          
          let translateX = '0%';
          if (absOffset > 0) {
            const shift = 110 + (absOffset - 1) * 35;
            translateX = isLeft ? `-${shift}%` : `${shift}%`;
          }

          const zIndex = 40 - absOffset * 10;
          const opacity = isCenter ? 1 : Math.max(0.3, 0.8 - absOffset * 0.2);
          const blur = isCenter ? '0px' : `${absOffset * 1.5}px`;
          const rotateY = isCenter ? '0deg' : isLeft ? '20deg' : '-20deg';

          return (
            <div 
              key={pkg.id || idx} 
              onClick={() => handleCardClick(idx)}
              // Card Height increased to 580px, Width adjusted for better proportion
              className={`absolute top-1/2 -translate-y-1/2 bg-white rounded-[24px] border border-[#f3f4f6] overflow-hidden flex flex-col w-[290px] sm:w-[320px] h-[580px] transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer
                ${isCenter ? 'shadow-[0_20px_50px_rgba(122,11,16,0.15)] ring-1 ring-[#7a0b10]/20' : 'shadow-lg'}
              `}
              style={{
                transform: `translate(-50%, -50%) translateX(${translateX}) scale(${scale}) rotateY(${rotateY})`,
                left: '50%',
                zIndex: zIndex,
                opacity: opacity,
                filter: `blur(${blur})`,
                pointerEvents: absOffset > 1 ? 'none' : 'auto'
              }}
            >
              {pkg.popular && (
                <div className="absolute top-4 left-0 bg-[#f5a623] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-r-lg z-20 shadow-md">
                  ★ POPULAR
                </div>
              )}
              
              {/* Image Height decreased to h-40 (160px) */}
              <div className="h-40 w-full bg-[#f9f9f9] shrink-0 relative overflow-hidden">
                <img 
                  src={pkg.image} 
                  alt={pkg.name}
                  onError={(e) => { e.target.src = '/images/branded/lassi-lounge/hero-spread.jpg' }}
                  className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                
                {!isCenter && (
                  <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px] z-20 transition-opacity duration-700 pointer-events-none" />
                )}
              </div>
              
              <div className="p-5 flex flex-col flex-1 bg-white relative z-30">
                <div className="text-center border-b border-[#f3f4f6] pb-3 mb-4 shrink-0">
                  <h4 className="text-[22px] font-black text-[#1a1a1a] mb-1 leading-tight">{pkg.name}</h4>
                  <p className="text-[10px] uppercase font-bold text-[#6b7280] mb-0.5 tracking-wider">Starting From</p>
                  <div className="flex items-baseline justify-center gap-1 text-[#7a0b10]">
                    <span className="text-[28px] font-black leading-none">${pkg.price}</span>
                    <span className="text-[12px] font-bold text-[#7a0b10]">/ Person</span>
                  </div>
                </div>
                
                {/* Features List - Space maximized for full visibility */}
                <ul className="space-y-3 mb-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                  {pkg.features?.map((feat, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${isCenter ? 'text-[#10b981]' : 'text-[#9ca3af]'}`} strokeWidth={3} />
                      <span className={`text-[13px] font-bold ${isCenter ? 'text-[#374151]' : 'text-[#6b7280]'}`}>{feat}</span>
                    </li>
                  ))}
                </ul>
                
                {/* Button Section */}
                <div className="mt-auto shrink-0 pt-2 bg-white">
                  <button 
                    onClick={(e) => {
                      if (isCenter) {
                        e.stopPropagation();
                        onContact(pkg.id || pkg.name);
                      }
                    }}
                    disabled={!isCenter}
                    className={`w-full py-3.5 rounded-xl border-2 text-[14px] font-black uppercase tracking-wider transition-all duration-300
                      ${isCenter 
                        ? 'border-[#7a0b10] bg-[#7a0b10] text-white hover:bg-[#5a080b] hover:border-[#5a080b] hover:shadow-lg' 
                        : 'border-[#e5e7eb] text-[#9ca3af] bg-[#f9fafb]'
                      }
                    `}
                  >
                    {isCenter ? 'Contact Us' : 'View Details'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}} />
    </div>
  );
}