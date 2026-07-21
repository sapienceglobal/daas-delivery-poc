'use client';

import { Heart, Gift, Briefcase, Users, GraduationCap, Music } from 'lucide-react';

const OCCASIONS = [
  {
    icon: Heart,
    title: 'Weddings',
    image: '/images/branded/lassi-lounge/catering/wedding.jpg'
  },
  {
    icon: Gift,
    title: 'Birthday Parties',
    image: '/images/branded/lassi-lounge/catering/birthday.jpg'
  },
  {
    icon: Briefcase,
    title: 'Corporate Events',
    image: '/images/branded/lassi-lounge/catering/corporate.jpg'
  },
  {
    icon: Users,
    title: 'Family Gatherings',
    image: '/images/branded/lassi-lounge/catering/family.jpg'
  },
  {
    icon: GraduationCap,
    title: 'School & College Events',
    image: '/images/branded/lassi-lounge/catering/school.jpg'
  },
  {
    icon: Music,
    title: 'Religious & Cultural Events',
    image: '/images/branded/lassi-lounge/catering/cultural.jpg'
  }
];

export default function CateringOccasions() {
  return (
    <section className="py-16 max-w-[1200px] mx-auto px-6">
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <div className="flex items-center">
          <div className="w-8 h-[1px] bg-[#b47b80]"></div>
          <div className="w-1.5 h-1.5 rounded-full border border-[#b47b80] mx-1"></div>
          <div className="w-8 h-[1px] bg-[#b47b80]"></div>
        </div>
        <h3 className="text-[28px] font-serif font-black text-[#1a1a1a] text-center">
          Perfect For Every Occasion
        </h3>
        <div className="flex items-center">
          <div className="w-8 h-[1px] bg-[#b47b80]"></div>
          <div className="w-1.5 h-1.5 rounded-full border border-[#b47b80] mx-1"></div>
          <div className="w-8 h-[1px] bg-[#b47b80]"></div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {OCCASIONS.map((occ, idx) => {
          const Icon = occ.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-[#eadfdb] overflow-hidden shadow-sm flex flex-col group hover:shadow-md transition-shadow">
              <div className="p-4 flex flex-col items-center justify-center text-center gap-2 flex-1">
                <Icon className="h-7 w-7 text-[#7a0b10]" strokeWidth={1.5} />
                <h4 className="text-[12px] font-black text-[#1a1a1a] leading-tight">{occ.title}</h4>
              </div>
              <div className="h-28 w-full overflow-hidden">
                <img 
                  src={occ.image} 
                  alt={occ.title}
                  onError={(e) => { e.target.src = '/images/branded/lassi-lounge/hero-spread.jpg' }} // Fallback
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
