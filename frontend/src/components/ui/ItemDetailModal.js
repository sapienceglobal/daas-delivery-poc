'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus } from 'lucide-react';

// Common Dish Image generator
const getDishImage = (itemName = '') => {
  const name = itemName.toLowerCase();
  if (name.includes('butter chicken')) return '/images/branded/lassi-lounge/dishes/butter-chicken.jpg';
  if (name.includes('rogan josh') || name.includes('lamb')) return '/images/branded/lassi-lounge/dishes/lamb-rogan-josh.jpg';
  if (name.includes('paneer tikka')) return '/images/branded/lassi-lounge/dishes/paneer-tikka.jpg';
  if (name.includes('biryani')) return '/images/branded/lassi-lounge/dishes/chicken-biryani.jpg';
  if (name.includes('dal makhani')) return '/images/branded/lassi-lounge/dishes/dal-makhani.jpg';
  if (name.includes('lassi')) return '/images/branded/lassi-lounge/dishes/mango-lassi.jpg';
  if (name.includes('roll') || name.includes('spring')) return '/images/branded/lassi-lounge/dishes/veg-spring-rolls.png';
  if (name.includes('tikka masala')) return 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&q=80';
  if (name.includes('palak paneer')) return 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=80';
  if (name.includes('naan') || name.includes('bread')) return 'https://images.unsplash.com/photo-1605333396914-22b0c36b1328?auto=format&fit=crop&w=400&q=80';
  if (name.includes('corn')) return 'https://images.unsplash.com/photo-1626804475297-41609ea004eb?auto=format&fit=crop&w=400&q=80';
  return 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
};

// ── Safe Portal Modal (Fixes Scroll & UI issues) ──────────────────────────
export function PortalModal({ isOpen, onClose, title, children, size = 'md' }) {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      setMounted(true);
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => setShow(true));
    } else {
      setShow(false);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      timeoutId = setTimeout(() => setMounted(false), 300);
    }
    return () => {
      clearTimeout(timeoutId);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 select-none">
      <div
        className={`absolute inset-0 bg-[#000000]/60 backdrop-blur-sm transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <div className={`relative z-10 w-full ${sizes[size] || sizes.md} bg-[#ffffff] border border-[#e5e7eb] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-all duration-300 ${show ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}>

        <div className="flex items-center justify-between p-5 sm:p-6 pb-3 shrink-0 border-b border-[#e5e7eb]/50">
          {title && <h3 className="text-[20px] font-bold font-serif text-[#1a1a1a]">{title}</h3>}
          <button onClick={onClose} className="ml-auto rounded-lg p-2 text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f9fafb] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto font-sans ll-soft-scroll">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}


// ── Item Detail Modal (Fixed Colors) ──────────────────────────────────────────
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

  return (
    <PortalModal isOpen={true} onClose={onClose} title={hasCustomizations ? `Customize — ${item.name}` : item.name} size="md">
      <img src={item.image || getDishImage(item.name)} alt={item.name} className="w-full h-48 object-cover rounded-xl mb-4 ll-pop" />

      <p className="text-[13px] text-[#6b7280] mb-5 leading-relaxed">{item.description}</p>

      <div className="flex flex-wrap gap-2 mb-5">
        {item.isVeg && <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-1 rounded-md uppercase tracking-wider">Vegetarian</span>}
        {item.isVegan && <span className="text-[10px] bg-green-100 text-green-800 font-bold px-2 py-1 rounded-md uppercase tracking-wider">Vegan</span>}
        {item.isSpicy && <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-1 rounded-md uppercase tracking-wider">Spicy</span>}
        {item.isGlutenFree && <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded-md uppercase tracking-wider">Gluten-Free</span>}
        {item.isBestseller && <span className="text-[10px] bg-[#e8a020] text-[#1a1a1a] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Bestseller</span>}
      </div>

      {/* Size Variations */}
      {item.sizeVariations?.length > 0 && (
        <div className="mb-5">
          <h4 className="text-[13px] font-bold text-[#1a1a1a] mb-2.5">Size</h4>
          <div className="flex flex-wrap gap-2.5">
            {item.sizeVariations.map(size => (
              <button
                key={size.name}
                onClick={() => setSelectedSize(size)}
                className={`rounded-xl px-4 py-2.5 text-[12px] font-bold border shadow-sm ll-interactive ll-focus-ring
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
                  onClick={() => toggleAddOn(addon)}
                  className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-[13px] border shadow-sm ll-interactive ll-focus-ring
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
      <div className="mb-5">
        <h4 className="text-[13px] font-bold text-[#1a1a1a] mb-2.5">Special Instructions</h4>
        <textarea
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          placeholder="E.g. No onions, extra spicy, etc."
          className="w-full rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-3 text-[13px] text-[#1a1a1a] placeholder:text-[#9ca3af] focus:border-[#7a0b10] focus:ring-1 focus:ring-[#7a0b10] outline-none transition-all resize-none shadow-sm ll-focus-ring h-20"
        />
      </div>

      {/* Quantity & Add to Cart */}
      <div className="flex items-center justify-between mt-6 pt-5 border-t border-[#e5e7eb]">
        <div className="flex items-center border border-[#e5e7eb] rounded-lg h-11 bg-[#ffffff] shadow-sm">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3.5 text-[#7a0b10] hover:bg-[#f9fafb] h-full flex items-center justify-center transition-colors ll-focus-ring" aria-label="Decrease quantity">
            <Minus className="h-4 w-4" strokeWidth={2.5} />
          </button>
          <div className="w-px h-full bg-[#e5e7eb]"></div>
          <span className="text-[15px] font-bold text-[#1a1a1a] w-10 text-center">{quantity}</span>
          <div className="w-px h-full bg-[#e5e7eb]"></div>
          <button onClick={() => setQuantity(quantity + 1)} className="px-3.5 text-[#7a0b10] hover:bg-[#f9fafb] h-full flex items-center justify-center transition-colors ll-focus-ring" aria-label="Increase quantity">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>

        <button
          onClick={() => { onAdd(item, quantity, selectedSize, selectedAddOns, specialInstructions); onClose(); }}
          className="bg-[#7a0b10] hover:bg-[#5e080c] text-[#ffffff] font-bold h-11 py-2 px-5 rounded-lg shadow-md text-[13px] tracking-wider uppercase flex items-center justify-center gap-2 ll-interactive ll-focus-ring"
        >
          Add to Cart — ${lineTotal.toFixed(2)}
        </button>
      </div>
    </PortalModal>
  );
}
