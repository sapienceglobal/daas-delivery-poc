'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import DishCard from '@/components/ui/DishCard';
import { Skeleton } from '@/components/ui';
import { signatureDishesContent } from '../config';
import { restaurantAPI } from '@/lib/api';

export default function SignatureDishesSection() {
  const eyebrow = signatureDishesContent?.eyebrow || 'Our Signature Dishes';
  const viewFullMenuCta = signatureDishesContent?.viewFullMenuCta || {
    label: 'View Full Menu',
    href: '/customer/restaurant/lassi-lounge?tab=menu'
  };
  const fallbackDishes = signatureDishesContent?.dishes || [];

  const [dishes, setDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRealSignatureDishes() {
      try {
        // Enforce a minimum 800ms loading time so the user sees the skeleton gracefully
        const [res] = await Promise.all([
          restaurantAPI.getById('lassi-lounge'),
          new Promise(r => setTimeout(r, 800))
        ]);
        const restaurantData = res?.data;
        if (restaurantData?.menu?.length > 0) {
          // Flatten menu items from all categories in MongoDB
          const allItems = restaurantData.menu.reduce((acc, cat) => acc.concat(cat.items || []), []);
          
          // Select signature / bestseller dishes or first 6 dishes
          const bestsellers = allItems.filter(i => i.isBestseller || i.isAvailable !== false);
          if (bestsellers.length > 0) {
            setDishes(bestsellers.slice(0, 6));
          } else if (allItems.length > 0) {
            setDishes(allItems.slice(0, 6));
          }
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
    <section className="bg-background-alt on-cream w-full pb-2 pt-4 select-none">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 text-accent-400">
              <div className="h-px w-10 bg-accent-400" />
              <ArrowRight size={14} strokeWidth={2} />
            </div>
            <h2 className="font-heading font-bold text-2xl text-text">{eyebrow}</h2>
            <div className="hidden md:flex items-center gap-1 text-accent-400">
              <ArrowLeft size={14} strokeWidth={2} />
              <div className="h-px w-10 bg-accent-400" />
            </div>
          </div>

          <Button
            href={viewFullMenuCta.href}
            variant="custom"
            className="bg-background border border-accent-400 text-accent-400 hover:bg-surface font-bold text-xs uppercase tracking-widest py-2.5 px-5 rounded-md shadow-sm inline-flex items-center gap-1.5"
          >
            {viewFullMenuCta.label} <ArrowRight size={14} strokeWidth={2.5} />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="w-full h-64 rounded-2xl" style={{ backgroundColor: 'rgba(200, 200, 200, 0.5)' }} />
            ))
          ) : (
            (dishes || []).map((dish) => (
              <div key={dish._id || dish.id} className="animate-in fade-in zoom-in-95 duration-500 ease-out fill-mode-both">
                <DishCard item={dish} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}