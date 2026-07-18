import { ArrowRight, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import DishCard from '@/components/ui/DishCard';
import { signatureDishesContent } from '../config';

/**
 * SignatureDishesSection — cream-background grid of 6 signature dish cards.
 * Centered heading with gold line+arrow accents on both sides, and a
 * black/gold-outline "View Full Menu" CTA in the top-right.
 *
 * Uses variant="custom" on the CTA Button — passing variant="solid" (the
 * default) here would apply bg-primary-600/text-white THEN try to override
 * with className, and Tailwind doesn't guarantee the className classes win
 * that fight (see Button.js comment). variant="custom" ships no color
 * classes at all, so there's nothing left to conflict with.
 */
export default function SignatureDishesSection() {
  const { eyebrow, viewFullMenuCta, dishes } = signatureDishesContent;

return (
 
    <section className="bg-background-alt on-cream w-full pb-2 pt-4">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1 text-accent-400">
              <div className="h-px w-10 bg-accent-400" />
              <ArrowRight size={14} strokeWidth={2} />
            </div>
            {/* 2. यहाँ text-black की जगह text-text किया गया है */}
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
          {dishes.map((dish) => (
            <DishCard key={dish.id} item={dish} />
          ))}
        </div>
      </div>
    </section>
  );
}