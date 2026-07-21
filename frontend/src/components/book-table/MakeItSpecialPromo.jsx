'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function MakeItSpecialPromo() {
  const params = useParams();
  const id = params?.id || 'lassi-lounge';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3b0606] to-[#5a0c0c] p-6 text-white shadow-[0_4px_24px_rgba(0,0,0,0.1)] mt-6 flex items-center justify-between">
      
      {/* Content */}
      <div className="relative z-10 max-w-[65%]">
        <h3 className="font-serif text-[22px] font-black text-[#f5a623] mb-2 leading-tight drop-shadow-sm">
          Make It Special!
        </h3>
        <p className="text-[12.5px] leading-relaxed text-white/95 font-medium mb-5">
          Celebrate your special moments with our delicious food and custom arrangements.
        </p>
        <Link 
          href={`/customer/restaurant/${id}/catering`}
          className="rounded-lg bg-[#f5a623] px-5 py-2.5 text-[11px] font-black uppercase tracking-wider text-[#1a1a1a] shadow-sm hover:bg-[#e09214] transition-colors flex items-center justify-center gap-1 inline-flex mt-2"
        >
          EXPLORE CATERING &rarr;
        </Link>
      </div>

      {/* Image */}
      <div className="absolute right-0 bottom-0 h-full w-[45%] flex items-end justify-end pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-[#5a0c0c] to-transparent w-1/3 left-0 z-10" />
        <img
          src="/images/branded/lassi-lounge/dishes/mango-lassi.jpg"
          alt="Catering"
          className="h-[120%] w-full object-cover object-left opacity-90 rounded-r-2xl mask-image-gradient"
          style={{ maskImage: 'linear-gradient(to right, transparent, black 40%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 40%)' }}
        />
      </div>
    </div>
  );
}
