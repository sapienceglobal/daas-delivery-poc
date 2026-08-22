import React from 'react';

export default function MenuHero() {
  return (
    <div 
      className="relative h-[280px] md:h-[360px] lg:h-[420px] w-full overflow-hidden flex items-center bg-cover bg-center"
      style={{ backgroundImage: `url('/images/branded/lassi-lounge/menu-hero.jpg')` }}
    >
      {/* 1. deepened dark gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#000000] via-[#000000]/80 to-transparent/20" />
      
      {/* 2. using max-w-[1550px] to align with rest of the page */}
      <div className="relative mx-auto max-w-[1550px] px-4 md:px-6 lg:px-8 w-full text-left mt-10">
        
        <h1 className="font-serif font-black text-[#ffffff] text-5xl md:text-[64px] lg:text-[72px] tracking-tight mb-2 leading-none">
          Our Menu
        </h1>
        
        {/* 3. keeping arrows out of cursive font for clarity */}
        <p className="text-[#e8a020] text-xl md:text-2xl lg:text-[28px] mb-5 flex items-center gap-3">
          <span className="font-sans font-light text-[18px] md:text-[22px]">⟷</span>
          <span style={{ fontFamily: "'Dancing Script', cursive" }}>Fresh Ingredients, Authentic Flavors</span>
          <span className="font-sans font-light text-[18px] md:text-[22px]">⟷</span>
        </p>
        
        <p className="text-[#f7f3ec] max-w-[420px] text-[14px] leading-relaxed">
          Handcrafted Indian dishes made with the finest ingredients and traditional recipes.
        </p>
        
      </div>
    </div>
  );
}