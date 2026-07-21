'use client';

export default function BookTableHero() {
  return (
    <section className="relative w-full min-h-[460px] bg-[#0a0a0a] flex items-center overflow-hidden">
      
      {/* Background Image Container */}
      <div className="absolute inset-0 w-full h-full">
        {/* Note: Ensure the image path points to the beautiful candle-light table image you shared */}
        <div 
          className="absolute inset-0 bg-cover bg-center md:bg-[center_right_-10%] bg-no-repeat opacity-90"
          style={{ backgroundImage: "url('/images/branded/lassi-lounge/hero-spread.jpg')" }}
        />
      </div>
      
      {/* Heavy Gradient Overlay (Matches the image: Very dark on left, fading to right) */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/85 to-transparent md:w-[75%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-[1240px] mx-auto px-6 md:px-12 py-16 text-left">
        <div className="max-w-[500px]">
          
          {/* Subheading - Golden Cursive */}
          <h2 
            className="text-[34px] md:text-[46px] text-[#e8a020] mb-0 drop-shadow-md font-medium tracking-wide"
            style={{ fontFamily: "'Dancing Script', 'Great Vibes', cursive, serif", fontStyle: 'italic' }}
          >
            Reserve Your Table
          </h2>
          
          {/* Main Heading - Tall, Bold, Tight Spacing */}
          <h1 className="text-[64px] md:text-[88px] font-black text-white uppercase tracking-tighter leading-[0.85] mb-5 drop-shadow-2xl font-sans" style={{ transform: 'scaleY(1.05)', transformOrigin: 'left' }}>
            BOOK A TABLE
          </h1>
          
          {/* Description Paragraph - Exact Line Wrap matching the image */}
          <p className="max-w-[430px] text-[15px] md:text-[17px] text-white/90 leading-[1.6] font-medium drop-shadow-md">
            Whether it's a cozy dinner for two or a celebration with your loved ones, we've got the perfect spot for you.
          </p>
          
        </div>
      </div>
    </section>
  );
}