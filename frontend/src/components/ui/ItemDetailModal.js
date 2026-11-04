'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus } from 'lucide-react';

// common Dish Image generator
const getDishImage = (itemName = '') => {
  const name = itemName.toLowerCase();
  if (name.includes('butter chicken')) return '/images/branded/lassi-lounge/dishes/butter-chicken.png';
  if (name.includes('cheese naan')) return '/images/branded/lassi-lounge/dishes/cheese-naan.jpg';
  if (name.includes('chicken pakora')) return '/images/branded/lassi-lounge/dishes/chicken-pakora.jpg';
  if (name.includes('chicken tikka masala')) return '/images/branded/lassi-lounge/dishes/chicken-tikka-masala.jpg';
  if (name.includes('garlic naan')) return '/images/branded/lassi-lounge/dishes/garlic-naan.png';
  if (name.includes('kesar badam') || name.includes('badam milk') || name.includes('kesarbadammilk')) return '/images/branded/lassi-lounge/dishes/kesar-badam-milk.jpg';
  if (name.includes('rogan josh') || name.includes('lamb')) return '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
  if (name.includes('masala chai') || name.includes('tea')) return '/images/branded/lassi-lounge/dishes/masala-chai.jpg';
  if (name.includes('salt lassi') || name.includes('salted lassi')) return '/images/branded/lassi-lounge/dishes/salt-lassi.jpg';
  if (name.includes('sweet lassi')) return '/images/branded/lassi-lounge/dishes/sweet-lassi.jpg';
  if (name.includes('mango lassi')) return '/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
  if (name.includes('samosa')) return '/images/branded/lassi-lounge/dishes/samosa.jpg';
  if (name.includes('tandoori chiken') || name.includes('tandoori chicken')) return '/images/branded/lassi-lounge/dishes/tandoori-chiken.png';
  if (name.includes('paneer tikka')) return '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
  if (name.includes('tandoori roti')) return '/images/branded/lassi-lounge/dishes/tandoori-roti.png';
  if (name.includes('biryani')) return '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
  if (name.includes('dal makhani')) return '/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
  if (name.includes('roll') || name.includes('spring')) return '/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
};

// ── Safe Portal Modal (Fixes Scroll & UI issues) ──────────────────────────
export function PortalModal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      setMounted(true);
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
      // safe delay for initial render before animating in
      timeoutId = setTimeout(() => setShow(true), 30);
    } else {
      setShow(false);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      timeoutId = setTimeout(() => setMounted(false), 250);
    }
    return () => { 
      clearTimeout(timeoutId);
      document.body.style.overflow = ''; 
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    // trigger exit animation
    setShow(false);
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    setTimeout(() => {
      if (onClose) onClose();
    }, 250);
  };

  if (!mounted) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-[#000000]/65 backdrop-blur-[2px] transition-opacity duration-300 ease-out ${show ? 'opacity-100' : 'opacity-0'}`} 
        onClick={handleClose} 
      />

      {/* Modal Dialog / Mobile Bottom Sheet */}
      <div className={`relative z-10 w-full ${sizes[size] || sizes.md} bg-white border border-[#e5e7eb] rounded-t-[28px] sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 sm:scale-95 translate-y-full sm:translate-y-4'}`}>
        
        {/* Mobile Pull Indicator */}
        <div className="sm:hidden w-full flex justify-center pt-2.5 pb-1 shrink-0 bg-white">
          <div className="w-10 h-1.5 bg-stone-300/80 rounded-full" />
        </div>

        {/* Modal Sticky Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 pb-3 shrink-0 border-b border-[#e5e7eb]/70 bg-white">
          {title && <h3 className="text-lg sm:text-[20px] font-bold font-serif text-[#1a1a1a] pr-2 truncate">{title}</h3>}
          <button 
            type="button"
            onClick={handleClose} 
            className="ml-auto rounded-full p-2 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f9fafb] active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto font-sans ll-soft-scroll flex-1">
          {children}
        </div>

        {/* Pinned Sticky Footer (Never hidden or squished) */}
        {footer && (
          <div className="p-3.5 sm:p-5 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] sm:pb-5 border-t border-[#e5e7eb] bg-white shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}


// ── Item Detail Modal (Fixed Colors & Responsive Buttons) ────────────────────
export default function ItemDetailModal({ item, onClose, onAdd }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(item.sizeVariations?.[0] || null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const basePrice = selectedSize?.price || item.price;
  const addOnTotal = selectedAddOns.reduce((s, a) => s + (a.price || 0), 0);
  const lineTotal = (basePrice + addOnTotal) * quantity;

  const toggleAddOn = (addon) => {
    setSelectedAddOns(prev => {
      const exists = prev.find(a => a.name === addon.name);
      return exists ? prev.filter(a => a.name !== addon.name) : [...prev, addon];
    });
  };

  const hasCustomizations =
    (item.sizeVariations && item.sizeVariations.length > 0) ||
    (item.addOns && item.addOns.length > 0);

  // Pinned Footer with Responsive Stepper + Full-Width CTA
  const footerContent = (
    <div className="flex items-center gap-2.5 sm:gap-3">
      {/* Quantity Stepper */}
      <div className="flex items-center border border-stone-300 rounded-xl h-11 sm:h-12 bg-stone-50/90 shadow-2xs shrink-0 overflow-hidden">
        <button 
          type="button"
          onClick={() => setQuantity(Math.max(1, quantity - 1))} 
          className="w-9 sm:w-10 h-full text-[#7a0b10] hover:bg-stone-100 active:scale-95 flex items-center justify-center transition-colors cursor-pointer" 
          aria-label="Decrease quantity"
        >
          <Minus className="h-4 w-4" strokeWidth={2.6} />
        </button>
        <span className="text-sm sm:text-base font-extrabold text-[#1a1a1a] w-7 sm:w-8 text-center tabular-nums">
          {quantity}
        </span>
        <button 
          type="button"
          onClick={() => setQuantity(quantity + 1)} 
          className="w-9 sm:w-10 h-full text-[#7a0b10] hover:bg-stone-100 active:scale-95 flex items-center justify-center transition-colors cursor-pointer" 
          aria-label="Increase quantity"
        >
          <Plus className="h-4 w-4" strokeWidth={2.6} />
        </button>
      </div>

      {/* Add to Cart CTA Button - Single line, never awkward line-breaks */}
      <button
        type="button"
        onClick={() => { onAdd(item, quantity, selectedSize, selectedAddOns, specialInstructions); onClose(); }}
        className="flex-1 h-11 sm:h-12 px-3.5 sm:px-5 rounded-xl bg-gradient-to-r from-[#7a0b10] via-[#5c0612] to-[#7a0b10] hover:from-[#5c0612] hover:to-[#4a070c] active:scale-[0.98] text-white font-extrabold text-xs sm:text-[13px] tracking-wide uppercase shadow-[0_6px_18px_rgba(122,11,16,0.32)] flex items-center justify-between transition-all cursor-pointer whitespace-nowrap min-w-0"
      >
        <span className="truncate">Add to Cart</span>
        <span className="flex items-center gap-1 bg-black/25 px-2 sm:px-2.5 py-1 rounded-lg text-xs sm:text-sm font-black text-[#F5B53D] shrink-0 ml-1.5 sm:ml-2">
          ${lineTotal.toFixed(2)}
        </span>
      </button>
    </div>
  );

  return (
    <PortalModal 
      isOpen={true} 
      onClose={onClose} 
      title={hasCustomizations ? `Customize — ${item.name}` : item.name} 
      footer={footerContent}
      size="md"
    >
      <img src={item.image || getDishImage(item.name)} alt={item.name} className="w-full h-44 sm:h-48 object-cover rounded-xl mb-4 ll-pop shadow-2xs" />

      <p className="text-[13px] text-[#6b7280] mb-5 leading-relaxed">{item.description}</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {item.isVeg && <span className="text-[10px] bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Vegetarian</span>}
        {item.isVegan && <span className="text-[10px] bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Vegan</span>}
        {item.isSpicy && <span className="text-[10px] bg-[#fee2e2] text-[#991b1b] border border-[#fecaca] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Spicy</span>}
        {item.isGlutenFree && <span className="text-[10px] bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Gluten-Free</span>}
        {item.isBestseller && <span className="text-[10px] bg-[#ffedd5] text-[#9a3412] border border-[#fed7aa] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Bestseller</span>}
      </div>

      {/* Size Variations */}
      {item.sizeVariations?.length > 0 && (
        <div className="mb-5">
          <h4 className="text-[13px] font-bold text-[#1a1a1a] mb-2.5">Size</h4>
          <div className="flex flex-wrap gap-2.5">
            {item.sizeVariations.map(size => (
              <button
                key={size.name}
                type="button"
                onClick={() => setSelectedSize(size)}
                className={`rounded-xl px-4 py-2.5 text-[12px] font-bold border shadow-sm ll-interactive ll-focus-ring cursor-pointer
                  ${selectedSize?.name === size.name
                    ? 'bg-[#7a0b10] text-[#ffffff] border-[#7a0b10]'
                    : 'bg-[#ffffff] text-[#6b7280] border-[#e5e7eb] hover:border-[#7a0b10]'
                  }`}
              >
                {size.name} — ${size.price.toFixed(2)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add-ons */}
      {item.addOns?.length > 0 && (
        <div className="mb-5">
          <h4 className="text-[13px] font-bold text-[#1a1a1a] mb-2.5">Add-ons</h4>
          <div className="space-y-2.5">
            {item.addOns.map(addon => {
              const isSelected = selectedAddOns.some(a => a.name === addon.name);
              return (
                <button
                  key={addon.name}
                  type="button"
                  onClick={() => toggleAddOn(addon)}
                  className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-[13px] border shadow-sm ll-interactive ll-focus-ring cursor-pointer
                    ${isSelected
                      ? 'bg-[#7a0b10]/10 text-[#7a0b10] border-[#7a0b10]/30 font-bold'
                      : 'bg-[#ffffff] text-[#6b7280] border-[#e5e7eb] hover:border-[#7a0b10]/30 font-medium'
                    }`}
                >
                  <span>{addon.name}</span>
                  <span className={isSelected ? 'text-[#7a0b10]' : 'text-[#1a1a1a]'}>+${addon.price.toFixed(2)}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Special Instructions */}
      <div className="mb-2">
        <h4 className="text-[13px] font-bold text-[#1a1a1a] mb-2.5">Special Instructions</h4>
        <textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="E.g. No onions, extra spicy, etc."
          className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-3 text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] outline-none transition-all resize-none shadow-sm ll-focus-ring h-20"
        />
      </div>
    </PortalModal>
  );
}
