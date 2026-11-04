'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import DishCard from '@/components/ui/DishCard';
import { Skeleton } from '@/components/ui';
import { signatureDishesContent } from '../config';
import { restaurantAPI } from '@/lib/api';
import { getItemUrl } from '@/lib/slugUtils';

export default function SignatureDishesSection() {
  const eyebrow = signatureDishesContent?.eyebrow || 'Our Signature Dishes';
  const viewFullMenuCta = signatureDishesContent?.viewFullMenuCta || {
    label: 'View Full Menu',
    href: '/menu'
  };
  const fallbackDishes = signatureDishesContent?.dishes || [];

  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadRealSignatureDishes() {
      try {
        // enforce a minimum 800ms loading time so the user sees the skeleton gracefully
        const [res] = await Promise.all([
          restaurantAPI.getById('lassi-lounge'),
          new Promise(r => setTimeout(r, 800))
        ]);
        const restaurantData = res?.data;
        if (restaurantData?.menu?.length > 0) {
          // flatten menu items from all categories in MongoDB
          const allItems = restaurantData.menu.reduce((acc, cat) => acc.concat(cat.items || []), []);
          
          // filter only available items
          const availableItems = allItems.filter(i => i.isAvailable !== false);
          
          // 1. Try to get actual bestsellers
          let bestsellers = availableItems.filter(i => i.isBestseller);
          
          // 2. If not enough bestsellers, pick the highest priced premium items
          if (bestsellers.length < 6) {
            const others = availableItems
              .filter(i => !i.isBestseller && !i.name.toLowerCase().includes('water'))
              .sort((a, b) => b.price - a.price); // Highest price first
            bestsellers = [...bestsellers, ...others];
          }
          
          // set top 6
          setDishes(bestsellers.slice(0, 6));
        }
      } catch (err) {
        console.error('Using fallback signature dishes:', err);
        setDishes(fallbackDishes);
      } finally {
        setIsLoading(false);
      }
    }
    loadRealSignatureDishes();
  }, []);

  return (
    <section className="bg-background-alt on-cream w-full pb-8 pt-4 select-none overflow-x-hidden">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-row items-center justify-between mb-6 md:mb-8 gap-2">
          <h2 className="font-bold text-xl sm:text-2xl md:text-3xl text-[#0e0d0c] tracking-tight">
            Our <span className="text-[#cd131b]">Signature</span> Dishes
          </h2>

          <Link
            href={viewFullMenuCta.href}
            className="text-[#cd131b] hover:text-[#9e141a] font-bold text-xs sm:text-sm md:text-base inline-flex items-center gap-1 transition-colors whitespace-nowrap"
          >
            <span>{viewFullMenuCta.label}</span>
            <ArrowRight size={15} strokeWidth={2.5} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="w-full h-64 rounded-2xl" style={{ backgroundColor: 'rgba(200, 200, 200, 0.5)' }} />
            ))
          ) : (
            (dishes || []).map((dish) => (
              <div 
                key={dish._id || dish.id} 
                onClick={() => {
                  router.push(getItemUrl(dish));
                }}
                className="animate-in fade-in zoom-in-95 duration-500 ease-out fill-mode-both cursor-pointer h-full"
              >
                <DishCard item={dish} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}