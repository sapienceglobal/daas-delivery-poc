'use client';

import { useCms } from '@/context/CmsContext';

export default function BookTableHero() {
  const { cmsData, loadingCms } = useCms();
  
  const heroImage = cmsData?.heroBanners?.bookTable || "/images/branded/lassi-lounge/hero-spread.jpg";

  return (
    <section className="relative w-full min-h-[460px] bg-[#0a0a0a] flex items-center overflow-hidden">
      
      {/* Background Image Container */}
      <div className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${loadingCms ? 'opacity-0' : 'opacity-100'}`}>
        {!loadingCms && (
          <div 
            className="absolute inset-0 bg-cover bg-center md:bg-[center_right_-10%] bg-no-repeat opacity-90 transition-all duration-700"
            style={{ backgroundImage: `url('${heroImage}')` }}
          />
        )}
      </div>
      
      {/* Heavy Gradient Overlay (Matches the image: Very dark on left, fading to right) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/85 to-transparent md:w-[75%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[1240px] mx-auto px-6 md:px-12 py-16 text-left">
        <div className="max-w-[500px]">
          
          {/* Subheading - Golden Cursive */}
          <h2 
            className="text-[28px] md:text-[46px] text-[#e8a020] mb-0 drop-shadow-md font-medium tracking-wide"
            style={{ fontFamily: "'Dancing Script', 'Great Vibes', cursive, serif", fontStyle: 'italic' }}
          >
            Reserve Your Table
          </h2>
          
          {/* Main Heading - Tall, Bold, Tight Spacing */}
          <h1 className="text-[48px] md:text-[88px] font-black text-white uppercase tracking-tighter leading-[0.85] mb-4 md:mb-5 drop-shadow-2xl font-sans" style={{ transform: 'scaleY(1.05)', transformOrigin: 'left' }}>
            BOOK A TABLE
          </h1>
          
          {/* Description Paragraph - Exact Line Wrap matching the image */}
          <p className="max-w-[430px] text-[14px] md:text-[17px] text-white/90 leading-[1.5] md:leading-[1.6] font-medium drop-shadow-md">
            Whether it's a cozy dinner for two or a celebration with your loved ones, we've got the perfect spot for you.
          </p>
          
        </div>
      </div>
    </section>
  );
}