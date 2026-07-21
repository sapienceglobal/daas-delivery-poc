'use client';

const OCCASIONS = [
  {
    title: 'Romantic Dinner',
    desc: 'A cozy ambiance for you and your loved one.',
    image: '/images/branded/lassi-lounge/hero-spread.jpg' // Using placeholder that fits
  },
  {
    title: 'Family Gathering',
    desc: 'Spacious seating for memorable family meals.',
    image: '/images/branded/lassi-lounge/dishes/veg-thali.jpg'
  },
  {
    title: 'Celebrations',
    desc: 'Make birthdays & anniversaries extra special.',
    image: '/images/branded/lassi-lounge/dishes/samosa-chaat.jpg'
  },
  {
    title: 'Business Meetings',
    desc: 'Professional setting for your important meetings.',
    image: '/images/branded/lassi-lounge/dishes/mango-lassi.jpg'
  },
  {
    title: 'Private Events',
    desc: 'Customized arrangements for your private parties.',
    image: '/images/branded/lassi-lounge/dishes/chicken-tikka-masala.jpg'
  }
];

export default function PerfectSettingGrid() {
  return (
    <section className="py-12 max-w-[1200px] mx-auto px-6">
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <div className="flex items-center">
          <div className="w-8 h-[1px] bg-[#b47b80]"></div>
          <div className="w-1.5 h-1.5 rounded-full border border-[#b47b80] mx-1"></div>
          <div className="w-8 h-[1px] bg-[#b47b80]"></div>
        </div>
        <h3 className="text-[24px] font-serif font-black text-[#7a0b10] text-center">
          The Perfect Setting For Every Occasion
        </h3>
        <div className="flex items-center">
          <div className="w-8 h-[1px] bg-[#b47b80]"></div>
          <div className="w-1.5 h-1.5 rounded-full border border-[#b47b80] mx-1"></div>
          <div className="w-8 h-[1px] bg-[#b47b80]"></div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {OCCASIONS.map((occ, idx) => (
          <div key={idx} className="group cursor-pointer">
            <div className="overflow-hidden rounded-xl border border-[#eadfdb] bg-white shadow-sm mb-4 aspect-[4/3]">
              <img 
                src={occ.image} 
                alt={occ.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="text-center px-1">
              <h4 className="text-[14px] font-black text-[#7a0b10] mb-1.5">{occ.title}</h4>
              <p className="text-[12px] font-medium text-[#6b7280] leading-relaxed">{occ.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
