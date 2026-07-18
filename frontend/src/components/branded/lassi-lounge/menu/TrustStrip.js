import React from 'react';

export default function TrustStrip({ items }) {
  return (

    <div className="bg-transparent py-8 mt-4">
   
      <div className="mx-auto max-w-[1350px] px-4 md:px-6 lg:px-8">
        
        
        <div className="bg-[#ffffff] border border-[#e5e7eb] rounded-2xl shadow-sm py-6 lg:py-8 flex flex-col lg:flex-row items-center justify-between divide-y lg:divide-y-0 lg:divide-x divide-[#e5e7eb]">
          
          {items.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-4 px-6 xl:px-10 py-4 lg:py-0 w-full flex-1">
              
            
              <div className="shrink-0">
                 <feat.icon className="h-9 w-9 text-[#7a0b10]" strokeWidth={1.5} />
              </div>
              
            
              <div className="flex flex-col">
              
                <h4 className="text-[14px] font-bold text-[#1a1a1a] tracking-tight">
                  {feat.label}
                </h4>
                <p className="text-[12px] text-[#6b7280] mt-1 leading-snug">
                  {feat.desc}
                </p>
              </div>
              
            </div>
          ))}
          
        </div>
        
      </div>
    </div>
  );
}