import Image from 'next/image';
import { Star } from 'lucide-react';

export default function TestimonialCard({ rating, quote, name, location, avatar }) {
  return (
 <div className="bg-[#FCF9F4] border border-[#F0E6D8] rounded-xl shadow-sm p-8 h-full min-h-[280px] flex flex-col">
      <div className="flex items-center gap-1 text-[#E7A73E] mb-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={18} fill={i < rating ? 'currentColor' : 'none'} strokeWidth={1} />
        ))}
      </div>

     
      <p className="text-text-secondary text-sm leading-relaxed flex-1 font-medium mb-6">&ldquo;{quote}&rdquo;</p>

      <div className="flex items-center gap-4">
        <span className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border-2 border-[#D9A441] shadow-sm">
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        </span>
        <span>
     
          <span className="block text-sm font-bold text-text">{name}</span>
        
          <span className="block text-xs text-text-secondary mt-0.5">{location}</span>
        </span>
      </div>
    </div>
  );
}