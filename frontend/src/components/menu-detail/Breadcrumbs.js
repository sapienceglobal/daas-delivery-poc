'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ restaurant, category, itemName, isSingleRestaurant }) {
  const primaryColorClass = isSingleRestaurant ? 'text-[#7a0b10] hover:text-[#5e080c]' : 'text-[#6b52ff] hover:text-[#4a3aff]';

  return (
    <nav className="flex items-center gap-2 text-[14px] font-medium text-[#4b5563] py-4 select-none">
      <Link href="/" className="hover:text-[#1a1a1a] transition-colors">
        Home
      </Link>
      <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" />
      
      {isSingleRestaurant ? (
        <Link href="/customer/restaurant/lassi-lounge" className="hover:text-[#1a1a1a] transition-colors">
          Menu
        </Link>
      ) : (
        <Link href={`/customer/restaurant/${restaurant?._id}`} className="hover:text-[#1a1a1a] transition-colors">
          {restaurant?.name || 'Restaurant'}
        </Link>
      )}
      
      <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" />
      
      <span className="hover:text-[#1a1a1a] transition-colors capitalize">
        {category?.name || 'Appetizers'}
      </span>
      
      <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" />
      
      <span className={`font-bold ${primaryColorClass} tracking-wide`}>
        {itemName}
      </span>
    </nav>
  );
}